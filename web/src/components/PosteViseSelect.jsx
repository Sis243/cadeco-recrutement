import { useEffect, useMemo, useState } from "react";
import { fetchJobs } from "../lib/api";

export default function PosteViseSelect({
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Sélectionner un poste",
  excludeIds = [],
}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setErr("");
        setLoading(true);
        const list = await fetchJobs();
        if (!mounted) return;
        setJobs(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!mounted) return;
        setErr(e?.message || "Impossible de charger les postes.");
        setJobs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const ex = new Set((excludeIds || []).filter(Boolean).map(String));
    return (jobs || []).filter((j) => {
      const id = String(j.id ?? "");
      if (value && id === String(value)) return true;
      return !ex.has(id);
    });
  }, [jobs, excludeIds, value]);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <select
        className="select"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled || loading}
      >
        <option value="">{loading ? "Chargement..." : placeholder}</option>
        {filteredJobs.map((j) => (
          <option key={String(j.id)} value={String(j.id)}>
            {j.title}
          </option>
        ))}
      </select>

      {err ? (
        <div style={{ color: "#FF8A8A", fontSize: 12 }}>{err}</div>
      ) : null}
    </div>
  );
}