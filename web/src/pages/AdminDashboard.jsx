import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, adminListApplications, adminUpdateStatus } from "../lib/api";

function safeStr(v) {
  return (v ?? "").toString();
}

function toCSV(rows) {
  const escape = (s) => `"${safeStr(s).replaceAll('"', '""')}"`;
  const headers = ["Suivi", "Nom", "Téléphone", "Email", "Ville", "Poste", "Statut", "Créé le"];

  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) =>
      [
        r.trackingCode,
        r.fullName,
        r.phone,
        r.email,
        r.city,
        r.jobId || r.jobTitle,
        r.status,
        r.createdAt ? new Date(r.createdAt).toLocaleString("fr-FR") : "",
      ]
        .map(escape)
        .join(",")
    ),
  ];

  return lines.join("\n");
}

function downloadText(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Pill({ children, tone = "default" }) {
  const cls =
    tone === "ok"
      ? "pill pillOk"
      : tone === "warn"
      ? "pill pillWarn"
      : tone === "bad"
      ? "pill pillBad"
      : "pill";
  return <span className={cls}>{children}</span>;
}

function statusTone(status) {
  const s = safeStr(status).toLowerCase();
  if (s.includes("retenu") || s.includes("accept") || s.includes("qualifie")) return "ok";
  if (s.includes("attente") || s.includes("analyse") || s.includes("entretien") || s.includes("cours"))
    return "warn";
  if (s.includes("non_retenu") || s.includes("refus")) return "bad";
  return "default";
}

export default function AdminDashboard() {
  const nav = useNavigate();

  const token = useMemo(() => localStorage.getItem("cadeco_admin_token") || "", []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Tous");
  const [poste, setPoste] = useState("Tous");
  const [selected, setSelected] = useState(null);

  // ✅ editor status
  const [editStatus, setEditStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // ✅ si pas de token -> retour login
  useEffect(() => {
    if (!token) nav("/admin");
  }, [token, nav]);

  async function load() {
    setErr("");
    setSelected(null);

    try {
      setLoading(true);
      const list = await adminListApplications(token, "");
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(e?.message || "Erreur serveur");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync editor when selection changes
  useEffect(() => {
    if (!selected) {
      setEditStatus("");
      return;
    }
    setEditStatus(selected.status || "RECU");
  }, [selected]);

  const postesOptions = useMemo(() => {
    const set = new Set();
    for (const it of items) if (it?.jobId || it?.jobTitle) set.add(it.jobTitle || it.jobId);
    return ["Tous", ...Array.from(set).sort()];
  }, [items]);

  const statusOptions = useMemo(() => {
    const set = new Set();
    for (const it of items) if (it?.status) set.add(it.status);

    const official = ["RECU", "ATTENTE", "EN_COURS", "QUALIFIE", "ENTRETIEN", "RETENU", "NON_RETENU"];
    const merged = Array.from(set);
    const normalized = [...new Set([...official, ...merged])];

    return ["Tous", ...normalized];
  }, [items]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return items.filter((it) => {
      const itStatus = safeStr(it.status);
      const itPoste = safeStr(it.jobTitle || it.jobId);

      if (status !== "Tous" && itStatus !== status) return false;
      if (poste !== "Tous" && itPoste !== poste) return false;

      if (!qq) return true;

      const hay = [
        it.trackingCode,
        it.fullName,
        it.phone,
        it.email,
        it.city,
        it.jobId,
        it.jobTitle,
        it.status,
      ]
        .map((x) => safeStr(x).toLowerCase())
        .join(" ");

      return hay.includes(qq);
    });
  }, [items, q, status, poste]);

  const kpis = useMemo(() => {
    const total = items.length;

    const enCours = items.filter((x) =>
      ["ATTENTE", "EN_COURS", "ENTRETIEN", "QUALIFIE"].some((k) =>
        safeStr(x.status).toUpperCase().includes(k)
      )
    ).length;

    const retenus = items.filter((x) => safeStr(x.status).toUpperCase().includes("RETENU")).length;

    return { total, enCours, retenus };
  }, [items]);

  function exportCSV() {
    const csv = toCSV(filtered);
    downloadText(
      `candidatures-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      "text/csv;charset=utf-8"
    );
  }

  function exportXLSX() {
    exportCSV(); // Excel ouvre CSV
  }

  function onLogout() {
    localStorage.removeItem("cadeco_admin_token");
    localStorage.removeItem("cadeco_admin_profile");
    nav("/admin");
  }

  async function saveSelectedStatus() {
    if (!selected?.id) return;
    try {
      setSavingStatus(true);
      const updated = await adminUpdateStatus(token, selected.id, editStatus);

      // update list + selected
      setItems((prev) =>
        prev.map((x) => (String(x.id) === String(updated.id) ? updated : x))
      );
      setSelected(updated);
    } catch (e) {
      alert(e?.message || "Erreur mise à jour statut.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function downloadPdfSelected() {
    if (!selected?.id) return;

    try {
      const tk = localStorage.getItem("cadeco_admin_token") || "";
      if (!tk) {
        alert("Session expirée. Merci de vous reconnecter.");
        nav("/admin");
        return;
      }

      const res = await fetch(`${API_BASE}/api/admin/applications/${selected.id}/fiche.pdf`, {
        headers: { Authorization: `Bearer ${tk}` },
      });

      if (!res.ok) {
        let msg = "Impossible de télécharger le PDF.";
        try {
          const t = await res.text();
          if (t) msg = t;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `candidature-${selected.trackingCode || selected.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.message || "Erreur téléchargement PDF.");
    }
  }

  const headerRight = (
    <div className="adminActions">
      <button className="btn btnGhost" onClick={load} disabled={loading}>
        {loading ? "Rafraîchissement…" : "Rafraîchir"}
      </button>

      <button className="btn btnSoft" onClick={exportCSV} disabled={!filtered.length}>
        Export CSV
      </button>

      <button className="btn btnSoft" onClick={exportXLSX} disabled={!filtered.length}>
        Export XLSX
      </button>

      <button className="btn btnGhost" type="button" onClick={onLogout}>
        Déconnexion
      </button>
    </div>
  );

  return (
    <div className="section">
      <div className="container">
        <div className="card adminCard">
          <div className="adminTop">
            <div>
              <div className="badge">Administration • Recrutement CADECO</div>
              <h1 className="adminTitle">Tableau de bord</h1>
              <div className="small adminSubtitle">
                Gestion des candidatures (filtres, statuts, détails)
              </div>
            </div>
            {headerRight}
          </div>

          <div className="adminKpis">
            <div className="kpiCardPro">
              <div className="kpiLabel">Total</div>
              <div className="kpiNumber">{kpis.total}</div>
              <div className="kpiHint">candidatures</div>
            </div>

            <div className="kpiCardPro">
              <div className="kpiLabel">En cours</div>
              <div className="kpiNumber">{kpis.enCours}</div>
              <div className="kpiHint">dossiers</div>
            </div>

            <div className="kpiCardPro">
              <div className="kpiLabel">Retenus</div>
              <div className="kpiNumber">{kpis.retenus}</div>
              <div className="kpiHint">dossiers</div>
            </div>
          </div>

          <div className="adminFilters">
            <div className="adminSearch">
              <div className="label">Recherche</div>
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nom, téléphone, suivi, email, poste…"
              />
            </div>

            <div className="adminFilterRow">
              <div>
                <div className="label">Statut</div>
                <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="label">Poste</div>
                <select className="select" value={poste} onChange={(e) => setPoste(e.target.value)}>
                  {postesOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {err ? (
            <div className="alert alertError" style={{ marginTop: 12 }}>
              {err}
            </div>
          ) : null}

          <div className="adminGrid">
            <div className="card adminInner">
              <div className="badge">Liste des candidatures</div>

              {loading ? (
                <div className="small" style={{ marginTop: 10 }}>
                  Chargement des candidatures…
                </div>
              ) : filtered.length === 0 ? (
                <div className="small" style={{ marginTop: 10 }}>
                  Aucun dossier trouvé.
                </div>
              ) : (
                <div className="tableWrap">
                  <table className="table" style={{ marginTop: 10 }}>
                    <thead>
                      <tr>
                        <th>Suivi</th>
                        <th>Nom</th>
                        <th>Poste</th>
                        <th>Statut</th>
                        <th style={{ width: 110 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((it) => (
                        <tr
                          key={it.trackingCode || it.id}
                          onClick={() => setSelected(it)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className="mono">{it.trackingCode}</td>
                          <td>{it.fullName}</td>
                          <td>{it.jobTitle || it.jobId}</td>
                          <td>
                            <Pill tone={statusTone(it.status)}>{it.status}</Pill>
                          </td>
                          <td>
                            <button
                              className="btn btnGhost"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(it);
                              }}
                            >
                              Détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="small" style={{ marginTop: 10 }}>
                Astuce : clique sur une ligne pour voir les détails.
              </div>
            </div>

            <div className="card adminInner">
              <div className="badge">Détails</div>

              {!selected ? (
                <div className="small" style={{ marginTop: 10 }}>
                  Cliquez sur une candidature pour voir les détails.
                </div>
              ) : (
                <div className="detailsBox">
                  <div className="detailsTitle">
                    <span className="mono">{selected.trackingCode}</span>{" "}
                    <Pill tone={statusTone(selected.status)}>{selected.status}</Pill>
                  </div>

                  <div className="detailsGrid">
                    <div>
                      <div className="label">Nom</div>
                      <div className="detailsValue">{selected.fullName}</div>
                    </div>
                    <div>
                      <div className="label">Poste</div>
                      <div className="detailsValue">{selected.jobTitle || selected.jobId || "-"}</div>
                    </div>
                    <div>
                      <div className="label">Téléphone</div>
                      <div className="detailsValue">{selected.phone || "-"}</div>
                    </div>
                    <div>
                      <div className="label">Email</div>
                      <div className="detailsValue">{selected.email || "-"}</div>
                    </div>
                    <div>
                      <div className="label">Ville</div>
                      <div className="detailsValue">{selected.city || "-"}</div>
                    </div>
                    <div>
                      <div className="label">Créé le</div>
                      <div className="detailsValue">
                        {selected.createdAt ? new Date(selected.createdAt).toLocaleString("fr-FR") : "-"}
                      </div>
                    </div>
                  </div>

                  {/* ✅ CHANGE STATUS */}
                  <div style={{ marginTop: 12 }}>
                    <div className="label">Changer le statut</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        className="select"
                        value={editStatus || "RECU"}
                        onChange={(e) => setEditStatus(e.target.value)}
                        style={{ minWidth: 220 }}
                      >
                        {["RECU", "ATTENTE", "EN_COURS", "QUALIFIE", "ENTRETIEN", "RETENU", "NON_RETENU"].map(
                          (s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          )
                        )}
                      </select>

                      <button
                        className="btn btnSoft"
                        type="button"
                        onClick={saveSelectedStatus}
                        disabled={savingStatus || !editStatus || editStatus === selected.status}
                      >
                        {savingStatus ? "Enregistrement..." : "Enregistrer"}
                      </button>
                    </div>
                  </div>

                  {/* Liens fichiers */}
                  <div className="detailsFiles">
                    <div className="label">Fichiers</div>
                    <div className="small">
                      CV :{" "}
                      {selected.cvPath ? (
                        <a href={`${API_BASE}/${selected.cvPath}`} target="_blank" rel="noreferrer">
                          Ouvrir
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div className="small">
                      ID :{" "}
                      {selected.idPath ? (
                        <a href={`${API_BASE}/${selected.idPath}`} target="_blank" rel="noreferrer">
                          Ouvrir
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>

                    {/* ✅ PDF download */}
                    {selected.id ? (
                      <div style={{ marginTop: 10 }}>
                        <button className="btn btnSoft" type="button" onClick={downloadPdfSelected}>
                          Télécharger PDF (fiche)
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>

          <style>{`
            .adminCard{ padding:18px; }
            .adminTop{ display:flex; justify-content:space-between; align-items:flex-start; gap:14px; flex-wrap:wrap; }
            .adminTitle{ margin:10px 0 6px; letter-spacing:-0.02em; }
            .adminSubtitle{ opacity:.9; }
            .adminActions{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

            .adminKpis{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:12px; margin-top:16px; }
            .kpiCardPro{ border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:14px; background: rgba(255,255,255,.03); }
            .kpiLabel{ font-size:12px; opacity:.85; }
            .kpiNumber{ font-size:28px; font-weight:700; margin-top:6px; }
            .kpiHint{ font-size:12px; opacity:.75; margin-top:2px; }

            .adminFilters{ margin-top:16px; display:grid; gap:12px; }
            .adminFilterRow{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
            .adminGrid{ margin-top:14px; display:grid; grid-template-columns: 1.3fr .9fr; gap:12px; }
            .adminInner{ padding:12px; }

            .tableWrap{ overflow:auto; border-radius:12px; }
            .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

            .pill{ display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; font-size:12px; border:1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.04); }
            .pillOk{ border-color: rgba(46, 204, 113, .35); background: rgba(46, 204, 113, .12); }
            .pillWarn{ border-color: rgba(241, 196, 15, .35); background: rgba(241, 196, 15, .12); }
            .pillBad{ border-color: rgba(231, 76, 60, .35); background: rgba(231, 76, 60, .12); }

            .detailsBox{ margin-top:10px; }
            .detailsTitle{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; border-radius:12px; background: rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); }
            .detailsGrid{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:12px; }
            .detailsValue{ font-size:14px; margin-top:4px; }
            .detailsFiles{ margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,.08); }

            @media (max-width: 980px){
              .adminKpis{ grid-template-columns: 1fr; }
              .adminFilterRow{ grid-template-columns: 1fr; }
              .adminGrid{ grid-template-columns: 1fr; }
              .detailsGrid{ grid-template-columns: 1fr; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
