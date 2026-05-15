/**
 * AI analysis service — calls the Express backend.
 *
 * Both functions accept a `getToken` async callback that returns the caller's
 * Firebase ID token (or Express JWT). The token is sent as a Bearer header so
 * the OPENAI_API_KEY never leaves the server.
 *
 *   const token = await user.getIdToken();
 *   const result = await analyzeResume(() => user.getIdToken());
 */

const API_BASE = '/api/ai';

async function post(path, getToken, body) {
  const token = await getToken();
  const res   = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = Object.assign(
      new Error(data.message || data.error || 'Request failed. Please try again.'),
      { status: res.status, code: data.code }
    );
    throw err;
  }
  return data.data;
}

/**
 * analyzeResume(getToken)
 * Triggers ATS analysis of the resume the user has on file in the backend.
 * Returns the analysis result object.
 */
export async function analyzeResume(getToken) {
  return post('/analyze', getToken, {});
}

/**
 * matchJob(getToken, jobDescription)
 * Compares the user's resume against the supplied job description.
 * Returns the match result object.
 */
export async function matchJob(getToken, jobDescription) {
  return post('/match', getToken, { jobDescription });
}
