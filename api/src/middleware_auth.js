// api/src/middleware_auth.js
const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Non autorisé." });

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
    if (!payload) return res.status(401).json({ message: "Session invalide." });

    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Session invalide ou expirée." });
  }
}

module.exports = { requireAdmin };
