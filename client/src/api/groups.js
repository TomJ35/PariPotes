const API_BASE = '/api/groups';

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || 'Une erreur est survenue');
  return data;
}

export const groupsAPI = {
  getUserGroup(username) {
    return request(`${API_BASE}/user/${encodeURIComponent(username)}`);
  },
  getGroupMembers(groupId) {
    return request(`${API_BASE}/${groupId}/members`);
  },
  createGroup(name, creatorUsername) {
    return request(API_BASE, { method: 'POST', body: JSON.stringify({ name, creatorUsername }) });
  },
  joinGroup(inviteCode, username) {
    return request(`${API_BASE}/join`, { method: 'POST', body: JSON.stringify({ inviteCode, username }) });
  },
  leaveGroup(username, nextAdminUsername) {
    return request(`${API_BASE}/membership/${encodeURIComponent(username)}`, { method: 'DELETE', body: JSON.stringify({ nextAdminUsername }) });
  },
  updateGroupSettings(groupId, username, name, groupRules) {
    return request(`${API_BASE}/${groupId}/settings`, { method: 'PATCH', body: JSON.stringify({ username, name, groupRules }) });
  },
  deleteGroup(groupId, username) {
    return request(`${API_BASE}/${groupId}`, { method: 'DELETE', body: JSON.stringify({ username }) });
  },
  getPredictions(groupId) {
    return request(`${API_BASE}/${groupId}/predictions`);
  },
  createPrediction(prediction) {
    return request('/api/predictions', { method: 'POST', body: JSON.stringify(prediction) });
  },
  placeWager(predictionId, wager) {
    return request(`/api/predictions/${predictionId}/wagers`, { method: 'POST', body: JSON.stringify(wager) });
  },
  deletePrediction(predictionId, username) {
    return request(`/api/predictions/${predictionId}`, { method: 'DELETE', body: JSON.stringify({ username }) });
  },
  settlePrediction(predictionId, result) {
    return request(`/api/predictions/${predictionId}/settle`, { method: 'POST', body: JSON.stringify(result) });
  },
};
