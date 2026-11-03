import React, { useState } from 'react';
import { groupsAPI } from '../api/groups';

function CreateGroupPage({ currentUser, onGroupCreated, onBack }) {
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!groupName || groupName.trim().length === 0) {
      setError('Veuillez entrer un nom de groupe');
      return;
    }

    if (groupName.length < 3) {
      setError('Le nom du groupe doit contenir au moins 3 caractères');
      return;
    }

    try {
      const result = await groupsAPI.createGroup(groupName.trim(), currentUser.username);
      onGroupCreated(result.group);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
      <main>
        <h1>Créer un groupe</h1>
        <p className="lead">Crée ton groupe et invite tes potes à parier.</p>
        <form className="panel" onSubmit={handleSubmit}>
          <label>
            Nom du groupe
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex. La Team du bureau"
              required
            />
          </label>
          {error && <p className="msg error">{error}</p>}
          <button type="submit" className="btn">Créer le groupe</button>
          <button
            type="button"
            className="btn ghost"
            onClick={onBack}
          >
            Retour
          </button>
        </form>
      </main>
  );
}

export default CreateGroupPage;
