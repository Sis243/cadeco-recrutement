// api/src/routes_public.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("./db");
const { sendMail, tplConfirmation } = require("./mailer");

const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const uploadPath = path.join(__dirname, "..", UPLOAD_DIR);
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// ✅ Upload CV uniquement (PDF)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safe = `cv-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, safe + ext);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mime = String(file.mimetype || "").toLowerCase();

  const isPdf = ext === ".pdf" || mime === "application/pdf";
  if (!isPdf) return cb(new Error("CV invalide. Seul le PDF est autorisé."), false);

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// =============================
// GET /api/jobs
// =============================
router.get("/jobs", (req, res) => {
  try {
    const jobs = db.getJobs();
    res.json({ data: jobs });
  } catch (e) {
    console.error("GET JOBS ERROR:", e);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// =============================
// POST /api/apply (multipart/form-data)
// fields: fullName, email, phone, city, experienceYears, choice1, choice2?, choice3?
// file: cv (pdf)
// =============================
router.post("/apply", upload.single("cv"), async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      city,
      experienceYears,
      choice1,
      choice2,
      choice3,
    } = req.body || {};

    if (!fullName || !email || !phone) {
      return res.status(400).json({ message: "Nom, email et téléphone requis." });
    }
    if (!city || !String(city).trim()) {
      return res.status(400).json({ message: "La ville est obligatoire." });
    }
    if (!choice1) {
      return res.status(400).json({ message: "Le 1er poste (choice1) est requis." });
    }

    // ✅ CV obligatoire (si tu veux le rendre optionnel, dis-moi)
    if (!req.file) {
      return res.status(400).json({ message: "Veuillez joindre votre CV en PDF (champ cv)." });
    }

    const c1 = String(choice1);
    const c2 = choice2 ? String(choice2) : "";
    const c3 = choice3 ? String(choice3) : "";

    if (c2 && c2 === c1) {
      return res.status(400).json({ message: "Le 2e choix doit être différent du 1er." });
    }
    if (c3 && (c3 === c1 || (c2 && c3 === c2))) {
      return res.status(400).json({ message: "Le 3e choix doit être différent des autres choix." });
    }

    const jobs = db.getJobs();
    const job1 = jobs.find((j) => String(j.id) === c1);
    const job2 = c2 ? jobs.find((j) => String(j.id) === c2) : null;
    const job3 = c3 ? jobs.find((j) => String(j.id) === c3) : null;

    // ✅ chemin public du CV
    const cvRelPath = `${UPLOAD_DIR}/${req.file.filename}`;

    const created = db.createApplication({
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      city: String(city).trim(),
      yearsExp: experienceYears != null ? Number(experienceYears) : 0,

      jobId: Number(c1),
      jobTitle: job1?.title || null,

      choice2Id: c2 ? Number(c2) : null,
      choice2Title: job2?.title || null,
      choice3Id: c3 ? Number(c3) : null,
      choice3Title: job3?.title || null,

      // ✅ CV uniquement
      cvPath: cvRelPath,
      idPath: null,
    });

    // EMAIL
    try {
      await sendMail({
        to: String(email),
        subject: "CADECO — Confirmation de candidature",
        html: tplConfirmation({
          fullName: String(fullName),
          trackingCode: created.trackingCode || created.trackingcode,
        }),
      });
    } catch (mailErr) {
      console.error("MAIL CONFIRM ERROR:", mailErr);
    }

    res.json({
      message: "Candidature enregistrée",
      trackingCode: created.trackingCode || created.trackingcode,
      data: created,
    });
  } catch (e) {
    console.error("APPLY ERROR:", e);

    // ✅ message clair si CV non PDF
    const msg = String(e?.message || "");
    if (msg.includes("Seul le PDF")) {
      return res.status(400).json({ message: msg });
    }

    res.status(500).json({ message: "Erreur serveur." });
  }
});

router.get("/track", (req, res) => {
  try {
    const code = String(req.query.code || "").trim();
    if (!code) return res.status(400).json({ message: "Code requis." });

    const row = db.getApplicationByTracking(code);
    if (!row) return res.status(404).json({ message: "Candidature introuvable." });

    res.json({ data: row });
  } catch (e) {
    console.error("TRACK ERROR:", e);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

module.exports = router;