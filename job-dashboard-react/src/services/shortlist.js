const API_BASE = '/api/ai';

async function authGet(path, getToken, params = {}) {
  const token = await getToken();
  const qs    = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString();
  const res  = await fetch(`${API_BASE}${path}${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status, code: data.code });
  return data;
}

/** Returns cached shortlist docs from MongoDB (fast, no AI). */
export async function getShortlistedJobs(getToken, filters = {}) {
  return authGet('/shortlisted-jobs', getToken, filters);
}

/**
 * Runs the full AI pipeline (profile → matching → scoring → reasons).
 * Pass refresh=true to bypass the 24h cache.
 */
export async function getRecommendations(getToken, { refresh = false } = {}) {
  return authGet('/recommendations', getToken, refresh ? { refresh: 'true' } : {});
}

/** Returns top apply_now + strong_fit jobs for the Dashboard widget. */
export async function getPriorityJobs(getToken, limit = 5) {
  return authGet('/priority-jobs', getToken, { limit });
}

/** Returns aggregated recommendation analytics. */
export async function getRecommendationAnalytics(getToken) {
  return authGet('/recommendation-analytics', getToken);
}
