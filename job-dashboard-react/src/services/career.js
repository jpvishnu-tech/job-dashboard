const BASE = '/api/career';

async function req(method, path, getToken, body) {
  const token = await getToken();
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `${method} ${path} failed (${res.status})`);
  return data;
}

function qs(p = {}) {
  const s = Object.entries(p).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return s ? `?${s}` : '';
}

// ── Roadmap ───────────────────────────────────────────────────────────────
export const getRoadmap      = (getToken)       => req('GET',   `${BASE}/roadmap`,           getToken);
export const generateRoadmap = (getToken, data) => req('POST',  `${BASE}/roadmap`,           getToken, data);
export const updateProgress  = (getToken, data) => req('PATCH', `${BASE}/roadmap/progress`,  getToken, data);

// ── Skills Gap ────────────────────────────────────────────────────────────
export const getSkillsGap    = (getToken, role) => req('GET',   `${BASE}/skills-gap${qs({ role })}`, getToken);
export const refreshSkillsGap= (getToken, data) => req('POST',  `${BASE}/skills-gap`,         getToken, data);

// ── Salary ────────────────────────────────────────────────────────────────
export const getSalary = (getToken, params) => req('GET', `${BASE}/salary-insights${qs(params)}`, getToken);

// ── Interview Prep ────────────────────────────────────────────────────────
export const createInterviewSession = (getToken, data) => req('POST',  `${BASE}/interview-prep`,           getToken, data);
export const getInterviewHistory    = (getToken)       => req('GET',   `${BASE}/interview-prep/history`,   getToken);
export const getInterviewSession    = (getToken, id)   => req('GET',   `${BASE}/interview-prep/${id}`,     getToken);
export const submitAnswer           = (getToken, id, data) => req('PATCH', `${BASE}/interview-prep/${id}/answer`, getToken, data);
