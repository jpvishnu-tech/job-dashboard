/**
 * api.js — Typed error class + minimal fetch helper
 * ─────────────────────────────────────────────────────────────
 * Authentication is handled directly by the Supabase client (see AuthContext).
 *
 * ApiError is used throughout the app (LoginPage, ResetPasswordPage, AuthContext)
 * to carry HTTP status codes alongside error messages so the UI can branch on
 * specific codes (e.g. 202 = email confirmation pending).
 *
 * The api.get/post/put/delete helpers are kept for the admin pages that still
 * call backend routes when a server is present.  Without a backend those calls
 * fail gracefully — admin pages show their empty/error states rather than crash.
 */

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.errors = errors; // field-level validation errors from express-validator
  }
}

// ── Core request ──────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request(endpoint, { body, ...rest } = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    body:    body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      data.message || `HTTP ${res.status}`,
      res.status,
      data.errors ?? [],
    );
  }

  return data;
}

// ── Convenience methods ───────────────────────────────────────
export const api = {
  get:    (url, opts)       => request(url, { method: 'GET',    ...opts }),
  post:   (url, body, opts) => request(url, { method: 'POST',   body, ...opts }),
  put:    (url, body, opts) => request(url, { method: 'PUT',    body, ...opts }),
  delete: (url, opts)       => request(url, { method: 'DELETE', ...opts }),
};
