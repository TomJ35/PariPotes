import React, { useState } from 'react';

function SettingsPage({ onLogout, onDeleteAccount }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDeleteAccount();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="wrap">
      <main>
        <h1>Paramètres</h1>
        <p className="lead">Gère ton compte.</p>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            type="button"
            className="btn"
            onClick={onLogout}
          >
            Se déconnecter
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={handleDeleteClick}
          >
            {showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer mon compte'}
          </button>
          {showDeleteConfirm && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Annuler
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;
