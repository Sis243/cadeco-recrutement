// web/src/pages/Track.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { trackApplication } from "../lib/api";

export default function Track() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  async function onSearch(e) {
    e?.preventDefault?.();
    setErr("");
    setData(null);

    if (!code.trim()) {
      setErr("Numéro de suivi requis.");
      return;
    }

    try {
      setLoading(true);
      const row = await trackApplication(code.trim());
      setData(row);
    } catch (e) {
      setErr(e?.message || "Introuvable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // auto search si code dans l'url
    if (params.get("code")) onSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container" style={{ padding: "26px 18px" }}>
      <div className="card" style={{ padding: 18 }}>
        <h1 style={{ marginTop: 0 }}>Suivi de candidature</h1>

        <form onSubmit={onSearch} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label>Numéro de suivi</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: CD-2026-AB12CD"
            />
          </div>

          <button className="btn btnPrimary" disabled={loading} type="submit">
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </form>

        {err ? <div className="alert alertError" style={{ marginTop: 12 }}>{err}</div> : null}

        {data ? (
          <div className="alert alertOk" style={{ marginTop: 12 }}>
            <div><b>Nom :</b> {data.fullName}</div>
            <div><b>Email :</b> {data.email}</div>
            <div><b>Téléphone :</b> {data.phone}</div>
            <div><b>Poste :</b> {data.jobTitle || "—"}</div>
            <div><b>Statut :</b> {data.status}</div>
            <div><b>Code :</b> {data.trackingCode}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
