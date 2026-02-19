import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function safeStr(v) {
  return (v ?? "").toString();
}

export default function AdminAuditLog() {
  const nav = useNavigate();

  const token = useMemo(() => localStorage.getItem("cadeco_admin_token") || "", []);

  const profile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("cadeco_admin_profile") || "{}");
    } catch {
      return {};
    }
  }, []);

  const canSeeAudit = useMemo(() => {
    return ["ADMIN", "DIRECTION"].includes(String(profile.role || "").toUpperCase());
  }, [profile.role]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");

  useEffect(() => {
    if (!token) nav("/admin");
    if (token && !canSeeAudit) nav("/admin/dashboard");
  }, [token, canSeeAudit, nav]);

  async function load() {
    setErr("");
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (role.trim()) params.set("role", role.trim());
      if (action.trim()) params.set("action", action.trim());
      params.set("limit", "300");

      const res = await fetch(`${API_BASE}/api/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Erreur serveur");

      setRows(Array.isArray(json) ? json : []);
    } catch (e) {
      setErr(e?.message || "Erreur serveur");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="section">
      <div className="container">
        <div className="card adminCard" style={{ padding: 18 }}>
          <div className="adminTop">
            <div>
              <div className="badge">DG • Journal des actions</div>
              <h1 className="adminTitle">Journal DG (Audit Log)</h1>
              <div className="small adminSubtitle">Traçabilité des actions administratives</div>
            </div>

            <div className="adminActions">
              <button className="btn btnGhost" type="button" onClick={() => nav("/admin/dashboard")}>
                Retour Dashboard
              </button>
              <button className="btn btnSoft" type="button" onClick={load} disabled={loading}>
                {loading ? "Chargement…" : "Rafraîchir"}
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="adminFilters" style={{ marginTop: 14 }}>
            <div className="adminFilterRow" style={{ gridTemplateColumns: "1.4fr .8fr .8fr" }}>
              <div>
                <div className="label">Recherche</div>
                <input
                  className="input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="email, action, entity, ip…"
                />
              </div>

              <div>
                <div className="label">Rôle</div>
                <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="">Tous</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="DIRECTION">DIRECTION</option>
                  <option value="RH">RH</option>
                </select>
              </div>

              <div>
                <div className="label">Action</div>
                <input
                  className="input"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="ex: LOGIN, STATUS..."
                />
              </div>
            </div>

            <div className="btnRow" style={{ marginTop: 12 }}>
              <button className="btn btnPrimary" type="button" onClick={load} disabled={loading}>
                {loading ? "Chargement…" : "Appliquer filtres"}
              </button>
            </div>
          </div>

          {err ? (
            <div className="alert alertError" style={{ marginTop: 12 }}>
              {err}
            </div>
          ) : null}

          {/* Table */}
          <div className="tableWrap" style={{ marginTop: 12 }}>
            {loading ? (
              <div className="small" style={{ marginTop: 10 }}>
                Chargement du journal…
              </div>
            ) : rows.length === 0 ? (
              <div className="small" style={{ marginTop: 10 }}>
                Aucun log trouvé.
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Acteur</th>
                    <th>Rôle</th>
                    <th>Action</th>
                    <th>Entité</th>
                    <th>IP</th>
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="mono">
                        {r.createdat || r.createdAt
                          ? new Date(r.createdat || r.createdAt).toLocaleString("fr-FR")
                          : "-"}
                      </td>
                      <td>{r.actoremail || r.actorEmail || "-"}</td>
                      <td>{r.actorrole || r.actorRole || "-"}</td>
                      <td className="mono">{r.action}</td>
                      <td className="mono">
                        {(r.entity || "-") + (r.entityid || r.entityId ? `:${r.entityid || r.entityId}` : "")}
                      </td>
                      <td className="mono">{r.ip || "-"}</td>
                      <td style={{ maxWidth: 360 }}>
                        <details>
                          <summary className="small" style={{ cursor: "pointer" }}>
                            Voir
                          </summary>
                          <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
                            {JSON.stringify(r.details || r.detailsjson || {}, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <style>{`
            .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
            .adminTop{ display:flex; justify-content:space-between; align-items:flex-start; gap:14px; flex-wrap:wrap; }
            .adminActions{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
            .tableWrap{ overflow:auto; border-radius:12px; }
          `}</style>
        </div>
      </div>
    </div>
  );
}
