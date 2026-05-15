/**
 * resumeOptimizer.js — Frontend API service
 * Wraps all /api/resume optimizer calls.
 */

const BASE = '/api/resume';

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

/** GET /api/resume/ats-score — quick last-stored score, no AI call */
export const getAtsScore = (getToken) =>
  req('GET', '/ats-score', getToken);

/** POST /api/resume/analyze — enhanced ATS + keyword analysis */
export const analyzeResume = (getToken, resumeText) =>
  req('POST', '/analyze', getToken, resumeText ? { resumeText } : {});

/** POST /api/resume/optimize — job-specific optimization plan */
export const optimizeResume = (getToken, jobDescription, resumeText) =>
  req('POST', '/optimize', getToken, { jobDescription, ...(resumeText ? { resumeText } : {}) });

/** POST /api/resume/rewrite — AI section rewriter */
export const rewriteSection = (getToken, section, content, resumeText) =>
  req('POST', '/rewrite', getToken, { section, content, ...(resumeText ? { resumeText } : {}) });

/** GET /api/resume/history — paginated analysis history */
export const getHistory = (getToken, page = 1, limit = 10) =>
  req('GET', `/history?page=${page}&limit=${limit}`, getToken);

/** POST /api/resume/tailor — generate AI-tailored resume for a specific job */
export const tailorResume = (getToken, jobDescription, jobTitle = '', jobCompany = '', jobId = null) =>
  req('POST', '/tailor', getToken, {
    jobDescription,
    ...(jobTitle   ? { jobTitle }   : {}),
    ...(jobCompany ? { jobCompany } : {}),
    ...(jobId      ? { jobId }      : {}),
  });

/** GET /api/resume/tailored-versions — list saved tailored versions */
export const getTailoredVersions = (getToken, page = 1, limit = 12) =>
  req('GET', `/tailored-versions?page=${page}&limit=${limit}`, getToken);

/** GET /api/resume/tailored-versions/:id — full detail of one version */
export const getTailoredVersion = (getToken, id) =>
  req('GET', `/tailored-versions/${id}`, getToken);

/** DELETE /api/resume/tailored-versions/:id — delete a version */
export const deleteTailoredVersion = (getToken, id) =>
  req('DELETE', `/tailored-versions/${id}`, getToken);
