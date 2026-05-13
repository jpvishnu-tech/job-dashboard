/**
 * api.js — Central fetch client
 * ─────────────────────────────────────────────────────────────
 * All backend requests go through this module so that:
 *   • Authorization headers are injected automatically
 *   • JSON bodies are serialised consistently
 *   • Non-2xx responses throw a typed ApiError with status + field errors
 *   • Token storage is centralised (localStorage key 'jdToken')
 *
 * In development Vite proxies /api → http://localhost:5000 (vite.config.js).
 * In production set VITE_API_URL to the backend's public URL.
 */

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
    this.errors = errors; // array of { field, message } from express-validator
  }
}

// ── Token storage ─────────────────────────────────────────────
const TOKEN_KEY = 'jdToken';

export function getToken()        { return localStorage.getItem(TOKEN_KEY); }
export function setToken(token)   {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else       localStorage.removeItem(TOKEN_KEY);
}

// ── Core request ──────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request(endpoint, { body, ...rest } = {}) {
  const token = getToken();

  const res = await fetch(`${BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body:    body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  // 204 No Content — nothing to parse
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    throw new ApiError(
      data.message || `HTTP ${res.status}`,
      res.status,
      data.errors ?? []
    );
  }

  return data;
}

// ── Convenience methods ───────────────────────────────────────
export const api = {
  get:    (url, opts)       => request(url, { method: 'GET', ...opts }),
  post:   (url, body, opts) => request(url, { method: 'POST',   body, ...opts }),
  put:    (url, body, opts) => request(url, { method: 'PUT',    body, ...opts }),
  delete: (url, opts)       => request(url, { method: 'DELETE', ...opts }),
};
