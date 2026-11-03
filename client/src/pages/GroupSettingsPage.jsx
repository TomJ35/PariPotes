import React, { useState } from 'react';
import { groupsAPI } from '../api/groups';

function GroupSettingsPage({ group, currentUser, onBack, onSaved, onDeleted }) {
  const isAdmin = group.creatorUsername?.toLowerCase() === currentUser.username.toLowerCase();
  const [name, setName] = useState(group.name);
  const [groupRules, setGroupRules] = useState(group.rules || {});
  const [message, setMessage] = useState('');
  const updateRule = (key, value) => setGroupRules(rules => ({ ...rules, [key]: value }));

  if (!isAdmin) return <main><h1>Accès refusé</h1><p className="lead">Seul l'administrateur du groupe peut accéder à ces paramètres.</p><button className="btn" type="button" onClick={onBack}>Retour au groupe</button></main>;

  const save = async event => {
    event.preventDefault();
    try {
      await groupsAPI.updateGroupSettings(group.id, currentUser.username, name, { ...groupRules, min_bet: Number(groupRules.min_bet), max_bet_percent_of_balance: Number(groupRules.max_bet_percent_of_balance), house_fee_percent: Number(groupRules.house_fee_percent), betting_closes_before_event_minutes: Number(groupRules.betting_closes_before_event_minutes) });
      setMessage('Paramètres enregistrés.');
      onSaved();
    } catch (err) { setMessage(err.message); }
  };

  const deleteGroup = async () => {
    if (!window.confirm(`Supprimer définitivement le groupe « ${group.name} » et toutes ses prédictions ?`)) return;
    try {
      await groupsAPI.deleteGroup(group.id, currentUser.username);
      onDeleted();
    } catch (err) { setMessage(err.message); }
  };

  return <main>
    <h1>Paramètres du groupe</h1>
    <p className="lead">Modifie le nom et les règles appliquées à ce groupe.</p>
    <form className="panel group-settings-panel" onSubmit={save}>
      <label>Nom du groupe<input value={name} onChange={event => setName(event.target.value)} minLength="3" required /></label>
      <label>Mise minimale<input type="number" min="0" value={groupRules.min_bet ?? ''} onChange={event => updateRule('min_bet', event.target.value)} /></label>
      <label>Plafond de mise (% du solde)<input type="number" min="1" max="100" value={groupRules.max_bet_percent_of_balance ?? ''} onChange={event => updateRule('max_bet_percent_of_balance', event.target.value)} /></label>
      <label>Commission (%)<input type="number" min="0" max="100" value={groupRules.house_fee_percent ?? ''} onChange={event => updateRule('house_fee_percent', event.target.value)} /></label>
      <label>Clôture avant l'événement (minutes)<input type="number" min="0" value={groupRules.betting_closes_before_event_minutes ?? ''} onChange={event => updateRule('betting_closes_before_event_minutes', event.target.value)} /></label>
      <label>Création des prédictions<select value={groupRules.who_can_create_bets || 'everyone'} onChange={event => updateRule('who_can_create_bets', event.target.value)}><option value="everyone">Tout le monde</option><option value="admin">Administrateur uniquement</option></select></label>
      <label>Validation des prédictions<select value={groupRules.who_can_settle_bets || 'creator_or_admin'} onChange={event => updateRule('who_can_settle_bets', event.target.value)}><option value="creator_or_admin">Créateur ou administrateur</option><option value="creator">Créateur</option><option value="admin">Administrateur</option></select></label>
      <label className="checkbox-field"><input type="checkbox" checked={Boolean(groupRules.settlement_requires_confirmation)} onChange={event => updateRule('settlement_requires_confirmation', event.target.checked)} /> Demander la confirmation d'un autre joueur</label>
      {message && <p className="msg">{message}</p>}
      <button className="btn" type="submit">Enregistrer les paramètres</button>
      <button className="btn ghost" type="button" onClick={onBack}>Retour au groupe</button>
      <hr className="settings-divider" />
      <button className="btn danger" type="button" onClick={deleteGroup}>Supprimer définitivement le groupe</button>
    </form>
  </main>;
}

export default GroupSettingsPage;
