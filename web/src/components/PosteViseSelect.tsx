import { useEffect, useState } from "react";
import { fetchJobs, type Job } from "../lib/api";

type Props = {
  value: string; // jobId
  onChange: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export default function PosteViseSelect({
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Sélectionner un poste",
}: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
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
      } catch (e: any) {
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
        {jobs.map((j) => (
          <option key={String(j.id)} value={String(j.id)}>
            {j.title}
          </option>
        ))}
      </select>

      {err ? (
        <div style={{ color: "#FF8A8A", fontSize: 12 }}>
          {err}
        </div>
      ) : null}
    </div>
  );
}
