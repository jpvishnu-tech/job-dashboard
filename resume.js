import { getApp, initializeApp }      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp,
}                                      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getStorage, ref as storageRef,
  uploadBytesResumable, getDownloadURL, deleteObject,
}                                      from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { firebaseConfig }              from './firebase-config.js';

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
let currentObjectUrl = null; // blob URL of the last locally-loaded file
let db, storage;

// ── Firebase init ─────────────────────────────────────────────────────────────

if (!PLACEHOLDER) {
  // Reuse the Firebase app already initialised by auth-guard.js
  let app;
  try   { app = getApp(); }
  catch { app = initializeApp(firebaseConfig); }

  db      = getFirestore(app);
  storage = getStorage(app);

  const auth = getAuth(app);
  onAuthStateChanged(auth, user => {
    currentUser = user;
    if (user) loadSavedResume(user.uid);
  });
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
  progressName.textContent  = fileName;
  progressFill.style.width  = '0%';
  progressPct.textContent   = '0%';
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
  frameEl.src         = src;
  downloadLink.href   = src;
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
    console.warn('Resume load failed:', err.message);
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

  // Placeholder mode — local preview only (no persistence)
  if (PLACEHOLDER) {
    revokeObjectUrl();
    currentObjectUrl = URL.createObjectURL(file);
    dropzone.hidden  = true;
    showFileInfo(file.name, file.size, new Date());
    setPreviewSrc(currentObjectUrl, file.name);
    return;
  }

  // Live mode — upload to Firebase Storage
  const uid = currentUser?.uid;
  if (!uid) return;

  showProgress(file.name);
  revokeObjectUrl();

  const sRef      = storageRef(storage, `resumes/${uid}/resume.pdf`);
  const uploadTask = uploadBytesResumable(sRef, file, { contentType: 'application/pdf' });

  uploadTask.on(
    'state_changed',
    snapshot => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
    uploadErr => {
      console.error('Upload error:', uploadErr);
      showDropzone();
      showError('Upload failed — ' + uploadErr.message);
    },
    async () => {
      try {
        const storageUrl = await getDownloadURL(uploadTask.snapshot.ref);

        await setDoc(doc(db, 'users', uid, 'resume', 'current'), {
          fileName:   file.name,
          fileSize:   file.size,
          storageUrl,
          uploadedAt: serverTimestamp(),
        });

        // Use a local object URL for the iframe so the PDF renders instantly;
        // the Storage URL is persisted to Firestore for future sessions.
        currentObjectUrl = URL.createObjectURL(file);
        showFileInfo(file.name, file.size, new Date());
        setPreviewSrc(currentObjectUrl, file.name);
      } catch (finalErr) {
        console.error('Post-upload error:', finalErr);
        showDropzone();
        showError('Could not save resume info — ' + finalErr.message);
      }
    }
  );
}

// ── File input: browse button ─────────────────────────────────────────────────

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
  fileInput.value = ''; // reset so same file can be re-selected
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
  e.preventDefault(); // required to allow drop
  dropzone.classList.add('resume-dropzone--drag-over');
});

dropzone.addEventListener('dragleave', e => {
  // Only remove if leaving the dropzone itself (not a child element)
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
  // Clear preview immediately
  frameEl.src = '';
  revokeObjectUrl();

  if (!PLACEHOLDER && currentUser) {
    try {
      await deleteObject(storageRef(storage, `resumes/${currentUser.uid}/resume.pdf`));
      await deleteDoc(doc(db, 'users', currentUser.uid, 'resume', 'current'));
    } catch (err) {
      // File may not exist in Storage (e.g. placeholder switch); ignore
      console.warn('Resume delete skipped:', err.code);
    }
  }

  showDropzone();
});
