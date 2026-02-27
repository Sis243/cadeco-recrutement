// web/src/pages/Apply.jsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Apply.css";

import PostesChoixTriple from "../components/PostesChoixTriple";
import { submitApplication } from "../lib/api";

export default function Apply() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Si on vient de la page Jobs avec ?jobId=...
  const preselectedJobId = params.get("jobId") || "";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // ✅ Ville (obligatoire)
  const [city, setCity] = useState("");

  // ✅ 3 choix
  const [choice1, setChoice1] = useState(preselectedJobId);
  const [choice2, setChoice2] = useState("");
  const [choice3, setChoice3] = useState("");

  const [experienceYears, setExperienceYears] = useState("0");

  // ✅ CV obligatoire (PDF)
  const [cvFile, setCvFile] = useState(null);
  const [cvInputKey, setCvInputKey] = useState(1); // reset input file

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
    if (preselectedJobId) setChoice1(preselectedJobId);
  }, [preselectedJobId]);

  function validate() {
    if (!fullName.trim()) return "Le nom complet est obligatoire.";
    if (!phone.trim()) return "Le téléphone est obligatoire.";
    if (!email.trim()) return "L’e-mail est obligatoire.";
    if (!city.trim()) return "La ville est obligatoire.";
    if (!choice1) return "Veuillez choisir au moins le 1er poste.";

    // ✅ CV obligatoire + PDF + taille
    if (!cvFile) return "Veuillez joindre votre CV (PDF).";

    const name = String(cvFile.name || "").toLowerCase();
    const type = String(cvFile.type || "").toLowerCase();
    const isPdf = name.endsWith(".pdf") || type === "application/pdf";
    if (!isPdf) return "CV invalide : seul le format PDF est autorisé.";

    const max = 10 * 1024 * 1024; // 10MB
    if (cvFile.size > max) return "CV trop volumineux : maximum 10 MB.";

    return "";
  }

  function onPickCv(e) {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setCvFile(null);
      return;
    }

    // contrôle immédiat
    const name = String(f.name || "").toLowerCase();
    const type = String(f.type || "").toLowerCase();
    const isPdf = name.endsWith(".pdf") || type === "application/pdf";
    const max = 10 * 1024 * 1024;

    if (!isPdf) {
      setServerError("CV invalide : seul le format PDF est autorisé.");
      setCvFile(null);
      setCvInputKey((k) => k + 1); // reset input
      return;
    }
    if (f.size > max) {
      setServerError("CV trop volumineux : maximum 10 MB.");
      setCvFile(null);
      setCvInputKey((k) => k + 1);
      return;
    }

    setServerError("");
    setCvFile(f);
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

      // ✅ FormData (multipart)
      const fd = new FormData();
      fd.append("fullName", fullName.trim());
      fd.append("phone", phone.trim());
      fd.append("email", email.trim());
      fd.append("city", city.trim());
      fd.append("choice1", String(choice1));
      if (choice2) fd.append("choice2", String(choice2));
      if (choice3) fd.append("choice3", String(choice3));
      fd.append("experienceYears", String(experienceYears || "0"));

      // ✅ champ file attendu par l’API: "cv"
      fd.append("cv", cvFile);

      const data = await submitApplication(fd);

      setOk(true);
      setTrackingCode(data?.trackingCode || "");

      // reset formulaire (optionnel)
      setFullName("");
      setPhone("");
      setEmail("");
      setCity("");
      setChoice1(preselectedJobId || "");
      setChoice2("");
      setChoice3("");
      setExperienceYears("0");
      setCvFile(null);
      setCvInputKey((k) => k + 1);
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
              <label>
                Nom complet <span>*</span>
              </label>
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="field">
              <label>
                Téléphone <span>*</span>
              </label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="field">
              <label>
                E-mail <span>*</span>
              </label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label>
                Ville <span>*</span>
              </label>
              <input
                className="input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex : Kinshasa, Lubumbashi, Matadi..."
              />
            </div>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>
                Postes souhaités <span>*</span>
              </label>

              <PostesChoixTriple
                choice1={choice1}
                choice2={choice2}
                choice3={choice3}
                setChoice1={setChoice1}
                setChoice2={setChoice2}
                setChoice3={setChoice3}
                disabled={submitting}
              />

              <div className="hint" style={{ marginTop: 8 }}>
                Astuce : tu peux aussi choisir un poste via la page <b>Postes</b>{" "}
                (cela remplit le 1er choix).
              </div>
            </div>

            <div className="field">
              <label>Années d’expérience</label>
              <select
                className="select"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
              >
                {yearsOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ CV (PDF) obligatoire */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>
                CV (PDF) <span>*</span>
              </label>

              <input
                key={cvInputKey}
                className="input"
                type="file"
                accept="application/pdf,.pdf"
                onChange={onPickCv}
                disabled={submitting}
              />

              <div className="hint" style={{ marginTop: 6 }}>
                Format accepté : <b>PDF</b> — Taille max : <b>10 MB</b>.
                {cvFile ? (
                  <>
                    {" "}
                    <span style={{ opacity: 0.9 }}>
                      Fichier sélectionné : <b>{cvFile.name}</b>
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {serverError ? <div className="alert alertError">{serverError}</div> : null}

          {ok ? (
            <div className="alert alertOk">
              <div className="okTitle">Candidature enregistrée ✅</div>
              <div className="okSub">
                Numéro de suivi : <b>{trackingCode || "—"}</b>
              </div>
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