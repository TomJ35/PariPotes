import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import CreateGroupPage from './pages/CreateGroupPage';
import JoinGroupPage from './pages/JoinGroupPage';
import GroupView from './pages/GroupView';
import GroupSettingsPage from './pages/GroupSettingsPage';
import CreatePredictionPage from './pages/CreatePredictionPage';
import PredictionCard from './components/PredictionCard';
import Header from './components/Header';
import { authAPI } from './api/auth';
import { groupsAPI } from './api/groups';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('login');
  const [currentView, setCurrentView] = useState('home');
  const [balance, setBalance] = useState(1000);
  const [currentUser, setCurrentUser] = useState(null);
  const [userGroup, setUserGroup] = useState(null);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    const user = authAPI.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      loadUserGroup(user.username);
    }
  }, []);

  const loadUserGroup = async (username) => {
    const groupData = await groupsAPI.getUserGroup(username);
    setUserGroup(groupData);
    if (groupData) {
      setBalance(groupData.membership.points);
      loadPredictions(groupData.group.id);
    } else {
      setPredictions([]);
    }
  };

  const loadPredictions = async (groupId) => {
    try { setPredictions(await groupsAPI.getPredictions(groupId)); } catch { setPredictions([]); }
  };

  const refreshGroupData = async () => {
    if (currentUser) await loadUserGroup(currentUser.username);
  };

  useEffect(() => {
    if (!currentUser || !userGroup) return undefined;
    const refreshTimer = setInterval(() => {
      refreshGroupData();
    }, 3000);
    return () => clearInterval(refreshTimer);
  }, [currentUser?.username, userGroup?.group?.id]);

  const handleLogin = (username, password) => {
    const user = authAPI.getCurrentUser();
    setCurrentUser(user);
    setIsAuthenticated(true);
    loadUserGroup(username);
  };

  const handleRegister = (username, password) => {
    const user = authAPI.getCurrentUser();
    setCurrentUser(user);
    setIsAuthenticated(true);
    loadUserGroup(username);
  };

  const handleLogout = () => {
    authAPI.logout();
    setCurrentUser(null);
    setUserGroup(null);
    setIsAuthenticated(false);
    setView('login');
  };

  const handleDeleteAccount = () => {
    if (currentUser) {
      if (userGroup) {
        groupsAPI.leaveGroup(currentUser.username);
      }
      authAPI.deleteAccount(currentUser.username);
      setCurrentUser(null);
      setUserGroup(null);
      setIsAuthenticated(false);
      setView('login');
    }
  };

  const handleGroupCreated = async (group) => {
    await loadUserGroup(currentUser.username);
    setCurrentView('group');
  };

  const handleGroupJoined = async (group) => {
    await loadUserGroup(currentUser.username);
    setCurrentView('group');
  };

  const handleLeaveGroup = () => {
    if (currentUser) {
      setUserGroup(null);
      setBalance(1000);
      setCurrentView('home');
    }
  };

  if (!isAuthenticated) {
    if (view === 'login') {
      return (
        <LoginPage
          onLogin={handleLogin}
          onNavigateToRegister={() => setView('register')}
        />
      );
    }
    if (view === 'register') {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onNavigateToLogin={() => setView('login')}
        />
      );
    }
  }

  const renderContent = () => {
    if (currentView === 'create-group') {
      return (
        <CreateGroupPage
          currentUser={currentUser}
          onGroupCreated={handleGroupCreated}
          onBack={() => setCurrentView('home')}
        />
      );
    }

    if (currentView === 'join-group') {
      return (
        <JoinGroupPage
          currentUser={currentUser}
          onGroupJoined={handleGroupJoined}
          onBack={() => setCurrentView('home')}
        />
      );
    }

    if (currentView === 'create-prediction') {
      return <CreatePredictionPage group={userGroup.group} currentUser={currentUser} onCreated={() => { loadPredictions(userGroup.group.id); setCurrentView('home'); }} onBack={() => setCurrentView('home')} />;
    }

    if (currentView === 'group') {
      if (!userGroup) {
        return (
          <main>
            <h1>Tu n'as pas de groupe</h1>
            <p className="lead">Crée ou rejoins un groupe pour commencer à parier.</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setCurrentView('create-group')}
              >
                Créer un groupe
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setCurrentView('join-group')}
              >
                Rejoindre un groupe
              </button>
            </div>
          </main>
        );
      }
      return (
        <GroupView
          group={userGroup.group}
          currentUser={currentUser}
          balance={balance}
          onViewChange={setCurrentView}
          onLeave={handleLeaveGroup}
        />
      );
    }

    if (currentView === 'group-settings') {
      return <GroupSettingsPage group={userGroup.group} currentUser={currentUser} onBack={() => setCurrentView('group')} onSaved={() => { refreshGroupData(); setCurrentView('group'); }} />;
    }

    if (currentView === 'create') {
      return (
        <main>
          <h1>Créer</h1>
          <p className="lead">À venir...</p>
        </main>
      );
    }

    if (currentView === 'settings') {
      return (
        <SettingsPage
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      );
    }

    if (currentView === 'home') {
      if (!userGroup) {
        return (
          <main>
            <h1>Hello, {currentUser?.username} !</h1>
            <p className="lead">Crée ou rejoins un groupe pour commencer à parier.</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setCurrentView('create-group')}
              >
                Créer un groupe
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setCurrentView('join-group')}
              >
                Rejoindre un groupe
              </button>
            </div>
          </main>
        );
      }
      return (
        <main>
          <h1>Hello, {currentUser?.username} !</h1>
          <div className="home-heading"><p className="lead">Les prédictions de ton groupe</p><button className="btn" type="button" onClick={() => setCurrentView('create-prediction')}>Créer une prédiction</button></div>
          <section className="predictions-list">
            {predictions.length === 0 ? <div className="panel"><p>Aucune prédiction pour le moment.</p></div> : predictions.map(prediction => <PredictionCard key={prediction.id} prediction={prediction} currentUser={currentUser} balance={balance} onChanged={refreshGroupData} />)}
          </section>
        </main>
      );
    }

    return (
      <main>
        <h1>Hello, {currentUser?.username} !</h1>
      </main>
    );
  };

  return (
    <div className="wrap">
      <Header
        balance={balance}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      {renderContent()}
    </div>
  );
}

export default App;
