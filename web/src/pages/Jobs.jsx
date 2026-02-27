// web/src/pages/Jobs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

function safeStr(v) {
  return (v ?? "").toString();
}
function normalize(s) {
  return safeStr(s).toLowerCase().trim();
}
function snippet(text, max = 150) {
  const t = safeStr(text).replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

// ✅ mapping officiel (département + niveau)
// -> on map par id (si tes IDs restent stables), sinon fallback par titre normalisé.
const JOB_META_BY_ID = {
  // adapte si tes IDs diffèrent en base
  1: { dept: "Commercial", level: "Junior/Senior" }, // Chargés relation clients
  2: { dept: "Commercial", level: "Junior/Senior" }, // Délégués commerciaux
  3: { dept: "Crédit", level: "Senior" },            // Analystes crédits
  4: { dept: "Contrôle", level: "Senior" },          // Contrôleurs permanents
  5: { dept: "Recouvrement", level: "Junior/Senior" },// Agents de recouvrement
  6: { dept: "Caisse", level: "Senior" },            // Chef caissiers
  7: { dept: "Caisse", level: "Junior/Senior" },     // Caissiers
  8: { dept: "Audit", level: "Senior" },             // Auditeurs internes
  9: { dept: "IT", level: "Senior" },                // Réseaux
  10:{ dept: "IT", level: "Senior" },                // Conception systèmes
  11:{ dept: "Ressources Humaines", level: "Senior" } // RH
};

const JOB_META_BY_TITLE = {
  [normalize("Chargés de relation avec les clients")]: { dept: "Commercial", level: "Junior/Senior" },
  [normalize("Chargé de relation avec les clients")]: { dept: "Commercial", level: "Junior/Senior" },
  [normalize("Chargé(e) de relation avec les clients")]: { dept: "Commercial", level: "Junior/Senior" },

  [normalize("Délégués commerciaux")]: { dept: "Commercial", level: "Junior/Senior" },
  [normalize("Délégué commercial")]: { dept: "Commercial", level: "Junior/Senior" },
  [normalize("Délégué(e) commercial")]: { dept: "Commercial", level: "Junior/Senior" },

  [normalize("Analystes crédits")]: { dept: "Crédit", level: "Senior" },
  [normalize("Analyste des crédits")]: { dept: "Crédit", level: "Senior" },

  [normalize("Contrôleurs permanents (internes)")]: { dept: "Contrôle", level: "Senior" },
  [normalize("Contrôleur permanent (interne)")]: { dept: "Contrôle", level: "Senior" },

  [normalize("Agents de recouvrement")]: { dept: "Recouvrement", level: "Junior/Senior" },
  [normalize("Agent de recouvrement")]: { dept: "Recouvrement", level: "Junior/Senior" },

  [normalize("Chef caissiers (Coordonnateur)")]: { dept: "Caisse", level: "Senior" },
  [normalize("Chef caissier (Coordonnateur)")]: { dept: "Caisse", level: "Senior" },

  [normalize("Caissiers")]: { dept: "Caisse", level: "Junior/Senior" },
  [normalize("Caissier")]: { dept: "Caisse", level: "Junior/Senior" },

  [normalize("Auditeurs internes")]: { dept: "Audit", level: "Senior" },
  [normalize("Auditeur interne")]: { dept: "Audit", level: "Senior" },

  [normalize("Informaticiens experts en réseaux")]: { dept: "IT", level: "Senior" },
  [normalize("Informaticien expert en réseaux")]: { dept: "IT", level: "Senior" },
  [normalize("Informaticien Reseau")]: { dept: "IT", level: "Senior" },

  [normalize("Informaticiens experts en conception des systèmes")]: { dept: "IT", level: "Senior" },
  [normalize("Informaticien expert en conception")]: { dept: "IT", level: "Senior" },
  [normalize("Informaticien exper base des données")]: { dept: "IT", level: "Senior" },

  [normalize("Ressources Humaines")]: { dept: "Ressources Humaines", level: "Senior" },
  [normalize("Comptable")]: { dept: "Finance/Comptabilité", level: "Senior" }, // si tu l’ajoutes dans les jobs
};

function getJobMeta(job) {
  const idKey = Number(job?.id);
  const byId = JOB_META_BY_ID[idKey];
  if (byId) return byId;

  const t = normalize(job?.title);
  const byTitle = JOB_META_BY_TITLE[t];
  if (byTitle) return byTitle;

  // fallback propre
  return {
    dept: job?.department || "CADECO",
    level: "—",
  };
}

function splitSections(raw) {
  const text = safeStr(raw).trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/).map((l) => l.trim());

  const sections = [];
  let current = { title: "", lines: [] };

  const pushCurrent = () => {
    const cleanLines = current.lines.filter(Boolean);
    if (current.title || cleanLines.length) {
      sections.push({ title: current.title, lines: cleanLines });
    }
    current = { title: "", lines: [] };
  };

  for (const line of lines) {
    if (!line) continue;

    const isTitle =
      (line.endsWith(":") && line.length <= 60) ||
      /^(missions|profil|comp[eé]tences|responsabilit[eé]s|t[aâ]ches|conditions|qualifications|exigences)\b/i.test(
        line.replace(":", "")
      );

    if (isTitle) {
      pushCurrent();
      current.title = line.replace(/:$/, "").trim();
      continue;
    }

    current.lines.push(line);
  }

  pushCurrent();

  if (sections.length <= 1 && !sections[0]?.title) {
    return [{ title: "Description du poste", lines: text.split(/\r?\n/).filter(Boolean) }];
  }

  return sections;
}

function SectionBlock({ title, lines }) {
  return (
    <div className="jdSection">
      <div className="jdSectionTitle">{title}</div>
      <div className="jdSectionBody">
        {lines.map((l, idx) => (
          <div key={idx} className="jdLine">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Jobs() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/jobs`);
      const json = await res.json();
      const base = Array.isArray(json?.data) ? json.data : [];

      // ✅ enrichir chaque job avec dept + level
      const enriched = base.map((j) => {
        const meta = getJobMeta(j);
        return {
          ...j,
          dept: meta.dept,
          level: meta.level,
        };
      });

      setJobs(enriched);
    } catch (e) {
      setErr(e?.message || "Erreur chargement des postes.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = normalize(q);
    if (!s) return jobs;

    return jobs.filter((j) => {
      const hay = [j.title, j.dept, j.level, j.description].map(normalize).join(" ");
      return hay.includes(s);
    });
  }, [jobs, q]);

  return (
    <div className="section">
      <div className="container">
        <div className="card jobsCard">
          <div className="jobsHero">
            <div>
              <div className="badge">CADECO • Recrutement</div>
              <h2 className="jobsTitle">Postes ouverts</h2>
              <p className="small jobsSubtitle">
                Consultez la fiche de poste, puis cliquez sur <b>Postuler</b>.
                <br />
                <span style={{ opacity: 0.9 }}>
                  (La ville/lieu sera renseigné(e) dans le formulaire.)
                </span>
              </p>
            </div>

            <button className="btn btnGhost" type="button" onClick={load} disabled={loading}>
              {loading ? "Actualisation..." : "Rafraîchir"}
            </button>
          </div>

          <div className="jobsSearch">
            <div className="label">Recherche</div>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex : IT, Caissier, Crédit, Audit…"
            />
          </div>

          {err ? (
            <div className="alert alertError" style={{ marginTop: 12 }}>
              {err}
            </div>
          ) : null}

          {loading ? (
            <div className="small" style={{ marginTop: 12 }}>
              Chargement…
            </div>
          ) : filtered.length === 0 ? (
            <div className="small" style={{ marginTop: 12 }}>
              Aucun poste ne correspond à votre recherche.
            </div>
          ) : (
            <>
              {/* ===== TABLE (Desktop) ===== */}
              <div className="jobsTableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: "50%" }}>Poste</th>
                      <th style={{ width: "20%" }}>Département</th>
                      <th style={{ width: "15%" }}>Niveau</th>
                      <th style={{ width: "15%" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((j) => {
                      const isOpen = String(openId) === String(j.id);
                      return (
                        <tr key={j.id}>
                          <td>
                            <div className="tdTitle">{j.title}</div>
                            {j.description ? (
                              <div className="small tdSub">{snippet(j.description, 120)}</div>
                            ) : (
                              <div className="small tdSub" style={{ opacity: 0.7 }}>
                                Description indisponible.
                              </div>
                            )}
                          </td>

                          <td>{j.dept || "CADECO"}</td>
                          <td>{j.level || "—"}</td>

                          <td>
                            <div className="tdActions">
                              <Link
                                className="btn btnPrimary"
                                to={`/postuler?jobId=${encodeURIComponent(j.id)}`}
                                style={{ padding: "8px 10px", borderRadius: 12 }}
                              >
                                Postuler
                              </Link>

                              <button
                                className="btn btnSoft"
                                type="button"
                                onClick={() => setOpenId(isOpen ? null : j.id)}
                                style={{ padding: "8px 10px", borderRadius: 12 }}
                              >
                                {isOpen ? "Masquer" : "Voir la fiche"}
                              </button>
                            </div>

                            {isOpen ? (
                              <div className="jdBox">
                                <div className="jdHeader">
                                  <div className="jdHeaderLeft">
                                    <div className="jdChip">Fiche de poste</div>
                                    <div className="jdHeaderTitle">{j.title}</div>

                                    <div className="small" style={{ opacity: 0.9 }}>
                                      Département : <b>{j.dept || "CADECO"}</b> • Niveau :{" "}
                                      <b>{j.level || "—"}</b>
                                    </div>
                                  </div>

                                  <Link
                                    className="btn btnPrimary"
                                    to={`/postuler?jobId=${encodeURIComponent(j.id)}`}
                                    style={{
                                      padding: "10px 12px",
                                      borderRadius: 12,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    Postuler maintenant
                                  </Link>
                                </div>

                                <div className="jdBody">
                                  {splitSections(j.description).map((sec, idx) => (
                                    <SectionBlock key={idx} title={sec.title} lines={sec.lines} />
                                  ))}
                                </div>

                                <div className="jdFooter">
                                  <span className="small" style={{ opacity: 0.85 }}>
                                    
                                  </span>
                                </div>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ===== CARDS (Mobile) ===== */}
              <div className="jobsCards">
                {filtered.map((j) => {
                  const isOpen = String(openId) === String(j.id);
                  return (
                    <div key={j.id} className="jobCard">
                      <div className="jobTop">
                        <div style={{ minWidth: 0 }}>
                          <div className="jobTitle">{j.title}</div>

                          <div className="small jobMeta">
                            Département : <b>{j.dept || "CADECO"}</b>
                            {"  "}•{"  "}
                            Niveau : <b>{j.level || "—"}</b>
                          </div>
                        </div>

                        <button
                          className="btn btnGhost"
                          type="button"
                          onClick={() => setOpenId(isOpen ? null : j.id)}
                          style={{ padding: "8px 10px", borderRadius: 12, flexShrink: 0 }}
                        >
                          {isOpen ? "Masquer" : "Fiche"}
                        </button>
                      </div>

                      {!isOpen ? (
                        <div className="small jobPreview">
                          {j.description ? snippet(j.description, 170) : "Description indisponible."}
                        </div>
                      ) : (
                        <div className="jdBoxMobile">
                          <div className="jdChip">Fiche de poste</div>
                          <div className="jdHeaderTitle" style={{ marginTop: 6 }}>
                            {j.title}
                          </div>

                          <div className="small" style={{ opacity: 0.9, marginTop: 4 }}>
                            Département : <b>{j.dept || "CADECO"}</b> • Niveau :{" "}
                            <b>{j.level || "—"}</b>
                          </div>

                          <div className="jdBody" style={{ padding: 0, marginTop: 10 }}>
                            {splitSections(j.description).map((sec, idx) => (
                              <SectionBlock key={idx} title={sec.title} lines={sec.lines} />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="jobButtons">
                        <Link className="btn btnPrimary" to={`/postuler?jobId=${encodeURIComponent(j.id)}`}>
                          Postuler
                        </Link>

                        <Link className="btn" to="/suivi">
                          Suivi
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="btnRow" style={{ marginTop: 14 }}>
            <Link className="btn" to="/postuler">
              Postuler sans sélection
            </Link>
            <Link className="btn" to="/suivi">
              Suivi
            </Link>
          </div>

          <style>{`
            .jobsCard{ padding:18px; }
            .jobsHero{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; margin-top:6px; }
            .jobsTitle{ margin:10px 0 6px; letter-spacing:-0.02em; }
            .jobsSubtitle{ margin:0; max-width: 760px; }
            .jobsSearch{ margin-top:12px; }

            .jobsTableWrap{ margin-top:14px; overflow:auto; border-radius:12px; }
            .tdTitle{ font-weight:800; }
            .tdSub{ margin-top:4px; opacity:.88; }
            .tdActions{ display:flex; gap:8px; flex-wrap:wrap; align-items:center; }

            .jdBox{
              margin-top:10px;
              border-radius:16px;
              border:1px solid rgba(255,255,255,.10);
              background: rgba(255,255,255,.03);
              overflow:hidden;
            }
            .jdHeader{
              display:flex;
              justify-content:space-between;
              align-items:flex-start;
              gap:12px;
              padding:12px;
              border-bottom:1px solid rgba(255,255,255,.08);
              background: rgba(255,255,255,.02);
              flex-wrap:wrap;
            }
            .jdChip{
              display:inline-flex;
              align-items:center;
              padding:4px 10px;
              border-radius:999px;
              font-size:12px;
              border:1px solid rgba(255,255,255,.10);
              background: rgba(255,255,255,.04);
              width: fit-content;
            }
            .jdHeaderTitle{
              font-weight:900;
              margin-top:6px;
              letter-spacing:-0.02em;
            }
            .jdBody{
              padding:12px;
              display:grid;
              gap:10px;
            }
            .jdSection{
              border:1px solid rgba(255,255,255,.08);
              background: rgba(255,255,255,.02);
              border-radius:14px;
              padding:10px;
            }
            .jdSectionTitle{
              font-size:13px;
              font-weight:800;
              opacity:.95;
            }
            .jdSectionBody{
              margin-top:8px;
              display:grid;
              gap:6px;
            }
            .jdLine{
              font-size:14px;
              line-height:1.55;
              opacity:.95;
              white-space: pre-wrap;
              word-break: break-word;
            }
            .jdFooter{
              padding:10px 12px;
              border-top:1px solid rgba(255,255,255,.08);
              background: rgba(255,255,255,.02);
            }

            .jobsCards{ display:none; margin-top:14px; gap:10px; }
            .jobCard{
              border:1px solid rgba(255,255,255,.10);
              background: rgba(255,255,255,.03);
              border-radius:16px;
              padding:14px;
              min-width:0;
            }
            .jobTop{
              display:flex;
              justify-content:space-between;
              gap:10px;
              align-items:flex-start;
              min-width:0;
            }
            .jobTitle{
              font-weight:900;
              letter-spacing:-0.02em;
              word-break: break-word;
            }
            .jobMeta{ margin-top:4px; opacity:.9; }
            .jobPreview{
              margin-top:10px;
              opacity:.92;
              line-height:1.5;
              word-break: break-word;
            }
            .jdBoxMobile{
              margin-top:10px;
              padding-top:10px;
              border-top:1px solid rgba(255,255,255,.10);
            }
            .jobButtons{
              margin-top:12px;
              display:grid;
              grid-template-columns: 1fr 1fr;
              gap:10px;
            }
            .jobButtons .btn{
              text-align:center;
              padding:10px 12px;
              border-radius:12px;
            }

            /* ✅ Responsive hardening */
            @media (max-width: 920px){
              .jobsTableWrap{ display:none; }
              .jobsCards{ display:grid; }
            }
            @media (max-width: 420px){
              .jobButtons{ grid-template-columns: 1fr; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}