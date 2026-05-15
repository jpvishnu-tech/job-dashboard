const API = '/api/stripe';

async function authHeaders(getToken) {
  const token = await getToken();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function request(method, path, getToken, body) {
  const headers = await authHeaders(getToken);
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.message ?? 'Request failed'), { code: data.code, status: res.status });
  return data;
}

/** Returns the public plan list — no auth required. */
export async function getPlans() {
  const res = await fetch(`${API}/plans`);
  if (!res.ok) throw new Error('Failed to fetch plans');
  return (await res.json()).plans;
}

/** Returns the current user's subscription status and plan features. */
export async function getSubscription(getToken) {
  return request('GET', `${API}/subscription`, getToken);
}

/** Returns the last 20 payment records. */
export async function getPaymentHistory(getToken) {
  return request('GET', `${API}/payments`, getToken);
}

/**
 * createCheckoutSession(getToken, planId)
 * Returns { url } — redirect the user there to complete payment.
 */
export async function createCheckoutSession(getToken, planId) {
  return request('POST', `${API}/checkout`, getToken, { planId });
}

/**
 * createBillingPortal(getToken)
 * Returns { url } — redirect the user there to manage subscription.
 */
export async function createBillingPortal(getToken) {
  return request('POST', `${API}/billing-portal`, getToken);
}
