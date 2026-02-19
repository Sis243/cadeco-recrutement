// web/src/pages/Apply.jsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Apply.css";
import PosteViseSelect from "../components/PosteViseSelect";

import { submitApplication } from "../lib/api";

export default function Apply() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const preselectedJobId = params.get("jobId") || "";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Kinshasa");

  const [jobId, setJobId] = useState(preselectedJobId);

  const [experienceYears, setExperienceYears] = useState("0");
  const [cvFile, setCvFile] = useState(null);
  const [idFile, setIdFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [ok, setOk] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

  const yearsOptions = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 30; i++) arr.push(String(i));
    return arr;
  }, []);

  useEffect(() => {
    if (preselectedJobId) setJobId(preselectedJobId);
  }, [preselectedJobId]);

  function validate() {
    if (!fullName.trim()) return "Le nom complet est obligatoire.";
    if (!phone.trim()) return "Le téléphone est obligatoire.";
    if (!email.trim()) return "L’e-mail est obligatoire.";
    if (!jobId) return "Veuillez choisir un poste.";
    if (!cvFile) return "Le CV (PDF) est obligatoire.";
    if (cvFile && cvFile.type !== "application/pdf") return "Le CV doit être un PDF.";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerError("");
    setOk(false);
    setTrackingCode("");

    const msg = validate();
    if (msg) {
      setServerError(msg);
      return;
    }

    try {
      setSubmitting(true);

      const form = new FormData();
      form.append("fullName", fullName.trim());
      form.append("phone", phone.trim());
      form.append("email", email.trim());
      form.append("city", city.trim());
      form.append("jobId", jobId);
      form.append("experienceYears", experienceYears);

      form.append("cv", cvFile);
      if (idFile) form.append("idDoc", idFile);

      const data = await submitApplication(form);

      setOk(true);
      setTrackingCode(data?.trackingCode || "");
    } catch (err) {
      setServerError(err?.message || "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="applyPage">
      <div className="applyShell">
        <div className="applyHeader">
          <div className="applyBadge">Dépôt de candidature</div>
          <h1>Formulaire de candidature</h1>
          <p>
            Remplissez soigneusement. Les champs marqués <b>*</b> sont obligatoires.
          </p>
        </div>

        <form className="applyCard" onSubmit={onSubmit}>
          <div className="applyGrid">
            <div className="field">
              <label>Nom complet <span>*</span></label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="field">
              <label>Téléphone <span>*</span></label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="field">
              <label>E-mail <span>*</span></label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="field">
              <label>Ville</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <div className="field">
              <label>Poste visé <span>*</span></label>
              <PosteViseSelect value={jobId} onChange={(val) => setJobId(val)} required />
              <div className="hint">
                Astuce : tu peux aussi choisir un poste via la page <b>Postes</b>.
              </div>
            </div>

            <div className="field">
              <label>Années d’expérience</label>
              <select className="select" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}>
                {yearsOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="field">
              <label>CV (PDF) <span>*</span></label>
              <input type="file" accept="application/pdf" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
            </div>

            <div className="field">
              <label>Pièce d’identité (PDF/JPG/PNG)</label>
              <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
            </div>
          </div>

          {serverError ? <div className="alert alertError">{serverError}</div> : null}

          {ok ? (
            <div className="alert alertOk">
              <div className="okTitle">Candidature enregistrée ✅</div>
              <div className="okSub">Numéro de suivi : <b>{trackingCode || "—"}</b></div>
              <div className="actionsRow">
                <button
                  type="button"
                  className="btn btnGhost"
                  onClick={() => navigate(`/suivi?code=${encodeURIComponent(trackingCode)}`)}
                  disabled={!trackingCode}
                >
                  Aller au suivi
                </button>
              </div>
            </div>
          ) : null}

          <div className="actions">
            <button className="btn btnPrimary" type="submit" disabled={submitting}>
              {submitting ? "Soumission..." : "Soumettre"}
            </button>
            <button className="btn btnGhost" type="button" onClick={() => navigate("/suivi")}>
              Aller au suivi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
