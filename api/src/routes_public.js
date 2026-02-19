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

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safe = (file.fieldname || "file") + "-" + Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, safe + ext);
  },
});

const upload = multer({
  storage,
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
// POST /api/apply
// (multipart/form-data)
// fields: fullName, email, phone, city, jobId, experienceYears
// files: cv (PDF), idDoc (PDF/JPG/PNG) optionnel
// =============================
router.post(
  "/apply",
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "idDoc", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { fullName, email, phone, city, jobId, experienceYears } = req.body;

      if (!fullName || !email || !phone) {
        return res.status(400).json({ message: "Nom, email et téléphone requis." });
      }
      if (!jobId) {
        return res.status(400).json({ message: "Poste requis." });
      }

      const cv = req.files?.cv?.[0];
      if (!cv) return res.status(400).json({ message: "CV requis." });

      const idDoc = req.files?.idDoc?.[0];

      // job title (pour stocker en texte aussi)
      const jobs = db.getJobs();
      const job = jobs.find((j) => String(j.id) === String(jobId));

      const created = db.createApplication({
        fullName,
        email,
        phone,
        city: city || null,
        yearsExp: experienceYears != null ? Number(experienceYears) : 0,
        jobId: Number(jobId),
        jobTitle: job?.title || null,
        cvPath: path.join(UPLOAD_DIR, cv.filename),
        idPath: idDoc ? path.join(UPLOAD_DIR, idDoc.filename) : null,
      });

      // ========== EMAIL ==========
      try {
        await sendMail({
          to: String(email),
          subject: "CADECO — Confirmation de candidature",
          html: tplConfirmation({
            fullName: String(fullName),
            trackingCode: created.trackingcode || created.trackingCode,
          }),
        });
      } catch (mailErr) {
        console.error("MAIL CONFIRM ERROR:", mailErr);
        // on n'échoue pas la candidature si l'email rate
      }
      // ===========================

      res.json({
        message: "Candidature enregistrée",
        trackingCode: created.trackingcode || created.trackingCode,
        data: created,
      });
    } catch (e) {
      console.error("APPLY ERROR:", e);
      res.status(500).json({ message: "Erreur serveur." });
    }
  }
);

// =============================
// GET /api/track?code=CD-2026-XXXXXX
// =============================
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
