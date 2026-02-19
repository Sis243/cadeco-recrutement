const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");
const PDFDocument = require("pdfkit");

const { sendMail, tplStatusChange } = require("./mailer");

const router = express.Router();

function signToken(admin) {
  const secret = process.env.JWT_SECRET || "change-me";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, secret, { expiresIn });
}

function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Non autorisé." });

    const secret = process.env.JWT_SECRET || "change-me";
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token invalide." });
  }
}

// =============================
// POST /api/admin/seed
// =============================
router.post("/seed", (req, res) => {
  try {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    const role = process.env.SEED_ADMIN_ROLE || "ADMIN";

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD requis dans .env" });
    }

    const row = db.seedAdminIfMissing({ email, password, role });

    res.json({
      message: "Seed admin OK",
      email: row.email,
      role: row.role,
      isActive: row.isActive,
    });
  } catch (e) {
    console.error("SEED ERROR:", e);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// =============================
// POST /api/admin/login
// body: { email, password }
// =============================
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Courriel et mot de passe requis." });
    }

    const admin = db.findAdminByEmail(email);
    if (!admin) return res.status(401).json({ message: "Identifiants invalides." });
    if (Number(admin.isActive) !== 1) return res.status(403).json({ message: "Compte désactivé." });

    const ok = bcrypt.compareSync(String(password), String(admin.passwordHash));
    if (!ok) return res.status(401).json({ message: "Identifiants invalides." });

    const token = signToken(admin);
    res.json({
      token,
      admin: { id: admin.id, email: admin.email, role: admin.role },
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// =============================
// GET /api/admin/applications?q=...
// =============================
router.get("/applications", auth, (req, res) => {
  try {
    const q = req.query.q || "";
    const limit = req.query.limit || 200;
    const offset = req.query.offset || 0;

    const rows = db.listApplications({ q, limit, offset });
    res.json({ data: rows });
  } catch (e) {
    console.error("LIST APPS ERROR:", e);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// =============================
// PUT /api/admin/applications/:id/status
// body: { status }
// =============================
router.put("/applications/:id/status", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Statut requis." });
    }

    const row = db.updateApplicationStatus(id, status);
    if (!row) {
      return res.status(404).json({ message: "Candidature introuvable." });
    }

    // EMAIL (optionnel)
    try {
      await sendMail({
        to: row.email,
        subject: "CADECO — Mise à jour de votre candidature",
        html: tplStatusChange({
          fullName: row.fullname || row.fullName,
          trackingCode: row.trackingcode || row.trackingCode,
          status: row.status,
        }),
      });
    } catch (mailErr) {
      console.error("MAIL STATUS ERROR:", mailErr);
    }

    res.json({ message: "Statut mis à jour", data: row });
  } catch (e) {
    console.error("UPDATE STATUS ERROR:", e);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// =============================
// ✅ GET /api/admin/applications/:id/fiche.pdf
// Téléchargement PDF sécurisé
// =============================
router.get("/applications/:id/fiche.pdf", auth, (req, res) => {
  try {
    const id = req.params.id;
    const row = db.getApplicationById(id);
    if (!row) return res.status(404).send("Candidature introuvable.");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="candidature-${row.trackingCode || row.id}.pdf"`
    );

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    doc.fontSize(18).text("CADECO — FICHE DE CANDIDATURE", { align: "center" });
    doc.moveDown(1);

    doc.fontSize(12);
    doc.text(`Numéro de suivi : ${row.trackingCode || "-"}`);
    doc.text(`Statut : ${row.status || "-"}`);
    doc.text(`Créé le : ${row.createdAt ? new Date(row.createdAt).toLocaleString("fr-FR") : "-"}`);
    doc.moveDown(1);

    doc.fontSize(14).text("Identité", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Nom complet : ${row.fullName || "-"}`);
    doc.text(`Téléphone : ${row.phone || "-"}`);
    doc.text(`Email : ${row.email || "-"}`);
    doc.text(`Ville : ${row.city || "-"}`);
    doc.text(`Années d'expérience : ${row.yearsExp ?? 0}`);
    doc.moveDown(1);

    doc.fontSize(14).text("Poste visé", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`${row.jobTitle || row.jobId || "-"}`);
    doc.moveDown(1);

    doc.fontSize(14).text("Fichiers", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`CV : ${row.cvPath || "-"}`);
    doc.text(`Pièce d'identité : ${row.idPath || "-"}`);

    doc.moveDown(2);
    doc.fontSize(10).fillColor("gray").text("Document généré automatiquement — CADECO Recrutement.", {
      align: "center",
    });

    doc.end();
  } catch (e) {
    console.error("PDF ERROR:", e);
    res.status(500).send("Erreur génération PDF.");
  }
});

module.exports = router;
