/**
 * recruiter.js — Frontend API service for the Recruiter Portal.
 * All calls use the Firebase ID token for authentication.
 */

const BASE = '/api/recruiter';

async function authHeaders(getToken) {
  const token = await getToken();
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function request(method, path, getToken, body) {
  const headers = await authHeaders(getToken);
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

// ── Company ───────────────────────────────────────────────────────────────

export const getCompany        = (gt)         => request('GET',   '/company', gt);
export const createCompany     = (gt, fields)  => request('POST',  '/company', gt, fields);
export const updateCompany     = (gt, fields)  => request('PATCH', '/company', gt, fields);

// ── Jobs ──────────────────────────────────────────────────────────────────

export const listJobs    = (gt, params = {}) => request('GET', `/jobs?${new URLSearchParams(params)}`, gt);
export const createJob   = (gt, fields)      => request('POST',   '/jobs', gt, fields);
export const getJob      = (gt, id)          => request('GET',    `/jobs/${id}`, gt);
export const updateJob   = (gt, id, fields)  => request('PATCH',  `/jobs/${id}`, gt, fields);
export const setJobStatus= (gt, id, isActive)=> request('PATCH',  `/jobs/${id}/status`, gt, { isActive });
export const deleteJob   = (gt, id)          => request('DELETE', `/jobs/${id}`, gt);

// ── Applicants ────────────────────────────────────────────────────────────

export const listApplicants     = (gt, jobId, params = {}) =>
  request('GET', `/jobs/${jobId}/applicants?${new URLSearchParams(params)}`, gt);

export const getApplicantDetail = (gt, appId) =>
  request('GET', `/applicants/${appId}`, gt);

export const updateApplicantStatus = (gt, appId, status, note = '') =>
  request('PATCH', `/applicants/${appId}/status`, gt, { status, note });

// ── Interviews ────────────────────────────────────────────────────────────

export const listInterviews    = (gt, params = {}) =>
  request('GET', `/interviews?${new URLSearchParams(params)}`, gt);

export const scheduleInterview = (gt, fields)     => request('POST',   '/interviews', gt, fields);
export const getInterview      = (gt, id)         => request('GET',    `/interviews/${id}`, gt);
export const updateInterview   = (gt, id, fields) => request('PATCH',  `/interviews/${id}`, gt, fields);
export const cancelInterview   = (gt, id)         => request('DELETE', `/interviews/${id}`, gt);

// ── Analytics ─────────────────────────────────────────────────────────────

export const getAnalytics = (gt) => request('GET', '/analytics', gt);
