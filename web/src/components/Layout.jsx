import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

export default function Layout() {
  const { pathname } = useLocation();

  const isActive = (p) => (pathname === p ? "pill pillActive" : "pill");

  // ✅ Admin visible seulement si un token existe
  const adminToken = localStorage.getItem("cadeco_admin_token");
  const showAdmin = Boolean(adminToken);

  return (
    <>
      <div className="nav">
        <div className="container">
          <div className="navInner">
            <Link className="brand" to="/">
              <div className="logoBox">
                <img
                  src="/cadeco-logo.png"
                  alt="CADECO"
                  className="logoImg"
                  draggable="false"
                />
              </div>
              <div>
                <div className="brandTitle">CADECO RECRUTEMENT</div>
                <div className="brandSub">Portail officiel de candidature & suivi</div>
              </div>
            </Link>

            <div className="navLinks">
              <Link className={isActive("/")} to="/">
                Accueil
              </Link>
              <Link className={isActive("/postes")} to="/postes">
                Postes
              </Link>
              <Link className={isActive("/postuler")} to="/postuler">
                Postuler
              </Link>
              <Link className={isActive("/suivi")} to="/suivi">
                Suivi
              </Link>

              {/* ✅ Lien Admin masqué si pas connecté */}
              {showAdmin ? (
                <Link className={isActive("/admin")} to="/admin/dashboard">
                  Admin
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <main>
        <Outlet />
      </main>

      <div className="footer">
        <div className="container">
          © {new Date().getFullYear()} CADECO | Recrutement.{" "}
          <span className="small">Développé par le Département Informatique</span>
        </div>
      </div>
    </>
  );
}
