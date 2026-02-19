require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const db = require("./src/db");

const app = express();

const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ Uploads static ============
const uploadPath = path.join(__dirname, UPLOAD_DIR);
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
app.use("/uploads", express.static(uploadPath));

// ============ Health ============
app.get("/", (req, res) => res.send("API CADECO RECRUTEMENT OK ✅"));

// ============ INIT DB ============
try {
  db.init(); // crée tables + seed jobs + seed admin (via .env)
  console.log("✅ DB ready");
} catch (e) {
  console.error("❌ DB init error:", e);
}

// ============ Routes ============
app.use("/api", require("./src/routes_public"));
app.use("/api/admin", require("./src/routes_admin"));

// ============ 404 ============
app.use((req, res) => res.status(404).json({ message: "Route introuvable." }));

// ============ Error handler ============
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ message: "Erreur serveur." });
});

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
