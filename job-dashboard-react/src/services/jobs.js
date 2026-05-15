/**
 * jobs.js — Frontend API service
 * Wraps all /api/jobs backend calls into clean async functions.
 */

const API_BASE = '/api/jobs';

function toQueryString(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === '' || v === null || v === undefined) return;
    if (k === 'remote' && v === false) return; // omit false — default is "all"
    qs.set(k, String(v));
  });
  return qs.toString();
}

async function request(path, options = {}) {
  const res  = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

/**
 * listJobs(filters)
 * Returns { data: Job[], pagination: { total, page, limit, totalPages, hasNext, hasPrev } }
 */
export async function listJobs(filters = {}) {
  const qs  = toQueryString(filters);
  return request(`?${qs}`);
}

/**
 * getJob(id)
 * Returns the full Job document.
 */
export async function getJob(id) {
  return request(`/${id}`);
}

/**
 * getRecommendedJobs(getToken?)
 * Returns personalised (AI) or featured jobs depending on auth state.
 */
export async function getRecommendedJobs(getToken) {
  const headers = {};
  if (getToken) {
    try {
      const token = await getToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch { /* proceed unauthenticated */ }
  }
  return request('/recommended', { headers });
}

/**
 * applyClick(jobId, getToken)
 * Records an external apply-button click for the authenticated user.
 * Called AFTER window.open() so the URL opens even if this request fails.
 * Returns { data: { application, applyUrl, clickCount, platform } }
 */
export async function applyClick(jobId, getToken) {
  const token = await getToken();
  return request(`/${jobId}/apply-click`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * getJobsBySource(platform, filters)
 * Returns paginated jobs from a specific provider/source.
 */
export async function getJobsBySource(platform, filters = {}) {
  const qs = toQueryString(filters);
  return request(`/source/${encodeURIComponent(platform)}${qs ? `?${qs}` : ''}`);
}

/**
 * syncJobs(getToken, provider?)
 * Admin: triggers a manual provider sync.
 * Pass provider name to sync one provider, or omit to sync all.
 */
export async function syncJobs(getToken, provider) {
  const token = await getToken();
  return request('/sync', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(provider ? { provider } : {}),
  });
}

/**
 * getProviders(getToken)
 * Admin: returns enabled/disabled status of all registered providers.
 */
export async function getProviders(getToken) {
  const token = await getToken();
  return request('/providers', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
}
