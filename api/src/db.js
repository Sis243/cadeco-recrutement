// api/src/db.js
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

/**
 * ✅ JOB DESCRIPTIONS
 * (Tu peux enrichir/ajuster ces textes)
 */
const JOB_DESCRIPTIONS = {
  "Chargés de relation avec les clients": `PROFIL DU CHARGE DE RELATION AVEC LES CLIENTS
Définition du poste
Le/la chargé(e) de clientèle est le principal interlocuteur du client assurant le suivi, la fidélisation et la satisfaction d'un portefeuille de clients. Il gère les demandes, résout les réclamations, et assure une interface entre le client et les services internes (commerciaux, techniques) pour garantir une expérience positive et l’atteinte de ses objectives.
Tâches principales :
Développement et suivi d’un portefeuille de clients avec les objectifs en termes de volume d’activité et de revenus ;
Analyse approfondie des besoins du client ;
Elaboration de présentations, d’offres de services innovantes et de conseils en gestion ;
Point focal du client sur les différents produits et services de la CADECO SA ;
Relation client : Accueil, conseil et traitement des demandes (téléphone, mail, courrier) ;
Actions commerciales : Prospection, vente de produits/services, et détection de besoins ;
Gestion administrative : Suivi des dossiers clients, mise à jour des informations et reporting ;
Traitement des réclamations et contribution à l’amélioration continue de la qualité de service.`,
  "Délégués commerciaux": `PROFIL DU DELEGUE COMMERCIAL
Définition du poste
Le/la délégué(e) commercial(e) a pour mission principale de développer les ventes des produits et services de la CADECO SA. Il/elle prospecte, fidélise et assure le suivi d’un portefeuille client.
Tâches principales :
Prospecter de nouveaux clients et développer un portefeuille ;
Présenter et vendre les produits/services de la CADECO SA ;
Assurer le suivi commercial, la relance et la fidélisation ;
Réaliser des reportings d’activités et atteindre les objectifs fixés ;
Assurer une veille concurrentielle et remonter les informations terrain.`,
  "Analystes crédits": `PROFIL DE L’ANALYSTE DES CREDITS
Définition du poste
L’analyste crédits étudie les demandes de crédit, évalue la solvabilité des clients et formule des recommandations de décision (accord/refus) conformément aux politiques de crédit.
Tâches principales :
Analyser les dossiers de demande de crédit et vérifier la conformité ;
Étudier la capacité de remboursement et le risque de crédit ;
Émettre une recommandation motivée (analyse, score, garanties) ;
Assurer le suivi des crédits accordés et du respect des échéances ;
Participer à l’amélioration des procédures et outils d’analyse.`,
  "Contrôleurs permanents (internes)": `PROFIL DU CONTROLEUR PERMANENT
Définition du poste
Le contrôleur permanent veille au respect des procédures internes, à la conformité et à la maîtrise des risques opérationnels à travers des contrôles réguliers.
Tâches principales :
Mettre en œuvre le dispositif de contrôle permanent ;
Réaliser des contrôles de conformité et d’efficacité des procédures ;
Identifier les risques et proposer des actions correctives ;
Rédiger des rapports de contrôle et suivre les recommandations ;
Sensibiliser les équipes au respect des procédures.`,
  "Agents de recouvrement": `PROFIL DE L’AGENT DE RECOUVREMENT
Définition du poste
L’agent de recouvrement assure la récupération des créances impayées, met en place des actions de relance et négocie des plans de remboursement.
Tâches principales :
Suivre les dossiers impayés et effectuer les relances (téléphone, mail, courrier) ;
Négocier des échéanciers et solutions amiables ;
Mettre à jour les informations et le suivi des dossiers ;
Préparer les dossiers pour actions contentieuses si nécessaire ;
Assurer le reporting et l’atteinte des objectifs de recouvrement.`,
  "Chef caissiers (Coordonnateur)": `PROFIL DU CHEF CAISSIER
Définition du poste
Le chef caissier coordonne l’activité de caisse, supervise les opérations, assure la conformité et le respect des procédures, et garantit la qualité du service.
Tâches principales :
Superviser les caissiers et organiser les plannings ;
Contrôler les opérations de caisse et la tenue de la trésorerie ;
Assurer la conformité (procédures, limites, sécurité) ;
Gérer les incidents et réclamations liés à la caisse ;
Produire les arrêtés/rapports de caisse et assurer le reporting.`,
  "Caissiers": `PROFIL DU CAISSIER
Définition du poste
Le caissier exécute les opérations de caisse (encaissements, décaissements) conformément aux procédures et assure l’accueil des clients.
Tâches principales :
Réaliser les opérations d’encaissement et de décaissement ;
Accueillir, renseigner et orienter les clients ;
Contrôler l’authenticité des billets et documents ;
Respecter les procédures de sécurité et de conformité ;
Assurer l’arrêté de caisse et la remontée des anomalies.`,
  "Auditeurs internes": `PROFIL DE L’AUDITEUR INTERNE
Définition du poste
L’auditeur interne évalue l’efficacité du contrôle interne, de la gouvernance et de la gestion des risques, et formule des recommandations.
Tâches principales :
Planifier et réaliser des missions d’audit ;
Analyser les processus et identifier les risques ;
Rédiger des rapports d’audit et recommandations ;
Suivre la mise en œuvre des plans d’actions ;
Contribuer à l’amélioration continue du contrôle interne.`,
  "Informaticiens experts en réseaux": `PROFIL DE L’INFORMATICIEN RESEAU
Définition du poste
L’informaticien réseau conçoit, déploie, administre et sécurise les infrastructures réseaux et télécoms.
Tâches principales :
Installer et maintenir l’infrastructure réseau (LAN/WAN/Wi-Fi) ;
Configurer routeurs, switchs, firewalls et VPN ;
Assurer la supervision, la disponibilité et la performance ;
Diagnostiquer et résoudre les incidents réseau ;
Mettre en œuvre les politiques de sécurité et de sauvegarde.`,
  "Informaticiens experts en conception des systèmes": `PROFIL DE L’INFORMATICIEN EXPERT BASES DE DONNEES / SYSTEMES
Définition du poste
Assure la conception, l’administration et l’optimisation des systèmes et bases de données, ainsi que la disponibilité, la performance et la sécurité des données.
Tâches principales :
Installer, administrer et optimiser les SGBD ;
Assurer la sauvegarde/restauration et la haute disponibilité ;
Contrôler les accès, la sécurité et l’intégrité des données ;
Optimiser les performances (index, requêtes, plan d’exécution) ;
Produire la documentation et participer à l’évolution du SI.`,
  "Ressources Humaines": ``,
};

function initSchema() {
  const d = open();

  // JOBS
  d.prepare(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department TEXT,
      location TEXT,
      description TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    )
  `).run();

  // migration: description
  addColumnIfMissing("jobs", "description", "description TEXT");

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

      choice2Id INTEGER,
      choice2Title TEXT,
      choice3Id INTEGER,
      choice3Title TEXT,

      cvPath TEXT,
      idPath TEXT,

      status TEXT NOT NULL DEFAULT 'RECU',
      trackingCode TEXT NOT NULL UNIQUE,

      createdAt TEXT NOT NULL
    )
  `).run();

  // migrations safe (anciennes DB)
  addColumnIfMissing("applications", "yearsExp", "yearsExp INTEGER DEFAULT 0");
  addColumnIfMissing("applications", "jobId", "jobId INTEGER");
  addColumnIfMissing("applications", "jobTitle", "jobTitle TEXT");

  addColumnIfMissing("applications", "choice2Id", "choice2Id INTEGER");
  addColumnIfMissing("applications", "choice2Title", "choice2Title TEXT");
  addColumnIfMissing("applications", "choice3Id", "choice3Id INTEGER");
  addColumnIfMissing("applications", "choice3Title", "choice3Title TEXT");

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
    `INSERT INTO jobs (title, department, location, description, isActive, createdAt)
     VALUES (@title, @department, @location, @description, 1, @createdAt)`
  );

  const tx = d.transaction(() => {
    for (const title of jobs) {
      ins.run({
        title,
        department: "CADECO",
        location: "Kinshasa",
        description: JOB_DESCRIPTIONS[title] || "",
        createdAt: nowISO(),
      });
    }
  });

  tx();
}

/**
 * ✅ pour DB déjà remplie: met à jour les descriptions sans recréer jobs
 */
function applyJobDescriptions() {
  const d = open();
  const upd = d.prepare(`UPDATE jobs SET description = ? WHERE title = ?`);

  const tx = d.transaction(() => {
    for (const [title, desc] of Object.entries(JOB_DESCRIPTIONS)) {
      if (!desc) continue;
      upd.run(String(desc), String(title));
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
    .prepare(
      `SELECT id, title, department, location, description
       FROM jobs
       WHERE isActive = 1
       ORDER BY title ASC`
    )
    .all();
}

function createApplication(payload) {
  const d = open();
  const code = trackCode();

  const stmt = d.prepare(`
    INSERT INTO applications (
      fullName, email, phone, city, yearsExp,
      jobId, jobTitle,
      choice2Id, choice2Title,
      choice3Id, choice3Title,
      cvPath, idPath,
      status, trackingCode, createdAt
    )
    VALUES (
      @fullName, @email, @phone, @city, @yearsExp,
      @jobId, @jobTitle,
      @choice2Id, @choice2Title,
      @choice3Id, @choice3Title,
      @cvPath, @idPath,
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

    choice2Id: payload.choice2Id != null ? Number(payload.choice2Id) : null,
    choice2Title: payload.choice2Title ? String(payload.choice2Title) : null,
    choice3Id: payload.choice3Id != null ? Number(payload.choice3Id) : null,
    choice3Title: payload.choice3Title ? String(payload.choice3Title) : null,

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
      `SELECT
        id, fullName, email, phone, city, yearsExp,
        jobId, jobTitle,
        choice2Id, choice2Title,
        choice3Id, choice3Title,
        status, trackingCode, createdAt
       FROM applications
       WHERE trackingCode = ?`
    )
    .get(String(trackingCode || ""));
}

function getApplicationById(id) {
  return open().prepare(`SELECT * FROM applications WHERE id = ?`).get(Number(id));
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

// ✅ purge test data
function purgeApplications() {
  const d = open();
  const count = d.prepare("SELECT COUNT(*) AS c FROM applications").get().c;

  d.prepare("DELETE FROM applications").run();
  d.prepare("DELETE FROM audit_logs").run();

  // reset autoincrement
  try {
    d.prepare("DELETE FROM sqlite_sequence WHERE name='applications'").run();
    d.prepare("DELETE FROM sqlite_sequence WHERE name='audit_logs'").run();
  } catch {}

  return { deleted: Number(count) };
}

function init() {
  initSchema();
  seedJobsIfEmpty();
  applyJobDescriptions(); // ✅ important

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

  // jobs
  applyJobDescriptions,

  // pdf/admin details
  getApplicationById,

  // admin
  findAdminByEmail,
  listApplications,
  updateApplicationStatus,

  // seed
  seedAdminIfMissing,

  // audit
  addAudit,

  // purge
  purgeApplications,
};