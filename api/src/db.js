const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

let db;

function nowISO() {
  return new Date().toISOString();
}

function open() {
  if (db) return db;

  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = process.env.DB_PATH || path.join(dataDir, "cadeco.sqlite");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

function hasColumn(tableName, colName) {
  const rows = open().prepare(`PRAGMA table_info(${tableName})`).all();
  return rows.some((r) => String(r.name).toLowerCase() === String(colName).toLowerCase());
}

function addColumnIfMissing(tableName, colName, ddl) {
  if (!hasColumn(tableName, colName)) {
    open().prepare(`ALTER TABLE ${tableName} ADD COLUMN ${ddl}`).run();
  }
}

function initSchema() {
  const d = open();

  // JOBS
  d.prepare(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department TEXT,
      location TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    )
  `).run();

  // APPLICATIONS
  d.prepare(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      fullName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT,
      yearsExp INTEGER DEFAULT 0,

      jobId INTEGER,
      jobTitle TEXT,

      cvPath TEXT,
      idPath TEXT,

      status TEXT NOT NULL DEFAULT 'RECU',
      trackingCode TEXT NOT NULL UNIQUE,

      createdAt TEXT NOT NULL
    )
  `).run();

  // Migrations safe (si ancienne DB)
  addColumnIfMissing("applications", "yearsExp", "yearsExp INTEGER DEFAULT 0");
  addColumnIfMissing("applications", "jobId", "jobId INTEGER");
  addColumnIfMissing("applications", "jobTitle", "jobTitle TEXT");
  addColumnIfMissing("applications", "cvPath", "cvPath TEXT");
  addColumnIfMissing("applications", "idPath", "idPath TEXT");
  addColumnIfMissing("applications", "status", "status TEXT DEFAULT 'RECU'");
  addColumnIfMissing("applications", "trackingCode", "trackingCode TEXT");
  addColumnIfMissing("applications", "createdAt", "createdAt TEXT");

  // ADMINS
  d.prepare(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ADMIN',
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    )
  `).run();

  addColumnIfMissing("admins", "isActive", "isActive INTEGER NOT NULL DEFAULT 1");

  // AUDIT LOG
  d.prepare(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actorEmail TEXT,
      actorRole TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entityId TEXT,
      metaJson TEXT,
      ip TEXT,
      createdAt TEXT NOT NULL
    )
  `).run();
}

function seedJobsIfEmpty() {
  const d = open();
  const count = d.prepare(`SELECT COUNT(*) as c FROM jobs`).get().c;
  if (count > 0) return;

  const jobs = [
    "Chargés de relation avec les clients",
    "Délégués commerciaux",
    "Analystes crédits",
    "Contrôleurs permanents (internes)",
    "Agents de recouvrement",
    "Chef caissiers (Coordonnateur)",
    "Caissiers",
    "Auditeurs internes",
    "Informaticiens experts en réseaux",
    "Informaticiens experts en conception des systèmes",
    "Ressources Humaines",
  ];

  const ins = d.prepare(
    `INSERT INTO jobs (title, department, location, isActive, createdAt)
     VALUES (@title, @department, @location, 1, @createdAt)`
  );

  const tx = d.transaction(() => {
    for (const title of jobs) {
      ins.run({
        title,
        department: "CADECO",
        location: "Kinshasa",
        createdAt: nowISO(),
      });
    }
  });

  tx();
}

function seedAdminIfMissing({ email, password, role }) {
  const d = open();
  const row = d.prepare(`SELECT * FROM admins WHERE email = ?`).get(String(email || ""));
  if (row) return row;

  const hash = bcrypt.hashSync(String(password), 10);
  d.prepare(
    `INSERT INTO admins (email, passwordHash, role, isActive, createdAt)
     VALUES (?, ?, ?, 1, ?)`
  ).run(String(email), hash, role || "ADMIN", nowISO());

  return d.prepare(`SELECT * FROM admins WHERE email = ?`).get(String(email));
}

function trackCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `CD-${new Date().getFullYear()}-${s}`;
}

// PUBLIC
function getJobs() {
  return open()
    .prepare(`SELECT id, title, department, location FROM jobs WHERE isActive = 1 ORDER BY title ASC`)
    .all();
}

function createApplication(payload) {
  const d = open();
  const code = trackCode();

  const stmt = d.prepare(`
    INSERT INTO applications (
      fullName, email, phone, city, yearsExp,
      jobId, jobTitle, cvPath, idPath,
      status, trackingCode, createdAt
    )
    VALUES (
      @fullName, @email, @phone, @city, @yearsExp,
      @jobId, @jobTitle, @cvPath, @idPath,
      'RECU', @trackingCode, @createdAt
    )
  `);

  const info = stmt.run({
    fullName: String(payload.fullName || "").trim(),
    email: String(payload.email || "").trim(),
    phone: String(payload.phone || "").trim(),
    city: payload.city ? String(payload.city).trim() : null,
    yearsExp: payload.yearsExp != null ? Number(payload.yearsExp) : 0,
    jobId: payload.jobId != null ? Number(payload.jobId) : null,
    jobTitle: payload.jobTitle ? String(payload.jobTitle) : null,
    cvPath: payload.cvPath || null,
    idPath: payload.idPath || null,
    trackingCode: code,
    createdAt: nowISO(),
  });

  return d.prepare(`SELECT * FROM applications WHERE id = ?`).get(info.lastInsertRowid);
}

function getApplicationByTracking(trackingCode) {
  return open()
    .prepare(
      `SELECT id, fullName, email, phone, city, yearsExp, jobTitle, status, trackingCode, createdAt
       FROM applications
       WHERE trackingCode = ?`
    )
    .get(String(trackingCode || ""));
}

// ✅ NOUVEAU: pour PDF + détails admin
function getApplicationById(id) {
  return open()
    .prepare(`SELECT * FROM applications WHERE id = ?`)
    .get(Number(id));
}

// ADMIN
function findAdminByEmail(email) {
  return open().prepare(`SELECT * FROM admins WHERE email = ?`).get(String(email || ""));
}

function listApplications({ q, limit = 200, offset = 0 }) {
  const d = open();
  const query = String(q || "").trim();

  if (!query) {
    return d
      .prepare(
        `SELECT * FROM applications
         ORDER BY id DESC
         LIMIT ? OFFSET ?`
      )
      .all(Number(limit), Number(offset));
  }

  return d
    .prepare(
      `SELECT * FROM applications
       WHERE fullName LIKE ? OR email LIKE ? OR phone LIKE ? OR trackingCode LIKE ?
       ORDER BY id DESC
       LIMIT ? OFFSET ?`
    )
    .all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, Number(limit), Number(offset));
}

function updateApplicationStatus(id, status) {
  const d = open();
  d.prepare(`UPDATE applications SET status = ? WHERE id = ?`).run(String(status), Number(id));
  return d.prepare(`SELECT * FROM applications WHERE id = ?`).get(Number(id));
}

// AUDIT
function addAudit({ actorEmail, actorRole, action, entity, entityId, meta, ip }) {
  const d = open();
  d.prepare(
    `INSERT INTO audit_logs (actorEmail, actorRole, action, entity, entityId, metaJson, ip, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    actorEmail || null,
    actorRole || null,
    String(action || ""),
    entity || null,
    entityId != null ? String(entityId) : null,
    meta ? JSON.stringify(meta) : null,
    ip || null,
    nowISO()
  );
}

function init() {
  initSchema();
  seedJobsIfEmpty();

  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    seedAdminIfMissing({
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
      role: process.env.SEED_ADMIN_ROLE || "ADMIN",
    });
  }
}

module.exports = {
  init,

  // public
  getJobs,
  createApplication,
  getApplicationByTracking,

  // ✅ new
  getApplicationById,

  // admin
  findAdminByEmail,
  listApplications,
  updateApplicationStatus,

  // seed
  seedAdminIfMissing,

  // audit
  addAudit,
};
