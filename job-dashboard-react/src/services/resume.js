/**
 * resume.js
 * ─────────────────────────────────────────────────────────────
 * File upload  → Supabase Storage  (resumes bucket)
 * Metadata I/O → MongoDB backend   (GET/POST/DELETE /api/resume)
 *
 * All mutating calls require a `getToken` async function that
 * returns a fresh Firebase ID token for the Authorization header.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET  = 'resumes';
const API_BASE = '/api/resume';

// ── Helpers ──────────────────────────────────────────────────

function buildStoragePath(uid, fileName) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${uid}/${Date.now()}-${safe}`;
}

async function apiRequest(method, path, getToken, body) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// ── Public API ────────────────────────────────────────────────

/**
 * uploadResume(uid, file, getToken)
 *
 * 1. Uploads PDF to Supabase Storage at resumes/{uid}/{timestamp}-{name}
 * 2. Saves metadata to MongoDB via POST /api/resume
 * Returns the public URL of the uploaded file.
 */
export async function uploadResume(uid, file, getToken) {
  if (!isSupabaseConfigured) {
    console.error('[Resume] Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
    throw new Error('Storage is not configured. Please contact support.');
  }

  const storagePath = buildStoragePath(uid, file.name);
  console.log('[Resume] Upload start —', storagePath, `(${(file.size / 1024).toFixed(1)} KB)`);

  const { data: sessionData } = await supabase.auth.getSession();
  console.log('[Resume] Supabase session present:', !!sessionData?.session);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    console.error('[Resume] Upload error —', error.message, error);
    throw new Error(error.message);
  }

  console.log('[Resume] Upload success —', data);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;
  console.log('[Resume] Public URL —', publicUrl);

  // Persist metadata to MongoDB so all AI features can read it
  await apiRequest('POST', '', getToken, {
    url:         publicUrl,
    fileName:    file.name,
    fileSize:    file.size,
    storagePath: storagePath,
    mimeType:    'application/pdf',
  });

  return publicUrl;
}

/**
 * getResumeData(getToken)
 * Fetches the current user's resume metadata from MongoDB.
 * Returns null if no resume has been uploaded yet.
 */
export async function getResumeData(getToken) {
  try {
    const { resume } = await apiRequest('GET', '', getToken);
    return resume ?? null;
  } catch (err) {
    // 404 = no resume yet
    if (err.message?.includes('404') || err.message?.includes('not found')) return null;
    throw err;
  }
}

/**
 * deleteResume(getToken)
 * Removes the resume record from MongoDB.
 * (Supabase Storage file stays unless you add a backend cleanup step.)
 */
export async function deleteResume(getToken) {
  await apiRequest('DELETE', '', getToken);
}
