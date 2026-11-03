import React, { useState } from 'react';
import { groupsAPI } from '../api/groups';

function JoinGroupPage({ currentUser, onGroupJoined, onBack }) {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!inviteCode || inviteCode.trim().length === 0) {
      setError('Veuillez entrer un code d\'invitation');
      return;
    }

    try {
      const result = await groupsAPI.joinGroup(inviteCode.trim().toUpperCase(), currentUser.username);
      onGroupJoined(result.group);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
      <main>
        <h1>Rejoindre un groupe</h1>
        <p className="lead">Entre le code d\'invitation pour rejoindre le groupe de tes potes.</p>
        <form className="panel" onSubmit={handleSubmit}>
          <label>
            Code d'invitation
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Ex. ABC123"
              required
              style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
            />
          </label>
          {error && <p className="msg error">{error}</p>}
          <button type="submit" className="btn">Rejoindre</button>
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

export default JoinGroupPage;
