import React from 'react';

function NavIcon({ name }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /></>,
    group: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2" /><path d="M3 20c.4-3 2.4-5 6-5s5.6 2 6 5M15 15c3 0 5 1.6 6 4" /></>,
    settings: <><path d="M4 7h16M4 12h16M4 17h16" /><circle cx="9" cy="7" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="11" cy="17" r="2" /></>,
  };
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function Header({ balance, currentView, onViewChange }) {
  const tabs = [['home', 'Accueil'], ['group', 'Groupe'], ['settings', 'Réglages']];
  return <header>
    <div className="logo">PariPotes</div>
    <nav aria-label="Navigation principale">
      {tabs.map(([id, label]) => <button key={id} type="button" onClick={() => onViewChange(id)} aria-current={currentView === id ? 'page' : undefined}><NavIcon name={id} /><span>{label}</span></button>)}
    </nav>
    <div className="coin" aria-live="polite"><strong>{balance}</strong><span>points</span></div>
  </header>;
}

export default Header;
