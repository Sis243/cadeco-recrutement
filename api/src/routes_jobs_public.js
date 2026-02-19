// api/src/routes_jobs_public.js
const { db } = require("./db");

async function listJobs(req, res) {
  try {
    const jobs = await db.job.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    });
    res.json(jobs);
  } catch (e) {
    console.error("listJobs error:", e);
    res.status(500).json({ message: "Erreur serveur (jobs)." });
  }
}

module.exports = { listJobs };
