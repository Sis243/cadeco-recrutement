// api/pdf.js
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

function safe(v) {
  return (v ?? "").toString();
}

function fmtDateFR(v) {
  try {
    const d = v ? new Date(v) : new Date();
    return d.toLocaleString("fr-FR");
  } catch {
    return new Date().toLocaleString("fr-FR");
  }
}

function normalizeAppRow(appRow) {
  return {
    id: appRow.id,

    trackingCode: safe(appRow.trackingCode || appRow.trackingcode),
    createdAt: appRow.createdAt || appRow.createdat,

    fullName: safe(appRow.fullName || appRow.fullname),
    phone: safe(appRow.phone),
    email: safe(appRow.email),
    city: safe(appRow.city),
    yearsExp: safe(
      appRow.yearsExp ||
        appRow.experienceYears ||
        appRow.experienceyears ||
        "0"
    ),

    jobTitle: safe(appRow.jobTitle || appRow.jobtitle || ""),
    jobId: safe(appRow.jobId || ""),

    choice2Title: safe(appRow.choice2Title || ""),
    choice2Id: safe(appRow.choice2Id || ""),

    choice3Title: safe(appRow.choice3Title || ""),
    choice3Id: safe(appRow.choice3Id || ""),

    status: safe(appRow.status || "RECU"),
    cvPath: safe(appRow.cvPath || appRow.cvpath || ""),
    idPath: safe(appRow.idPath || appRow.idpath || ""),
  };
}

function labelChoice(title, id) {
  const t = safe(title).trim();
  if (t) return t;
  const i = safe(id).trim();
  return i ? `Poste #${i}` : "—";
}

function drawHr(doc, y) {
  doc
    .save()
    .moveTo(50, y)
    .lineTo(545, y)
    .lineWidth(1)
    .strokeColor("#E5E7EB")
    .stroke()
    .restore();
}

function drawKeyValue(doc, x, y, key, value, w = 240) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#111827")
    .text(key, x, y, { width: w });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#111827")
    .text(value || "—", x, y + 14, { width: w });
}

function buildCandidaturePdf({ appRow }) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const a = normalizeAppRow(appRow);

  // LOGO
  const logoPath = path.join(__dirname, "assets", "cadeco-logo.png");
  const hasLogo = fs.existsSync(logoPath);

  // ===== HEADER BAND =====
  doc.save();
  doc.rect(50, 40, 495, 70).fill("#0B2A4A"); // bleu pro
  doc.restore();

  // Logo (si présent)
  if (hasLogo) {
    try {
      doc.image(logoPath, 60, 50, { fit: [60, 60] });
    } catch (e) {
      // ignore
    }
  }

  // Titres
  doc
    .font("Helvetica-Bold")
    .fillColor("#FFFFFF")
    .fontSize(16)
    .text("CADECO", hasLogo ? 130 : 60, 52);

  doc
    .font("Helvetica")
    .fillColor("#E5E7EB")
    .fontSize(11)
    .text("Portail Recrutement — Fiche de candidature", hasLogo ? 130 : 60, 74);

  // Badge suivi (droite)
  doc.save();
  doc.roundedRect(360, 55, 185, 42, 10).fill("#FFFFFF");
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fillColor("#0B2A4A")
    .fontSize(10)
    .text("CODE DE SUIVI", 372, 63);

  doc
    .font("Helvetica-Bold")
    .fillColor("#111827")
    .fontSize(12)
    .text(a.trackingCode || "—", 372, 79);

  // Date génération
  doc
    .font("Helvetica")
    .fillColor("#6B7280")
    .fontSize(9)
    .text(`Généré le : ${fmtDateFR(new Date())}`, 50, 120);

  drawHr(doc, 138);

  // ===== SECTION 1: CANDIDAT =====
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#0B2A4A")
    .text("Informations du candidat", 50, 150);

  doc.save();
  doc.roundedRect(50, 172, 495, 110, 12).fill("#F9FAFB");
  doc.restore();

  drawKeyValue(doc, 65, 185, "Nom complet", a.fullName);
  drawKeyValue(doc, 315, 185, "Téléphone", a.phone);
  drawKeyValue(doc, 65, 230, "E-mail", a.email);
  drawKeyValue(doc, 315, 230, "Ville", a.city);
  drawKeyValue(doc, 65, 275, "Années d’expérience", a.yearsExp);

  // ===== SECTION 2: POSTES + STATUT =====
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#0B2A4A")
    .text("Postes souhaités & statut", 50, 300);

  doc.save();
  doc.roundedRect(50, 322, 495, 145, 12).fill("#F9FAFB");
  doc.restore();

  drawKeyValue(doc, 65, 335, "1er choix", labelChoice(a.jobTitle, a.jobId), 460);
  drawKeyValue(doc, 65, 375, "2e choix", labelChoice(a.choice2Title, a.choice2Id), 460);
  drawKeyValue(doc, 65, 415, "3e choix", labelChoice(a.choice3Title, a.choice3Id), 460);

  // Statut + date dépôt
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#111827")
    .text("Statut", 65, 458);

  // Badge statut
  const badgeX = 120;
  const badgeY = 452;
  const badgeW = 140;
  const badgeH = 22;

  let badgeColor = "#EEF2FF";
  let badgeText = "#1D4ED8";
  const s = safe(a.status).toUpperCase();

  if (s.includes("RETENU")) {
    badgeColor = "#ECFDF5";
    badgeText = "#065F46";
  } else if (s.includes("NON")) {
    badgeColor = "#FEF2F2";
    badgeText = "#991B1B";
  } else if (
    s.includes("EN_COURS") ||
    s.includes("ENTRETIEN") ||
    s.includes("ATTENTE") ||
    s.includes("QUALIFIE")
  ) {
    badgeColor = "#FFFBEB";
    badgeText = "#92400E";
  }

  doc.save();
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 10).fill(badgeColor);
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(badgeText)
    .text(a.status || "RECU", badgeX + 10, badgeY + 6);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#6B7280")
    .text(`Date dépôt : ${fmtDateFR(a.createdAt)}`, 280, 458);

  // ===== SECTION 3: PIECES (optionnel) =====
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#0B2A4A")
    .text("Pièces jointes", 50, 495);

  doc.save();
  doc.roundedRect(50, 517, 495, 70, 12).fill("#F9FAFB");
  doc.restore();

  drawKeyValue(doc, 65, 530, "CV", a.cvPath || "—", 460);
  drawKeyValue(doc, 65, 565, "Pièce d’identité", a.idPath || "—", 460);

  // ===== FOOTER =====
  drawHr(doc, 700);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#6B7280")
    .text(
      "Document généré automatiquement par CADECO Recrutement. Toute modification manuelle invalide cette fiche.",
      50,
      712,
      { width: 495, align: "center" }
    );

  doc.end();
  return doc;
}

module.exports = { buildCandidaturePdf };