const express = require("express");
const db = require("./db");
const { sendMail, tplConfirmation } = require("./mailer");

const router = express.Router();

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
// body JSON:
// fullName, email, phone, city, experienceYears, choice1, choice2?, choice3?
// =============================
router.post("/apply", async (req, res) => {
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

    // éviter doublons
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

    const created = db.createApplication({
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      city: String(city).trim(),
      yearsExp: experienceYears != null ? Number(experienceYears) : 0,

      // 1er choix (compat)
      jobId: Number(c1),
      jobTitle: job1?.title || null,

      // ✅ 2e / 3e choix (nouveau)
      choice2Id: c2 ? Number(c2) : null,
      choice2Title: job2?.title || null,
      choice3Id: c3 ? Number(c3) : null,
      choice3Title: job3?.title || null,

      // pas de fichiers
      cvPath: null,
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
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// =============================
// GET /api/track?code=...
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