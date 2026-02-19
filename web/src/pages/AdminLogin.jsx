// web/src/pages/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import { adminLogin } from "../lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@cadeco.cd");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!email.trim() || !password.trim()) {
      setErr("Courriel et mot de passe requis.");
      return;
    }

    try {
      setLoading(true);

      const data = await adminLogin({
        email: email.trim(),
        password: password.trim(),
      });

      if (data?.token) {
        localStorage.setItem("cadeco_admin_token", data.token);
      }

      navigate("/admin/dashboard");
    } catch (e) {
      setErr(e?.message || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adminLoginPage">
      <div className="adminLoginCard">
        <div className="adminLoginTop">
          <div className="adminChip">Administration</div>
          <h1 className="adminTitle">Portail Admin</h1>
          <p className="adminSub">Accès réservé au service RH / Direction.</p>
        </div>

        <form className="adminForm" onSubmit={onSubmit}>
          <div className="adminField">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cadeco.cd"
              autoComplete="username"
            />
          </div>

          <div className="adminField">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {err ? <div className="adminError">{err}</div> : null}

          <div className="adminActions">
            <button className="adminBtn" type="submit" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>

          <div className="adminHint">
            Si pas encore de compte, utilise l’endpoint <b>/api/admin/seed</b> (une seule fois).
          </div>
        </form>
      </div>
    </div>
  );
}
