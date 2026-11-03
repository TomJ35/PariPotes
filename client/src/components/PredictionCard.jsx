import React, { useState } from 'react';
import { groupsAPI } from '../api/groups';

function PredictionCard({ prediction, currentUser, balance, onChanged }) {
  const [selected, setSelected] = useState('');
  const [value, setValue] = useState('');
  const [ranking, setRanking] = useState([]);
  const [settleValue, setSettleValue] = useState('');
  const [settleRanking, setSettleRanking] = useState([]);
  const [amount, setAmount] = useState(10);
  const [message, setMessage] = useState('');
  const myWager = prediction.wagers.find(wager => wager.username.toLowerCase() === currentUser.username.toLowerCase());
  const total = prediction.options.reduce((sum, option) => sum + option.pool, 0);
  const maxBet = Math.floor(balance * 50 / 100);
  const isCreator = prediction.creatorUsername.toLowerCase() === currentUser.username.toLowerCase();
  const canSettle = prediction.status === 'open' && (isCreator || (prediction.pendingResult && prediction.pendingResult.username.toLowerCase() !== currentUser.username.toLowerCase()));
  const toggleRanking = (id, setter) => setter(values => values.includes(id) ? values.filter(valueId => valueId !== id) : [...values, id]);

  const wager = async () => {
    try {
      const payload = { username: currentUser.username, amount: Number(amount) };
      if (prediction.type === 'exact_value') payload.value = Number(value);
      else if (prediction.type === 'ranking') payload.ranking = ranking;
      else payload.optionId = selected;
      await groupsAPI.placeWager(prediction.id, payload);
      setMessage('Mise enregistrée.'); onChanged();
    } catch (err) { setMessage(err.message); }
  };
  const settle = async (result) => {
    try {
      const response = await groupsAPI.settlePrediction(prediction.id, { username: currentUser.username, ...result });
      setMessage(response.pending ? 'En attente de la confirmation d’un autre joueur.' : 'Prédiction validée.'); onChanged();
    } catch (err) { setMessage(err.message); }
  };
  const remove = async () => {
    if (!window.confirm('Supprimer cette prédiction et rembourser les mises ?')) return;
    try { await groupsAPI.deletePrediction(prediction.id, currentUser.username); onChanged(); } catch (err) { setMessage(err.message); }
  };
  const renderRankingPicker = (values, setter, disabled = false) => <div className="ranking-picker">{prediction.options.map(option => <button type="button" className={values.includes(option.id) ? 'prediction-option selected' : 'prediction-option'} disabled={disabled} key={option.id} onClick={() => toggleRanking(option.id, setter)}><span>{values.includes(option.id) ? `${values.indexOf(option.id) + 1}. ` : ''}{option.label}</span></button>)}</div>;
  const canWager = prediction.type === 'exact_value' ? value !== '' : prediction.type === 'ranking' ? ranking.length === prediction.options.length : Boolean(selected);
  const renderExactWagers = prediction.type === 'exact_value' && prediction.wagers.length > 0 && <div className="exact-wagers">
    <h3>Prédictions du groupe</h3>
    {prediction.wagers.map(wager => <div className={wager.username.toLowerCase() === currentUser.username.toLowerCase() ? 'exact-wager me' : 'exact-wager'} key={wager.id}>
      <span>{wager.username}{wager.username.toLowerCase() === currentUser.username.toLowerCase() ? ' (toi)' : ''}</span>
      <strong>{wager.value}</strong>
      <span>{wager.amount} pts</span>
    </div>)}
  </div>;

  return <article className={`prediction-card${prediction.status === 'settled' ? ' settled' : ''}`}>
    {prediction.status === 'settled' && <span className="prediction-ribbon">Terminée</span>}
    <div className="prediction-meta"><span>{prediction.type === 'yesno' ? 'OUI / NON' : prediction.type === 'multiple' ? 'CHOIX MULTIPLE' : prediction.type === 'exact_value' ? 'VALEUR EXACTE' : 'CLASSEMENT'}</span><span>{new Date(prediction.createdAt).toLocaleString('fr-FR')}</span></div>
    <h2>{prediction.question}</h2>
    {prediction.type === 'exact_value' ? <input className="prediction-value" type="number" value={value} onChange={event => setValue(event.target.value)} placeholder="Ta valeur" disabled={Boolean(myWager) || prediction.status !== 'open'} /> : prediction.type === 'ranking' ? renderRankingPicker(ranking, setRanking, Boolean(myWager) || prediction.status !== 'open') : <div className="prediction-options">{prediction.options.map(option => <button key={option.id} type="button" className={selected === option.id ? 'prediction-option selected' : 'prediction-option'} onClick={() => setSelected(option.id)} disabled={Boolean(myWager) || prediction.status !== 'open'}><span>{option.label}</span><small>×{option.pool ? (total / option.pool).toFixed(1) : '—'} · {total ? Math.round(option.pool / total * 100) : 0} %</small></button>)}</div>}
    {myWager ? <p className="msg">Ta mise : {myWager.amount} pts{prediction.type === 'exact_value' ? ` sur ${myWager.value}` : ''}</p> : prediction.status === 'open' && <div className="wager-row"><input type="number" min="10" max={maxBet} step="5" value={amount} onChange={event => setAmount(event.target.value)} aria-label="Montant de la mise" /><button className="btn" type="button" disabled={!canWager} onClick={wager}>Miser</button></div>}
    {renderExactWagers}
    {canSettle && <div className="settle-row">{prediction.type === 'exact_value' ? <><input className="prediction-value" type="number" value={settleValue} onChange={event => setSettleValue(event.target.value)} placeholder="Résultat réel" /><button className="btn ghost" type="button" disabled={settleValue === ''} onClick={() => settle({ value: Number(settleValue) })}>{prediction.pendingResult ? 'Confirmer' : 'Valider'}</button></> : prediction.type === 'ranking' ? <>{renderRankingPicker(settleRanking, setSettleRanking)}<button className="btn ghost" type="button" disabled={settleRanking.length !== prediction.options.length} onClick={() => settle({ ranking: settleRanking })}>{prediction.pendingResult ? 'Confirmer' : 'Valider'}</button></> : prediction.options.map(option => <button className="btn ghost" type="button" key={option.id} onClick={() => settle({ optionId: option.id })}>{prediction.pendingResult ? 'Confirmer' : 'Valider'} « {option.label} »</button>)}{isCreator && <button className="btn link" type="button" onClick={remove}>Supprimer</button>}</div>}
    {prediction.pendingResult && <p className="msg">Résultat proposé, confirmation nécessaire par un autre joueur.</p>}
    {prediction.status === 'settled' && <p className="msg">Prédiction validée.</p>}
    {message && <p className="msg error">{message}</p>}
  </article>;
}

export default PredictionCard;
