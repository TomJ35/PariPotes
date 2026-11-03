import React, { useState } from 'react';
import { authAPI } from '../api/auth';

function LoginPage({ onLogin, onNavigateToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const result = authAPI.login(username, password);
    if (result.success) {
      onLogin(username, password);
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
        <h1>Connexion</h1>
        <p className="lead">Connecte-toi pour rejoindre tes potes.</p>
        <form className="panel" onSubmit={handleSubmit}>
          <label>
            Pseudo
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ton pseudo"
              required
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ton mot de passe"
              required
            />
          </label>
          {error && <p className="msg error">{error}</p>}
          <button type="submit" className="btn">Se connecter</button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Pas encore de compte ?{' '}
          <button
            type="button"
            className="btn link"
            onClick={onNavigateToRegister}
          >
            S'inscrire
          </button>
        </p>
      </main>
    </div>
  );
}

export default LoginPage;
