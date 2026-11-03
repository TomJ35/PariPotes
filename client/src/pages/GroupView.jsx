import React, { useEffect, useState } from 'react';
import { groupsAPI } from '../api/groups';

function GroupView({ group, currentUser, onViewChange, onLeave }) {
  const [members, setMembers] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nextAdminUsername, setNextAdminUsername] = useState('');
  const isAdmin = group.creatorUsername?.toLowerCase() === currentUser.username.toLowerCase();

  useEffect(() => {
    groupsAPI.getGroupMembers(group.id).then(setMembers).catch(() => setMembers([]));
  }, [group.id]);

  const fmt = points => points.toLocaleString('fr-FR');
  const handleLeave = () => groupsAPI.leaveGroup(currentUser.username, isAdmin ? nextAdminUsername : undefined).then(onLeave);

  return (
    <div className="wrap">
      <main>
        <div className="group-title-row">
          <div>
            <h1>{group.name}</h1>
            <p className="lead group-code">Code d'invitation : <strong>{group.inviteCode}</strong></p>
          </div>
          {isAdmin && <button type="button" className="group-settings-button" onClick={() => onViewChange('group-settings')} aria-label="Paramètres du groupe" title="Paramètres du groupe">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
          </button>}
        </div>

        <div className="ranking-heading"><h2>Classement</h2><span>{members.length} membre{members.length > 1 ? 's' : ''}</span></div>
        <div className="group-ranking">
          <ol className="rank">
            {members.map((member, index) => <li key={member.username} className={member.username === currentUser.username ? 'me' : ''}>
              <span className="pos">{index + 1}</span><span className="member-name">{member.username}</span><span className="pts">{fmt(member.points)} pts</span>
            </li>)}
          </ol>
        </div>

        {!showConfirm ? <button type="button" className="btn ghost leave-button" onClick={() => setShowConfirm(true)}>Quitter le groupe</button> : <div className="leave-confirm">
          <p>Es-tu sûr de vouloir quitter le groupe ?</p>
          {isAdmin && <label className="successor-field">Nouvel administrateur<select value={nextAdminUsername} onChange={event => setNextAdminUsername(event.target.value)}><option value="">Choisir un membre</option>{members.filter(member => member.username !== currentUser.username).map(member => <option key={member.username} value={member.username}>{member.username}</option>)}</select></label>}
          <button type="button" className="btn danger" onClick={handleLeave} disabled={isAdmin && !nextAdminUsername}>Oui, quitter</button>
          <button type="button" className="btn ghost" onClick={() => setShowConfirm(false)}>Annuler</button>
        </div>}
      </main>
    </div>
  );
}

export default GroupView;
