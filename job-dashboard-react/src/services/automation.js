const BASE = '/api/automation';

async function req(method, path, getToken, body) {
  const token = await getToken();
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `${method} ${path} failed (${res.status})`);
  return data;
}

function qs(params = {}) {
  const s = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return s ? `?${s}` : '';
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export const getDashboard = (getToken) =>
  req('GET', `${BASE}/dashboard`, getToken);

// ── Tasks ─────────────────────────────────────────────────────────────────
export const listTasks = (getToken, params) =>
  req('GET', `${BASE}/tasks${qs(params)}`, getToken);

export const createTask = (getToken, data) =>
  req('POST', `${BASE}/tasks`, getToken, data);

export const updateTask = (getToken, id, data) =>
  req('PATCH', `${BASE}/tasks/${id}`, getToken, data);

export const deleteTask = (getToken, id) =>
  req('DELETE', `${BASE}/tasks/${id}`, getToken);

export const generateTasks = (getToken) =>
  req('POST', `${BASE}/tasks/generate`, getToken);

// ── Reminders ─────────────────────────────────────────────────────────────
export const listReminders = (getToken, params) =>
  req('GET', `${BASE}/reminders${qs(params)}`, getToken);

export const createReminder = (getToken, data) =>
  req('POST', `${BASE}/reminders`, getToken, data);

export const updateReminder = (getToken, id, data) =>
  req('PATCH', `${BASE}/reminders/${id}`, getToken, data);

export const deleteReminder = (getToken, id) =>
  req('DELETE', `${BASE}/reminders/${id}`, getToken);

// ── AI ────────────────────────────────────────────────────────────────────
export const getRecommendations = (getToken) =>
  req('GET', `${BASE}/recommendations`, getToken);

export const generateCoverLetter = (getToken, data) =>
  req('POST', `${BASE}/cover-letter`, getToken, data);
