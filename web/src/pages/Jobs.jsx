import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const JOBS = [
  { id: "1", title: "Chargé(e) de relation avec les clients", dept: "Commercial", level: "Junior/Senior" },
  { id: "2", title: "Délégué(e) commercial", dept: "Commercial", level: "Junior/Senior" },
  { id: "3", title: "Analyste des crédits", dept: "Crédit", level: "Senior" },
  { id: "4", title: "Contrôleur permanent (interne)", dept: "Contrôle", level: "Senior" },
  { id: "5", title: "Agent de recouvrement", dept: "Recouvrement", level: "Junior/Senior" },
  { id: "6", title: "Chef caissier (Coordonnateur)", dept: "Caisse", level: "Senior" },
  { id: "7", title: "Caissier", dept: "Caisse", level: "Junior/Senior" },
  { id: "8", title: "Auditeur interne", dept: "Audit", level: "Senior" },
  { id: "9", title: "Informaticien expert en réseaux", dept: "IT", level: "Senior" },
  { id: "10", title: "Informaticien expert en conception", dept: "IT", level: "Senior" },
];

export default function Jobs() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return JOBS;
    return JOBS.filter((j) =>
      `${j.title} ${j.dept} ${j.level}`.toLowerCase().includes(s)
    );
  }, [q]);

  return (
    <div className="section">
      <div className="container">
        <div className="card formWrap">
          <div className="badge">Postes ouverts</div>

          <h2 style={{ margin: "12px 0 6px" }}>Liste des postes</h2>
          <p className="small" style={{ marginTop: 0 }}>
            Sélectionnez un poste puis cliquez sur <b>Postuler</b>.
          </p>

          <div className="formGrid" style={{ marginTop: 10 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="label">Recherche</div>
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ex : IT, Caissier, Crédit, Audit…"
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Poste</th>
                  <th>Département</th>
                  <th>Niveau</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => (
                  <tr key={j.id}>
                    <td><b>{j.title}</b></td>
                    <td>{j.dept}</td>
                    <td>{j.level}</td>
                    <td>
                      <Link
                        className="btn btnPrimary"
                        // ✅ On envoie jobId pour pré-remplir le 1er choix dans Apply.jsx
                        to={`/postuler?jobId=${encodeURIComponent(j.id)}`}
                        style={{ padding: "8px 10px", borderRadius: 12 }}
                      >
                        Postuler
                      </Link>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="small">
                      Aucun poste ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="btnRow" style={{ marginTop: 14 }}>
            <Link className="btn" to="/postuler">Postuler sans sélection</Link>
            <Link className="btn" to="/suivi">Suivi</Link>
          </div>
        </div>
      </div>
    </div>
  );
}