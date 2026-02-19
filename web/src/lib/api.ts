export const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function fetchJobs() {
  const res = await fetch(`${API_BASE}/api/jobs`);
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Erreur API jobs");
  return data?.data || [];
}

export async function submitApplication(form: FormData) {
  const res = await fetch(`${API_BASE}/api/apply`, {
    method: "POST",
    body: form,
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Erreur serveur");
  return data;
}

export async function trackApplication(code: string) {
  const res = await fetch(`${API_BASE}/api/track?code=${encodeURIComponent(code)}`);
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Introuvable");
  return data?.data;
}

export async function adminSeed() {
  const res = await fetch(`${API_BASE}/api/admin/seed`, { method: "POST" });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Seed error");
  return data;
}

// ✅ accepte adminLogin({email,password}) OU adminLogin(email,password)
export async function adminLogin(
  a: string | { email: string; password: string },
  b?: string
) {
  const email = typeof a === "string" ? a : a.email;
  const password = typeof a === "string" ? (b || "") : a.password;

  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Identifiants invalides.");
  return data; // { token, admin }
}

export async function adminListApplications(token: string, q = "") {
  const res = await fetch(
    `${API_BASE}/api/admin/applications?q=${encodeURIComponent(q)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Erreur liste");
  return data?.data || [];
}

export async function adminUpdateStatus(
  token: string,
  id: number | string,
  status: string
) {
  const res = await fetch(`${API_BASE}/api/admin/applications/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Erreur update status");
  return data?.data;
}
