const nodemailer = require("nodemailer");

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP config missing (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS).");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 => true, 587 => false
    auth: { user, pass },
  });
}

async function sendMail({ to, subject, html, attachments }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const transporter = getTransport();

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
    attachments: attachments || [],
  });
}

function tplBase({ title, body }) {
  return `
  <div style="font-family:Arial,sans-serif;background:#0b1220;padding:20px">
    <div style="max-width:640px;margin:0 auto;background:#111a2e;border-radius:14px;padding:22px;border:1px solid rgba(255,255,255,.08)">
      <div style="color:#fff;font-size:18px;font-weight:700;margin-bottom:10px">${title}</div>
      <div style="color:#d7e0ff;font-size:14px;line-height:1.6">${body}</div>
      <div style="margin-top:18px;color:#9fb0e8;font-size:12px">
        © ${new Date().getFullYear()} CADECO — Recrutement
      </div>
    </div>
  </div>`;
}

function tplConfirmation({ fullName, trackingCode }) {
  return tplBase({
    title: "Confirmation de candidature",
    body: `
      Bonjour <b>${escapeHtml(fullName)}</b>,<br/><br/>
      Votre candidature a bien été enregistrée.<br/>
      Numéro de suivi : <b>${escapeHtml(trackingCode)}</b><br/><br/>
      Vous pouvez suivre l’évolution de votre dossier via la page “Suivi”.<br/><br/>
      Cordialement,<br/>
      CADECO — Recrutement
    `,
  });
}

function tplStatusChange({ fullName, trackingCode, status }) {
  return tplBase({
    title: "Mise à jour de votre candidature",
    body: `
      Bonjour <b>${escapeHtml(fullName)}</b>,<br/><br/>
      Votre candidature (<b>${escapeHtml(trackingCode)}</b>) a été mise à jour.<br/>
      Nouveau statut : <b>${escapeHtml(status)}</b><br/><br/>
      Cordialement,<br/>
      CADECO — Recrutement
    `,
  });
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

module.exports = { sendMail, tplConfirmation, tplStatusChange };
