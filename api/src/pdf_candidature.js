const PDFDocument = require("pdfkit");

function buildCandidaturePdf({ appRow }) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  doc.fontSize(18).text("CADECO — FICHE DE CANDIDATURE", { align: "center" });
  doc.moveDown(1);

  doc.fontSize(12).text(`Code de suivi : ${appRow.trackingcode || appRow.trackingCode}`);
  doc.text(`Date : ${(appRow.createdat || appRow.createdAt || new Date()).toString()}`);
  doc.moveDown(1);

  doc.fontSize(14).text("Informations candidat", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Nom complet : ${appRow.fullname || appRow.fullName}`);
  doc.text(`Téléphone : ${appRow.phone}`);
  doc.text(`E-mail : ${appRow.email}`);
  doc.text(`Ville : ${appRow.city || ""}`);
  doc.text(`Années d'expérience : ${appRow.experienceyears || appRow.experienceYears || "0"}`);
  doc.moveDown(1);

  doc.fontSize(14).text("Poste & statut", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Poste visé : ${appRow.jobtitle || appRow.jobTitle}`);
  doc.text(`Statut : ${appRow.status}`);
  doc.moveDown(1);

  doc.fontSize(14).text("Pièces jointes", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`CV : ${appRow.cvpath || appRow.cvPath || "—"}`);
  doc.text(`Pièce d'identité : ${appRow.idpath || appRow.idPath || "—"}`);

  doc.moveDown(2);
  doc.fontSize(10).fillColor("#555").text(
    "Ce document est généré automatiquement par le portail CADECO Recrutement.",
    { align: "center" }
  );

  doc.end();
  return doc;
}

module.exports = { buildCandidaturePdf };
