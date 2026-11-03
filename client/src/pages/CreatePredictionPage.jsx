import React, { useState } from 'react';
import { groupsAPI } from '../api/groups';

function CreatePredictionPage({ group, currentUser, onCreated, onBack }) {
  const [question, setQuestion] = useState('');
  const [type, setType] = useState('yesno');
  const [choices, setChoices] = useState(['', '']);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const options = type === 'yesno' ? ['Oui', 'Non'] : choices;
    try {
      await groupsAPI.createPrediction({ groupId: group.id, creatorUsername: currentUser.username, type, question, options });
      onCreated();
    } catch (err) { setError(err.message); }
  };

  return <main>
    <h1>Créer une prédiction</h1>
    <p className="lead">Une question, des choix, et tes potes n’ont plus qu’à miser.</p>
    <form className="panel" onSubmit={submit}>
      <label>Question<input value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ex. Le bus aura-t-il du retard ?" required /></label>
      <label>Type<select value={type} onChange={event => setType(event.target.value)}><option value="yesno">Oui / Non</option><option value="multiple">Choix multiple</option><option value="exact_value">Valeur exacte</option><option value="ranking">Classement</option></select></label>
      {(type === 'multiple' || type === 'ranking') && choices.map((choice, index) => <label key={index}>Option {index + 1}<input value={choice} onChange={event => setChoices(values => values.map((value, i) => i === index ? event.target.value : value))} required /></label>)}
      {(type === 'multiple' || type === 'ranking') && <button type="button" className="btn ghost" onClick={() => setChoices(values => [...values, ''])}>Ajouter une option</button>}
      {error && <p className="msg error">{error}</p>}
      <button className="btn" type="submit">Lancer la prédiction</button>
      <button className="btn ghost" type="button" onClick={onBack}>Retour</button>
    </form>
  </main>;
}

export default CreatePredictionPage;
