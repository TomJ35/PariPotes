import React, { useState } from 'react';
import { authAPI } from '../api/auth';

function RegisterPage({ onRegister, onNavigateToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const result = authAPI.register(username, password);
    if (result.success) {
      onRegister(username, password);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="wrap">
      <header>
        <div className="logo">PariPotes</div>
      </header>
      <main>
        <h1>Inscription</h1>
        <p className="lead">Crée ton compte pour parier avec tes potes.</p>
        <form className="panel" onSubmit={handleSubmit}>
          <label>
            Pseudo
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choisis un pseudo"
              required
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choisis un mot de passe"
              required
            />
          </label>
          <label>
            Confirmer le mot de passe
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme ton mot de passe"
              required
            />
          </label>
          {error && <p className="msg error">{error}</p>}
          <button type="submit" className="btn">S'inscrire</button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Déjà un compte ?{' '}
          <button
            type="button"
            className="btn link"
            onClick={onNavigateToLogin}
          >
            Se connecter
          </button>
        </p>
      </main>
    </div>
  );
}

export default RegisterPage;
