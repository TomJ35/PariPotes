const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDirectory = path.join(__dirname, '../../data');
const databaseFile = path.join(dataDirectory, 'paripotes.db');
const legacyGroupsFile = path.join(dataDirectory, 'groups.json');
const rules = require('./config/rules.json');

app.use(express.json());

fs.mkdirSync(dataDirectory, { recursive: true });
const db = new Database(databaseFile);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    creator_username TEXT NOT NULL,
    rules TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS memberships (
    username TEXT PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id),
    points INTEGER NOT NULL,
    joined_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id),
    creator_username TEXT NOT NULL,
    type TEXT NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    pending_result TEXT,
    result_option_id TEXT,
    result_value REAL,
    result_ranking TEXT
  );
  CREATE TABLE IF NOT EXISTS wagers (
    id INTEGER PRIMARY KEY,
    prediction_id INTEGER NOT NULL REFERENCES predictions(id),
    username TEXT NOT NULL,
    option_id TEXT,
    value REAL,
    ranking TEXT,
    amount INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
`);

function readJson(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function readGroupsData() {
  return {
    groups: db.prepare('SELECT id, name, invite_code AS inviteCode, creator_username AS creatorUsername, rules, created_at AS createdAt FROM groups').all().map(group => ({ ...group, rules: readJson(group.rules, {}) })),
    memberships: db.prepare('SELECT username, group_id AS groupId, points, joined_at AS joinedAt FROM memberships').all(),
    predictions: db.prepare('SELECT id, group_id AS groupId, creator_username AS creatorUsername, type, question, options, status, created_at AS createdAt, pending_result AS pendingResult, result_option_id AS resultOptionId, result_value AS resultValue, result_ranking AS resultRanking FROM predictions').all().map(prediction => ({ ...prediction, options: readJson(prediction.options, []), pendingResult: readJson(prediction.pendingResult, null), resultRanking: readJson(prediction.resultRanking, undefined) })),
    wagers: db.prepare('SELECT id, prediction_id AS predictionId, username, option_id AS optionId, value, ranking, amount, created_at AS createdAt FROM wagers').all().map(wager => ({ ...wager, ranking: readJson(wager.ranking, undefined) })),
  };
}

const writeGroupsData = db.transaction(data => {
  db.prepare('DELETE FROM wagers').run();
  db.prepare('DELETE FROM predictions').run();
  db.prepare('DELETE FROM memberships').run();
  db.prepare('DELETE FROM groups').run();
  const insertGroup = db.prepare('INSERT INTO groups (id, name, invite_code, creator_username, rules, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const insertMembership = db.prepare('INSERT INTO memberships (username, group_id, points, joined_at) VALUES (?, ?, ?, ?)');
  const insertPrediction = db.prepare('INSERT INTO predictions (id, group_id, creator_username, type, question, options, status, created_at, pending_result, result_option_id, result_value, result_ranking) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertWager = db.prepare('INSERT INTO wagers (id, prediction_id, username, option_id, value, ranking, amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const group of data.groups || []) insertGroup.run(group.id, group.name, group.inviteCode, group.creatorUsername, JSON.stringify(group.rules || {}), group.createdAt);
  for (const membership of data.memberships || []) insertMembership.run(membership.username, membership.groupId, membership.points, membership.joinedAt);
  for (const prediction of data.predictions || []) insertPrediction.run(prediction.id, prediction.groupId, prediction.creatorUsername, prediction.type, prediction.question, JSON.stringify(prediction.options || []), prediction.status, prediction.createdAt, prediction.pendingResult ? JSON.stringify(prediction.pendingResult) : null, prediction.resultOptionId || null, prediction.resultValue ?? null, prediction.resultRanking ? JSON.stringify(prediction.resultRanking) : null);
  for (const wager of data.wagers || []) insertWager.run(wager.id, wager.predictionId, wager.username, wager.optionId || null, wager.value ?? null, wager.ranking ? JSON.stringify(wager.ranking) : null, wager.amount, wager.createdAt);
});

if (db.prepare('SELECT COUNT(*) AS count FROM groups').get().count === 0 && fs.existsSync(legacyGroupsFile)) {
  try { writeGroupsData(JSON.parse(fs.readFileSync(legacyGroupsFile, 'utf8'))); console.log('Migrated groups.json to SQLite'); } catch (error) { console.error('SQLite migration failed:', error.message); }
}

function getGroupRules(group) {
  return { ...rules, ...(group?.rules || {}) };
}

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, '../dist')));

// API route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/groups/user/:username', (req, res) => {
  const data = readGroupsData();
  const membership = data.memberships.find(item => item.username.toLowerCase() === req.params.username.toLowerCase());
  if (!membership) return res.json(null);
  const group = data.groups.find(item => item.id === membership.groupId);
  res.json(group ? { group: { ...group, rules: getGroupRules(group) }, membership } : null);
});

app.get('/api/groups/:groupId/members', (req, res) => {
  const data = readGroupsData();
  const members = data.memberships
    .filter(item => String(item.groupId) === String(req.params.groupId))
    .sort((a, b) => b.points - a.points);
  res.json(members);
});

app.get('/api/groups/:groupId/predictions', (req, res) => {
  const data = readGroupsData();
  const predictions = (data.predictions || [])
    .filter(item => String(item.groupId) === String(req.params.groupId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(predictions.map(prediction => ({
    ...prediction,
    options: prediction.options.map(option => ({
      ...option,
      pool: (data.wagers || [])
        .filter(wager => wager.predictionId === prediction.id && wager.optionId === option.id)
        .reduce((sum, wager) => sum + wager.amount, 0),
    })),
    wagers: (data.wagers || []).filter(wager => wager.predictionId === prediction.id),
  })));
});

app.post('/api/groups', (req, res) => {
  const { name, creatorUsername } = req.body;
  if (!name || !creatorUsername) return res.status(400).json({ error: 'Informations du groupe incomplètes' });

  const data = readGroupsData();
  let inviteCode;
  do {
    inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (data.groups.some(group => group.inviteCode === inviteCode));

  const group = { id: Date.now(), name: name.trim(), inviteCode, creatorUsername, rules: { ...rules }, createdAt: new Date().toISOString() };
  data.groups.push(group);
  data.memberships.push({ username: creatorUsername, groupId: group.id, points: 1000, joinedAt: new Date().toISOString() });
  writeGroupsData(data);
  res.status(201).json({ success: true, group });
});

app.post('/api/groups/join', (req, res) => {
  const { inviteCode, username } = req.body;
  const data = readGroupsData();
  const normalizedCode = String(inviteCode || '').toUpperCase().replace(/-/g, '').replace(/\s/g, '');
  const group = data.groups.find(item => item.inviteCode.toUpperCase().replace(/-/g, '') === normalizedCode);
  if (!group) return res.status(404).json({ success: false, error: "Aucun groupe ne correspond à ce code" });
  if (data.memberships.some(item => item.username.toLowerCase() === String(username).toLowerCase())) {
    return res.status(409).json({ success: false, error: 'Tu appartiens déjà à un groupe' });
  }
  data.memberships.push({ username, groupId: group.id, points: 1000, joinedAt: new Date().toISOString() });
  writeGroupsData(data);
  res.json({ success: true, group });
});

app.post('/api/predictions', (req, res) => {
  const { groupId, creatorUsername, type, question, options } = req.body;
  const cleanedOptions = (options || []).map((label, index) => ({ id: `option-${index + 1}`, label: String(label).trim() })).filter(option => option.label);
  if (!groupId || !creatorUsername || !question || !['yesno', 'multiple', 'exact_value', 'ranking'].includes(type) || (['yesno', 'multiple', 'ranking'].includes(type) && cleanedOptions.length < 2)) {
    return res.status(400).json({ error: 'La prédiction est incomplète' });
  }
  const data = readGroupsData();
  const isMember = data.memberships.some(item => String(item.groupId) === String(groupId) && item.username.toLowerCase() === creatorUsername.toLowerCase());
  if (!isMember) return res.status(403).json({ error: 'Tu ne fais pas partie de ce groupe' });
  const group = data.groups.find(item => String(item.id) === String(groupId));
  if (getGroupRules(group).who_can_create_bets === 'admin' && group.creatorUsername.toLowerCase() !== creatorUsername.toLowerCase()) return res.status(403).json({ error: 'Seul l’administrateur peut créer une prédiction' });
  const prediction = {
    id: Date.now(), groupId, creatorUsername, type, question: question.trim(), options: cleanedOptions,
    status: 'open', createdAt: new Date().toISOString(), pendingResult: null,
  };
  data.predictions = data.predictions || [];
  data.wagers = data.wagers || [];
  data.predictions.push(prediction);
  writeGroupsData(data);
  res.status(201).json(prediction);
});

app.post('/api/predictions/:predictionId/wagers', (req, res) => {
  const { username, optionId, amount } = req.body;
  const numericAmount = Number(amount);
  const data = readGroupsData();
  const prediction = (data.predictions || []).find(item => String(item.id) === String(req.params.predictionId));
  const membership = data.memberships.find(item => String(item.groupId) === String(prediction?.groupId) && item.username.toLowerCase() === String(username).toLowerCase());
  if (!prediction || prediction.status !== 'open') return res.status(400).json({ error: 'Cette prédiction n’est plus ouverte' });
  if (!membership) return res.status(403).json({ error: 'Tu ne fais pas partie de ce groupe' });
  if (prediction.type === 'exact_value') {
    if (!Number.isFinite(Number(req.body.value))) return res.status(400).json({ error: 'La valeur doit être un nombre' });
  } else if (prediction.type === 'ranking') {
    const ranking = req.body.ranking || [];
    if (ranking.length !== prediction.options.length || new Set(ranking).size !== ranking.length || ranking.some(id => !prediction.options.some(option => option.id === id))) return res.status(400).json({ error: 'Classement incomplet ou invalide' });
  } else if (!prediction.options.some(option => option.id === optionId)) return res.status(400).json({ error: 'Option invalide' });
  if ((data.wagers || []).some(wager => wager.predictionId === prediction.id && wager.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ error: 'Tu as déjà misé sur cette prédiction' });
  const groupRules = getGroupRules(data.groups.find(group => group.id === prediction.groupId));
  const maxAmount = Math.floor(membership.points * Number(groupRules.max_bet_percent_of_balance) / 100);
  if (!Number.isInteger(numericAmount) || numericAmount < Number(groupRules.min_bet) || numericAmount > maxAmount) return res.status(400).json({ error: `Mise autorisée : ${groupRules.min_bet} à ${maxAmount} points` });
  membership.points -= numericAmount;
  data.wagers = data.wagers || [];
  data.wagers.push({ id: Date.now(), predictionId: prediction.id, username, optionId, value: prediction.type === 'exact_value' ? Number(req.body.value) : undefined, ranking: prediction.type === 'ranking' ? req.body.ranking : undefined, amount: numericAmount, createdAt: new Date().toISOString() });
  writeGroupsData(data);
  res.json({ success: true });
});

app.delete('/api/predictions/:predictionId', (req, res) => {
  const data = readGroupsData();
  const prediction = (data.predictions || []).find(item => String(item.id) === String(req.params.predictionId));
  if (!prediction) return res.status(404).json({ error: 'Prédiction introuvable' });
  if (prediction.creatorUsername.toLowerCase() !== String(req.body.username).toLowerCase()) return res.status(403).json({ error: 'Seul le créateur peut supprimer cette prédiction' });
  for (const wager of (data.wagers || []).filter(item => item.predictionId === prediction.id)) {
    const membership = data.memberships.find(item => item.groupId === prediction.groupId && item.username.toLowerCase() === wager.username.toLowerCase());
    if (membership) membership.points += wager.amount;
  }
  data.predictions = data.predictions.filter(item => item.id !== prediction.id);
  data.wagers = (data.wagers || []).filter(item => item.predictionId !== prediction.id);
  writeGroupsData(data);
  res.status(204).end();
});

app.post('/api/predictions/:predictionId/settle', (req, res) => {
  const { username, optionId, value, ranking } = req.body;
  const data = readGroupsData();
  const prediction = (data.predictions || []).find(item => String(item.id) === String(req.params.predictionId));
  if (!prediction || prediction.status !== 'open') return res.status(400).json({ error: 'Cette prédiction est déjà validée' });
  if (prediction.type === 'exact_value' && !Number.isFinite(Number(value))) return res.status(400).json({ error: 'Le résultat doit être un nombre' });
  if (prediction.type === 'ranking' && (!Array.isArray(ranking) || ranking.length !== prediction.options.length || new Set(ranking).size !== ranking.length || ranking.some(id => !prediction.options.some(option => option.id === id)))) return res.status(400).json({ error: 'Classement réel invalide' });
  if (!['exact_value', 'ranking'].includes(prediction.type) && !prediction.options.some(option => option.id === optionId)) return res.status(400).json({ error: 'Résultat invalide' });
  const resultKey = prediction.type === 'exact_value' ? Number(value) : prediction.type === 'ranking' ? ranking.join(',') : optionId;
  if (prediction.pendingResult) {
    if (prediction.pendingResult.resultKey !== resultKey || prediction.pendingResult.username.toLowerCase() === username.toLowerCase()) return res.status(400).json({ error: 'La validation doit être confirmée par un autre joueur avec le même résultat' });
  } else if (prediction.creatorUsername.toLowerCase() !== username.toLowerCase()) {
    return res.status(403).json({ error: 'Seul le créateur peut proposer le résultat' });
  }
  const groupRules = getGroupRules(data.groups.find(group => group.id === prediction.groupId));
  if (!prediction.pendingResult && groupRules.settlement_requires_confirmation) {
    prediction.pendingResult = { optionId, value: prediction.type === 'exact_value' ? Number(value) : undefined, ranking: prediction.type === 'ranking' ? ranking : undefined, resultKey, username };
    writeGroupsData(data);
    return res.json({ pending: true });
  }
  const wagers = (data.wagers || []).filter(item => item.predictionId === prediction.id);
  const totalPool = wagers.reduce((sum, wager) => sum + wager.amount, 0);
  let winningWagers;
  if (prediction.type === 'exact_value') {
    const distances = wagers.map(wager => Math.abs(wager.value - Number(value)));
    const bestDistance = distances.length ? Math.min(...distances) : null;
    winningWagers = wagers.filter(wager => Math.abs(wager.value - Number(value)) === bestDistance);
  } else if (prediction.type === 'ranking') {
    const score = wager => wager.ranking.reduce((sum, optionId, index) => sum + Math.abs(index - ranking.indexOf(optionId)), 0);
    const scores = wagers.map(score);
    const bestScore = scores.length ? Math.min(...scores) : null;
    winningWagers = wagers.filter(wager => score(wager) === bestScore);
  } else {
    winningWagers = wagers.filter(wager => wager.optionId === optionId);
  }
  const winningPool = winningWagers.reduce((sum, wager) => sum + wager.amount, 0);
  for (const wager of winningWagers) {
    const membership = data.memberships.find(item => item.groupId === prediction.groupId && item.username.toLowerCase() === wager.username.toLowerCase());
    if (membership) membership.points += winningPool ? Math.floor(totalPool * wager.amount / winningPool) : wager.amount;
  }
  prediction.status = 'settled';
  prediction.resultOptionId = optionId;
  prediction.resultValue = prediction.type === 'exact_value' ? Number(value) : undefined;
  prediction.resultRanking = prediction.type === 'ranking' ? ranking : undefined;
  prediction.pendingResult = null;
  writeGroupsData(data);
  res.json({ success: true });
});

app.patch('/api/groups/:groupId/settings', (req, res) => {
  const { username, name, groupRules } = req.body;
  const data = readGroupsData();
  const group = data.groups.find(item => String(item.id) === String(req.params.groupId));
  if (!group) return res.status(404).json({ error: 'Groupe introuvable' });
  if (group.creatorUsername.toLowerCase() !== String(username).toLowerCase()) return res.status(403).json({ error: 'Seul l’administrateur peut modifier le groupe' });
  if (name && name.trim().length >= 3) group.name = name.trim();
  if (groupRules) group.rules = { ...getGroupRules(group), ...groupRules };
  writeGroupsData(data);
  res.json({ success: true, group: { ...group, rules: getGroupRules(group) } });
});

app.delete('/api/groups/membership/:username', (req, res) => {
  const data = readGroupsData();
  const username = req.params.username;
  const membership = data.memberships.find(item => item.username.toLowerCase() === username.toLowerCase());
  if (!membership) return res.status(404).json({ error: 'Adhésion introuvable' });
  const group = data.groups.find(item => item.id === membership.groupId);
  const nextAdmin = req.body?.nextAdminUsername;
  if (group?.creatorUsername.toLowerCase() === username.toLowerCase()) {
    const successor = data.memberships.find(item => item.groupId === group.id && item.username.toLowerCase() === String(nextAdmin || '').toLowerCase() && item.username.toLowerCase() !== username.toLowerCase());
    if (!successor) return res.status(400).json({ error: 'L’administrateur doit choisir un membre pour transférer ses droits' });
    group.creatorUsername = successor.username;
  }
  data.memberships = data.memberships.filter(item => item.username.toLowerCase() !== username.toLowerCase());
  writeGroupsData(data);
  res.status(204).end();
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
