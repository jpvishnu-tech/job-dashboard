/**
 * autoApply.js — Smart Auto-Apply Assistant frontend service
 * Wraps all /api/applications auto-apply calls.
 */

const BASE = '/api/applications';

async function req(method, path, getToken, body) {
  const token = await getToken();
  const opts = {
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

/** GET /api/applications/queue — smart apply queue */
export const getApplyQueue = (getToken, params = {}) =>
  req('GET', `/queue${qs(params)}`, getToken);

/** POST /api/applications/prepare — prepare application (AI match + cover letter) */
export const prepareApplication = (getToken, jobId, tone = 'professional') =>
  req('POST', '/prepare', getToken, { jobId, tone });

/** POST /api/applications/generate-cover-letter — generate/regenerate cover letter */
export const generateCoverLetter = (getToken, jobId, tone = 'professional', draftId, focusAreas) =>
  req('POST', '/generate-cover-letter', getToken, { jobId, tone, draftId, focusAreas });

/** GET /api/applications/drafts — list all drafts */
export const getDrafts = (getToken, status) =>
  req('GET', `/drafts${status ? `?status=${status}` : ''}`, getToken);

/** PATCH /api/applications/drafts/:id — update draft notes/checklist */
export const updateDraft = (getToken, id, updates) =>
  req('PATCH', `/drafts/${id}`, getToken, updates);

/** POST /api/applications/drafts/:id/submit — submit draft */
export const submitDraft = (getToken, id) =>
  req('POST', `/drafts/${id}/submit`, getToken, {});

/** DELETE /api/applications/drafts/:id — delete draft */
export const deleteDraft = (getToken, id) =>
  req('DELETE', `/drafts/${id}`, getToken);

/** GET /api/jobs/recommended — personalized job recommendations */
export const getRecommendedJobs = async (getToken) => {
  const token = await getToken();
  const res   = await fetch('/api/jobs/recommended', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};
