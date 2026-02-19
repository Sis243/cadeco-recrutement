import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="hero">
      <div className="container">
        <div className="heroGrid">
          <div className="card heroCard">
            <div className="badge">Portail officiel</div>

            <h1 className="hTitle">Dépôt de candidatures en ligne</h1>

            <p className="hText">
              Soumettez votre dossier de candidature en toute simplicité.
              Après dépôt, un numéro de suivi vous permet de consulter l’évolution de votre dossier
              (en cours, qualifié, entretien, retenu / non retenu).
            </p>

            <div className="btnRow">
              <Link className="btn btnPrimary" to="/postes">Voir les postes ouverts</Link>
              <Link className="btn" to="/suivi">Suivre ma candidature</Link>
            </div>

            <div className="small" style={{ marginTop: 12 }}>
              Conseil : préparez votre CV (PDF) et votre pièce d’identité (PDF/JPG/PNG).
            </div>
          </div>

          <div className="card sideCard">
            <div className="badge">Transparence & Traçabilité</div>

            <div className="kpi">
              <div>
                <div className="small">Dépôt</div>
                <b>Simple</b>
              </div>
              <span className="small">Formulaire + pièces</span>
            </div>

            <div className="kpi">
              <div>
                <div className="small">Suivi</div>
                <b>Rapide</b>
              </div>
              <span className="small">Numéro unique</span>
            </div>

            <div className="kpi">
              <div>
                <div className="small">Traitement</div>
                <b>Centralisé</b>
              </div>
              <span className="small">Administration</span>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="grid3">
            <div className="card feature">
              <h3>1) Choisir un poste</h3>
              <p>Consultez la liste des postes ouverts et sélectionnez celui qui vous convient.</p>
            </div>
            <div className="card feature">
              <h3>2) Déposer votre dossier</h3>
              <p>Remplissez le formulaire et joignez vos documents (CV, identité, etc.).</p>
            </div>
            <div className="card feature">
              <h3>3) Suivre le statut</h3>
              <p>Utilisez votre numéro de suivi pour consulter l’état d’avancement de la candidature.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
