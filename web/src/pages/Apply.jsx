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

      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(), // ✅ ville envoyée
        choice1,
        choice2: choice2 || null,
        choice3: choice3 || null,
        experienceYears,
      };

      const data = await submitApplication(payload);

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
                  onClick={() =>
                    navigate(`/suivi?code=${encodeURIComponent(trackingCode)}`)
                  }
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
            <button
              className="btn btnGhost"
              type="button"
              onClick={() => navigate("/suivi")}
            >
              Aller au suivi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}