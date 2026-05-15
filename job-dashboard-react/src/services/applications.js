const BASE = '/api/applications';

async function req(method, path, getToken, body) {
  const token = await getToken();
  const opts  = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res  = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status });
  return data;
}

function qs(params = {}) {
  const s = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString();
  return s ? `?${s}` : '';
}

export const listApplications  = (getToken, params = {})         => req('GET',    qs(params),                   getToken);
export const createApplication = (getToken, data)                 => req('POST',   '',                           getToken, data);
export const getApplication    = (getToken, id)                   => req('GET',    `/${id}`,                     getToken);
export const updateApplication = (getToken, id, data)             => req('PATCH',  `/${id}`,                     getToken, data);
export const deleteApplication = (getToken, id)                   => req('DELETE', `/${id}`,                     getToken);
export const updateStatus      = (getToken, id, status, note)     => req('PATCH',  `/${id}/status`,              getToken, { status, note });
export const addNote           = (getToken, id, note)             => req('PATCH',  `/${id}/note`,                getToken, { note });
export const getTimeline       = (getToken, id)                   => req('GET',    `/${id}/timeline`,            getToken);
export const addInterview      = (getToken, id, data)             => req('POST',   `/${id}/interviews`,          getToken, data);
export const updateInterview   = (getToken, id, iid, data)        => req('PATCH',  `/${id}/interviews/${iid}`,   getToken, data);
export const getAnalytics           = (getToken)                       => req('GET',  '/analytics',      getToken);
export const generateInsights       = (getToken, id)                   => req('POST', `/${id}/insights`, getToken);

/**
 * getApplicationHistory(getToken, params?)
 * Returns paginated apply-click history + per-platform stats.
 * GET /api/applications/history
 */
export const getApplicationHistory = (getToken, params = {}) => req('GET', `/history${qs(params)}`, getToken);
