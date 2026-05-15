/**
 * workflow.js — Frontend API service
 * Wraps all /api/workflow calls into clean async functions.
 */

const BASE = '/api/workflow';

async function req(path, options = {}) {
  const res  = await fetch(`${BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

async function authHeaders(getToken) {
  const token = await getToken();
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ── Workspaces ────────────────────────────────────────────────────────────

export async function createWorkspace(getToken, applicationId) {
  const headers = await authHeaders(getToken);
  return req('/workspaces', { method: 'POST', headers, body: JSON.stringify({ applicationId }) });
}

export async function listWorkspaces(getToken, { state, archived, page, limit } = {}) {
  const headers = await authHeaders(getToken);
  const qs = new URLSearchParams();
  if (state)   qs.set('state',    state);
  if (archived !== undefined) qs.set('archived', archived);
  if (page)    qs.set('page',     page);
  if (limit)   qs.set('limit',    limit);
  return req(`/workspaces?${qs}`, { headers });
}

export async function getWorkspace(getToken, id) {
  const headers = await authHeaders(getToken);
  return req(`/workspaces/${id}`, { headers });
}

export async function updateWorkspace(getToken, id, data) {
  const headers = await authHeaders(getToken);
  return req(`/workspaces/${id}`, { method: 'PATCH', headers, body: JSON.stringify(data) });
}

// ── Workflow State ────────────────────────────────────────────────────────

export async function updateStatus(getToken, workspaceId, state) {
  const headers = await authHeaders(getToken);
  return req(`/status/${workspaceId}`, { method: 'PATCH', headers, body: JSON.stringify({ state }) });
}

// ── AI Preparation ────────────────────────────────────────────────────────

export async function prepareApplication(getToken, workspaceId, { tone, focusAreas } = {}) {
  const headers = await authHeaders(getToken);
  return req(`/prepare/${workspaceId}`, { method: 'POST', headers, body: JSON.stringify({ tone, focusAreas }) });
}

export async function regenerateCoverLetter(getToken, workspaceId, { tone, focusAreas } = {}) {
  const headers = await authHeaders(getToken);
  return req(`/cover-letter/${workspaceId}`, { method: 'POST', headers, body: JSON.stringify({ tone, focusAreas }) });
}

export async function toggleChecklistItem(getToken, workspaceId, itemId, done) {
  const headers = await authHeaders(getToken);
  return req(`/checklist/${workspaceId}/item/${itemId}`, {
    method: 'PATCH', headers, body: JSON.stringify({ done }),
  });
}

// ── Smart Queue ───────────────────────────────────────────────────────────

export async function getQueue(getToken) {
  const headers = await authHeaders(getToken);
  return req('/queue', { headers });
}

export async function getNextActions(getToken, workspaceId) {
  const headers = await authHeaders(getToken);
  return req(`/next-actions/${workspaceId}`, { headers });
}

// ── Workflow History ──────────────────────────────────────────────────────

export async function getHistory(getToken, id) {
  const headers = await authHeaders(getToken);
  return req(`/history/${id}`, { headers });
}

export async function getAllHistory(getToken) {
  const headers = await authHeaders(getToken);
  return req('/history', { headers });
}

// ── Recruiter Contacts ────────────────────────────────────────────────────

export async function listContacts(getToken, params = {}) {
  const headers = await authHeaders(getToken);
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v != null)));
  return req(`/contacts?${qs}`, { headers });
}

export async function createContact(getToken, data) {
  const headers = await authHeaders(getToken);
  return req('/contacts', { method: 'POST', headers, body: JSON.stringify(data) });
}

export async function getContact(getToken, id) {
  const headers = await authHeaders(getToken);
  return req(`/contacts/${id}`, { headers });
}

export async function updateContact(getToken, id, data) {
  const headers = await authHeaders(getToken);
  return req(`/contacts/${id}`, { method: 'PATCH', headers, body: JSON.stringify(data) });
}

export async function deleteContact(getToken, id) {
  const headers = await authHeaders(getToken);
  return req(`/contacts/${id}`, { method: 'DELETE', headers });
}

export async function addCommLog(getToken, contactId, logData) {
  const headers = await authHeaders(getToken);
  return req(`/contacts/${contactId}/comm`, { method: 'POST', headers, body: JSON.stringify(logData) });
}

export async function deleteCommLog(getToken, contactId, logId) {
  const headers = await authHeaders(getToken);
  return req(`/contacts/${contactId}/comm/${logId}`, { method: 'DELETE', headers });
}

export async function addFollowUp(getToken, contactId, data) {
  const headers = await authHeaders(getToken);
  return req(`/contacts/${contactId}/followup`, { method: 'POST', headers, body: JSON.stringify(data) });
}

export async function completeFollowUp(getToken, contactId, fuId) {
  const headers = await authHeaders(getToken);
  return req(`/contacts/${contactId}/followup/${fuId}/complete`, { method: 'PATCH', headers });
}

export async function getUpcomingFollowUps(getToken) {
  const headers = await authHeaders(getToken);
  return req('/contacts/followups/upcoming', { headers });
}

export async function linkApplication(getToken, contactId, applicationId) {
  const headers = await authHeaders(getToken);
  return req(`/contacts/${contactId}/link`, { method: 'POST', headers, body: JSON.stringify({ applicationId }) });
}
