import { getApp, initializeApp }      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp,
}                                      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig }              from './firebase-config.js';

// ── Supabase Storage (replaces Firebase Storage) ──────────────────────────────
// File uploads go to Supabase; Firestore only stores the metadata + public URL.

const SUPABASE_URL      = 'https://wunfbgqfulojopwhhhmb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jWiiIf4rB2I5-hLP_lmZwQ_VH2dy1dI';
const SUPABASE_BUCKET   = 'resumes';

// ── Constants ─────────────────────────────────────────────────────────────────

const PLACEHOLDER = firebaseConfig.apiKey === 'YOUR_API_KEY';
const MAX_BYTES   = 10 * 1024 * 1024; // 10 MB

// ── DOM refs ──────────────────────────────────────────────────────────────────

const dropzone      = document.getElementById('resumeDropzone');
const fileInput     = document.getElementById('resumeFileInput');
const dropzoneErr   = document.getElementById('resumeDropzoneError');
const progressEl    = document.getElementById('resumeProgress');
const progressFill  = document.getElementById('resumeProgressFill');
const progressPct   = document.getElementById('resumeProgressPct');
const progressName  = document.getElementById('resumeProgressName');
const metaEl        = document.getElementById('resumeMeta');
const metaName      = document.getElementById('resumeMetaName');
const metaInfo      = document.getElementById('resumeMetaInfo');
const removeBtn     = document.getElementById('resumeRemoveBtn');
const replaceInput  = document.getElementById('resumeReplaceInput');
const previewEl     = document.getElementById('resumePreview');
const frameEl       = document.getElementById('resumeFrame');
const downloadLink  = document.getElementById('resumeDownloadLink');

// ── Module state ──────────────────────────────────────────────────────────────

let currentUser      = null;
let currentObjectUrl = null;
let db;

// ── Firebase init (auth + firestore only — no Firebase Storage) ───────────────

if (!PLACEHOLDER) {
  let app;
  try   { app = getApp(); }
  catch { app = initializeApp(firebaseConfig); }

  db = getFirestore(app);

  const auth = getAuth(app);
  onAuthStateChanged(auth, user => {
    currentUser = user;
    if (user) loadSavedResume(user.uid);
  });
}

// ── Supabase Storage helpers ──────────────────────────────────────────────────

/**
 * Upload a file to Supabase Storage using the REST API directly.
 * No SDK required — works in any browser ES module context.
 *
 * NOTE: Your Supabase bucket must allow uploads from the anon key.
 *   Supabase Dashboard → Storage → resumes bucket → Policies
 *   Add an INSERT policy:  (auth.role() = 'anon')  OR  true
 */
async function supabaseUpload(uid, file) {
  const path = `${uid}/resume.pdf`;
  const res  = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${path}`,
    {
      method:  'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/pdf',
        'x-upsert':     'true',
      },
      body: file,
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Upload failed (HTTP ${res.status})`);
  }

  // Return the public URL — bucket must be set to public in Supabase dashboard.
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
}

/**
 * Delete the user's resume file from Supabase Storage.
 */
async function supabaseDelete(uid) {
  const path = `${uid}/resume.pdf`;
  await fetch(
    `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${path}`,
    {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    },
  ).catch(() => {}); // ignore — file may not exist yet
}

// ── State helpers ─────────────────────────────────────────────────────────────

function showDropzone() {
  dropzone.hidden    = false;
  progressEl.hidden  = true;
  metaEl.hidden      = true;
  previewEl.hidden   = true;
  dropzoneErr.hidden = true;
}

function showProgress(fileName) {
  dropzone.hidden    = true;
  progressEl.hidden  = false;
  metaEl.hidden      = true;
  previewEl.hidden   = true;
  progressName.textContent = fileName;
  progressFill.style.width = '0%';
  progressPct.textContent  = '0%';
}

function setProgress(pct) {
  const p = Math.min(100, Math.round(pct));
  progressFill.style.width = p + '%';
  progressPct.textContent  = p + '%';
}

function showFileInfo(fileName, fileSize, uploadedAt) {
  metaEl.hidden    = false;
  previewEl.hidden = false;
  metaName.textContent = fileName;
  const date = uploadedAt
    ? (uploadedAt.toDate ? uploadedAt.toDate() : new Date(uploadedAt))
    : new Date();
  metaInfo.textContent = formatBytes(fileSize) + ' · Uploaded ' + date.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function setPreviewSrc(src, fileName) {
  frameEl.src           = src;
  downloadLink.href     = src;
  downloadLink.download = fileName;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function revokeObjectUrl() {
  if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = null; }
}

function showError(msg) {
  dropzoneErr.textContent = msg;
  dropzoneErr.hidden      = false;
}

// ── Load existing resume from Firestore ───────────────────────────────────────

async function loadSavedResume(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'resume', 'current'));
    if (!snap.exists()) return;

    const data = snap.data();
    dropzone.hidden = true;
    showFileInfo(data.fileName, data.fileSize, data.uploadedAt);
    setPreviewSrc(data.storageUrl, data.fileName);
  } catch (err) {
    console.warn('[Resume] Load failed:', err.message);
  }
}

// ── File validation ───────────────────────────────────────────────────────────

function validateFile(file) {
  if (!file) return 'No file selected.';
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf)           return 'Only PDF files are accepted.';
  if (file.size > MAX_BYTES) return `File too large — maximum is 10 MB (yours is ${formatBytes(file.size)}).`;
  return null;
}

// ── Handle a selected / dropped file ─────────────────────────────────────────

async function handleFile(file) {
  dropzoneErr.hidden = true;

  const err = validateFile(file);
  if (err) {
    showDropzone();
    showError(err);
    return;
  }

  // Placeholder mode — local preview only, no persistence
  if (PLACEHOLDER) {
    revokeObjectUrl();
    currentObjectUrl = URL.createObjectURL(file);
    dropzone.hidden  = true;
    showFileInfo(file.name, file.size, new Date());
    setPreviewSrc(currentObjectUrl, file.name);
    return;
  }

  const uid = currentUser?.uid;
  if (!uid) { showError('Not signed in — please refresh and sign in again.'); return; }

  showProgress(file.name);
  revokeObjectUrl();

  try {
    // Step 1 — upload to Supabase Storage (show 10 → 80% while in-flight)
    setProgress(10);
    console.log('[Resume] Uploading to Supabase Storage…');
    const storageUrl = await supabaseUpload(uid, file);
    setProgress(80);
    console.log('[Resume] Upload success —', storageUrl);

    // Step 2 — persist metadata to Firestore
    await setDoc(doc(db, 'users', uid, 'resume', 'current'), {
      fileName:   file.name,
      fileSize:   file.size,
      storageUrl,
      uploadedAt: serverTimestamp(),
    });
    setProgress(100);

    // Step 3 — show preview using a local blob URL (instant, no network round-trip)
    currentObjectUrl = URL.createObjectURL(file);
    showFileInfo(file.name, file.size, new Date());
    setPreviewSrc(currentObjectUrl, file.name);
  } catch (uploadErr) {
    console.error('[Resume] Upload error:', uploadErr);
    showDropzone();
    showError('Upload failed — ' + uploadErr.message);
  }
}

// ── File input: browse button ─────────────────────────────────────────────────

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
  fileInput.value = '';
});

// ── File input: replace button ────────────────────────────────────────────────

replaceInput.addEventListener('change', () => {
  if (replaceInput.files[0]) handleFile(replaceInput.files[0]);
  replaceInput.value = '';
});

// ── Drag and drop ─────────────────────────────────────────────────────────────

dropzone.addEventListener('dragenter', e => {
  e.preventDefault();
  dropzone.classList.add('resume-dropzone--drag-over');
});

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('resume-dropzone--drag-over');
});

dropzone.addEventListener('dragleave', e => {
  if (!dropzone.contains(e.relatedTarget)) {
    dropzone.classList.remove('resume-dropzone--drag-over');
  }
});

dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('resume-dropzone--drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// ── Remove button ─────────────────────────────────────────────────────────────

removeBtn.addEventListener('click', async () => {
  frameEl.src = '';
  revokeObjectUrl();

  if (!PLACEHOLDER && currentUser) {
    try {
      await supabaseDelete(currentUser.uid);
      await deleteDoc(doc(db, 'users', currentUser.uid, 'resume', 'current'));
    } catch (err) {
      console.warn('[Resume] Delete skipped:', err.message);
    }
  }

  showDropzone();
});
