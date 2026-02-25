// api/src/pdf_candidature.js
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

function safe(v) {
  return (v ?? "").toString().trim();
}

function pick(row, a, b) {
  return row?.[a] ?? row?.[b];
}

function formatDateFR(input) {
  try {
    const d = input ? new Date(input) : new Date();
    return d.toLocaleString("fr-FR");
  } catch {
    return "";
  }
}

function drawKeyValue(doc, x, y, w, label, value) {
  const labelW = 150;
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#233047")
    .text(label, x, y, { width: labelW });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#111827")
    .text(value || "—", x + labelW, y, { width: w - labelW });

  return y + 16;
}

function buildCandidaturePdf({ appRow }) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 46,
    info: {
      Title: "CADECO — Fiche de candidature",
      Author: "Portail CADECO Recrutement",
    },
  });

  const PAGE_W = doc.page.width;
  const M = doc.page.margins.left;
  const CONTENT_W = PAGE_W - doc.page.margins.left - doc.page.margins.right;

  // ----------------------------
  // Styles
  // ----------------------------
  const COLORS = {
    navy: "#0B1F3B",
    gold: "#C8A43A",
    text: "#111827",
    muted: "#6B7280",
    line: "#E5E7EB",
    card: "#F8FAFC",
  };

  // ----------------------------
  // Data normalize (support snake_case & camelCase)
  // ----------------------------
  const trackingCode = safe(pick(appRow, "trackingCode", "trackingcode"));
  const createdAt = pick(appRow, "createdAt", "createdat");

  const fullName = safe(pick(appRow, "fullName", "fullname"));
  const phone = safe(pick(appRow, "phone", "phone"));
  const email = safe(pick(appRow, "email", "email"));
  const city = safe(pick(appRow, "city", "city"));
  const yearsExp = safe(pick(appRow, "yearsExp", "yearsexp")) || "0";

  const job1 = safe(pick(appRow, "jobTitle", "jobtitle"));
  const job2 = safe(pick(appRow, "choice2Title", "choice2title"));
  const job3 = safe(pick(appRow, "choice3Title", "choice3title"));

  const status = safe(pick(appRow, "status", "status")) || "RECU";
  const cvPath = safe(pick(appRow, "cvPath", "cvpath"));
  const idPath = safe(pick(appRow, "idPath", "idpath"));

  // ----------------------------
  // Header (logo + title band)
  // ----------------------------
  const headerY = 18;
  const bandH = 64;

  // Band background
  doc.save();
  doc.rect(0, 0, PAGE_W, bandH).fill(COLORS.navy);
  doc.restore();

  // Logo
  const logoPath = path.join(__dirname, "..", "assets", "cadeco-logo.png");
  const logoW = 46;
  const logoH = 46;
  const logoX = M;
  const logoY = headerY + 8;

  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, logoX, logoY, { width: logoW, height: logoH });
    } catch {
      // ignore if image fails to load
    }
  } else {
    // fallback simple badge if logo missing
    doc
      .save()
      .rect(logoX, logoY, logoW, logoH)
      .fill("#FFFFFF")
      .restore();
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLORS.navy)
      .text("C", logoX + 16, logoY + 14);
  }

  // Title + subtitle
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#FFFFFF")
    .text("CADECO — FICHE DE CANDIDATURE", logoX + logoW + 12, headerY + 12, {
      width: CONTENT_W - (logoW + 12),
    });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#D1D5DB")
    .text("Portail officiel de candidature & suivi", logoX + logoW + 12, headerY + 34);

  // Gold accent line
  doc.save();
  doc.rect(0, bandH - 4, PAGE_W, 4).fill(COLORS.gold);
  doc.restore();

  // ----------------------------
  // Meta row (tracking + date)
  // ----------------------------
  let y = bandH + 18;

  // Card meta
  const metaH = 56;
  doc.save();
  doc.roundedRect(M, y, CONTENT_W, metaH, 10).fill(COLORS.card);
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text("Code de suivi", M + 14, y + 12);

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(COLORS.text)
    .text(trackingCode || "—", M + 14, y + 26);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text("Date de dépôt", M + CONTENT_W - 180, y + 12, { width: 166, align: "right" });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(formatDateFR(createdAt), M + CONTENT_W - 180, y + 28, { width: 166, align: "right" });

  y += metaH + 18;

  // ----------------------------
  // Section: Candidate
  // ----------------------------
  const sectionTitle = (title) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLORS.navy)
      .text(title, M, y);
    y += 10;
    doc.save();
    doc.moveTo(M, y).lineTo(M + CONTENT_W, y).lineWidth(1).stroke(COLORS.line);
    doc.restore();
    y += 12;
  };

  const card = (h) => {
    doc.save();
    doc.roundedRect(M, y, CONTENT_W, h, 12).fill("#FFFFFF");
    doc.roundedRect(M, y, CONTENT_W, h, 12).stroke(COLORS.line);
    doc.restore();
  };

  sectionTitle("Informations candidat");

  const cardH1 = 110;
  card(cardH1);

  let ky = y + 14;
  ky = drawKeyValue(doc, M + 16, ky, CONTENT_W - 32, "Nom complet :", fullName);
  ky = drawKeyValue(doc, M + 16, ky, CONTENT_W - 32, "Téléphone :", phone);
  ky = drawKeyValue(doc, M + 16, ky, CONTENT_W - 32, "E-mail :", email);
  ky = drawKeyValue(doc, M + 16, ky, CONTENT_W - 32, "Ville :", city);
  ky = drawKeyValue(doc, M + 16, ky, CONTENT_W - 32, "Années d’expérience :", yearsExp);

  y += cardH1 + 18;

  // ----------------------------
  // Section: Postes souhaités + statut
  // ----------------------------
  sectionTitle("Postes souhaités & statut");

  const cardH2 = 118;
  card(cardH2);

  let py = y + 14;
  py = drawKeyValue(doc, M + 16, py, CONTENT_W - 32, "1er choix :", job1);
  py = drawKeyValue(doc, M + 16, py, CONTENT_W - 32, "2e choix :", job2);
  py = drawKeyValue(doc, M + 16, py, CONTENT_W - 32, "3e choix :", job3);

  // status pill
  const pillText = status || "RECU";
  const pillW = Math.min(180, doc.widthOfString(pillText) + 26);
  const pillX = M + CONTENT_W - pillW - 16;
  const pillY = y + cardH2 - 34;

  doc.save();
  doc.roundedRect(pillX, pillY, pillW, 22, 11).fill(COLORS.navy);
  doc.restore();
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#FFFFFF")
    .text(pillText, pillX, pillY + 6, { width: pillW, align: "center" });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text("Statut", pillX, pillY - 14, { width: pillW, align: "center" });

  y += cardH2 + 18;

  // ----------------------------
  // Section: Pièces jointes
  // ----------------------------
  sectionTitle("Pièces jointes");

  const cardH3 = 70;
  card(cardH3);

  let fy = y + 14;
  fy = drawKeyValue(doc, M + 16, fy, CONTENT_W - 32, "CV :", cvPath || "—");
  fy = drawKeyValue(doc, M + 16, fy, CONTENT_W - 32, "Pièce d’identité :", idPath || "—");

  y += cardH3 + 18;

  // ----------------------------
  // Footer
  // ----------------------------
  doc.save();
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      "Document généré automatiquement par le portail CADECO Recrutement. Toute falsification est interdite.",
      M,
      doc.page.height - 70,
      { width: CONTENT_W, align: "center" }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.navy)
    .text("CADECO • Recrutement", M, doc.page.height - 52, {
      width: CONTENT_W,
      align: "center",
    });
  doc.restore();

  doc.end();
  return doc;
}

module.exports = { buildCandidaturePdf };