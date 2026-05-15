const API_BASE = '/api/ai';

async function get(path, getToken) {
  const token = await getToken();
  const res   = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(
      new Error(data.message || 'Request failed. Please try again.'),
      { status: res.status, code: data.code },
    );
  }
  return data;
}

async function post(path, getToken, body = {}) {
  const token = await getToken();
  const res   = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(
      new Error(data.message || 'Request failed. Please try again.'),
      { status: res.status, code: data.code },
    );
  }
  return data;
}

export async function analyzeResumeProfile(getToken) {
  return post('/analyze-resume', getToken);
}

export async function getJobMatches(getToken) {
  return get('/job-matches', getToken);
}

export async function getRecommendedJobs(getToken) {
  return get('/recommended-jobs', getToken);
}
