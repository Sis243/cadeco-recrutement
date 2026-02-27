// api/src/routes_admin.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const db = require("./db");
const { sendMail, tplStatusChange } = require("./mailer");
const { buildCandidaturePdf } = require("./pdf");

const router = express.Router();

function signToken(admin) {
  const secret = process.env.JWT_SECRET || "change-me";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, secret, {
    expiresIn,
  });
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

//////////////////////////////////////////////////////////////
// SEED ADMIN
//////////////////////////////////////////////////////////////
router.post("/seed", (req, res) => {
  try {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    const role = process.env.SEED_ADMIN_ROLE || "ADMIN";

    if (!email || !password) {
      return res.status(400).json({
        message: "SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD requis dans .env",
      });
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

//////////////////////////////////////////////////////////////
// LOGIN ADMIN
//////////////////////////////////////////////////////////////
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Courriel et mot de passe requis." });
    }

    const admin = db.findAdminByEmail(email);
    if (!admin) return res.status(401).json({ message: "Identifiants invalides." });

    if (Number(admin.isActive) !== 1) {
      return res.status(403).json({ message: "Compte désactivé." });
    }

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

//////////////////////////////////////////////////////////////
// LISTE CANDIDATURES
//////////////////////////////////////////////////////////////
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

//////////////////////////////////////////////////////////////
// UPDATE STATUS
//////////////////////////////////////////////////////////////
router.put("/applications/:id/status", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body || {};

    if (!status) return res.status(400).json({ message: "Statut requis." });

    const before = db.getApplicationById(id);
    const row = db.updateApplicationStatus(id, status);

    if (!row) return res.status(404).json({ message: "Candidature introuvable." });

    // ✅ Audit (optionnel, mais utile)
    try {
      db.addAudit({
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        action: "UPDATE_STATUS",
        entity: "applications",
        entityId: String(id),
        meta: { from: before?.status || null, to: row.status },
        ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null,
      });
    } catch (e) {
      console.error("AUDIT ERROR:", e);
    }

    // EMAIL (optionnel)
    try {
      await sendMail({
        to: row.email,
        subject: "CADECO — Mise à jour de votre candidature",
        html: tplStatusChange({
          fullName: row.fullName,
          trackingCode: row.trackingCode,
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

//////////////////////////////////////////////////////////////
// PDF CANDIDATURE PRO (via pdf.js)
//////////////////////////////////////////////////////////////
router.get("/applications/:id/fiche.pdf", auth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = db.getApplicationById(id);

    if (!row) return res.status(404).send("Candidature introuvable.");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="candidature-${row.trackingCode || row.trackingcode || id}.pdf"`
    );

    const doc = buildCandidaturePdf({ appRow: row });
    doc.pipe(res);
  } catch (e) {
    console.error("PDF ERROR:", e);
    res.status(500).send("Erreur génération PDF.");
  }
});

//////////////////////////////////////////////////////////////
// ✅ PURGE TEST DATA (optionnel) : supprimer candidatures + logs
//////////////////////////////////////////////////////////////
router.post("/purge/applications", auth, (req, res) => {
  try {
    const { confirm } = req.body || {};
    if (String(confirm || "").toUpperCase() !== "PURGE") {
      return res.status(400).json({ message: "Confirmation requise: confirm=PURGE" });
    }

    const result = db.purgeApplications();
    res.json({ message: "Candidatures supprimées", deleted: result.deleted });
  } catch (e) {
    console.error("PURGE ERROR:", e);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

module.exports = router;