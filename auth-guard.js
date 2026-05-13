import { initializeApp, getApps, getApp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  browserLocalPersistence,
  setPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// ── Overlay ───────────────────────────────────────────────────────────────────
// The #authLoading div is position:fixed / z-index:9999 / inset:0.
// It covers the ENTIRE page. We must remove it — setting body.visibility
// does nothing because the overlay sits on top of the body.

const overlay = document.getElementById('authLoading');
let overlayGone = false;

function removeOverlay() {
  if (overlayGone) return;
  overlayGone = true;
  clearTimeout(safetyTimer);
  if (!overlay) return;
  overlay.classList.add('auth-loading--done');        // triggers CSS fade-out
  setTimeout(() => overlay.remove(), 400);            // remove from DOM after fade
}

// Safety net: if onAuthStateChanged never fires (CDN blocked, network error,
// bad config) the overlay is removed after 10 s so the page is not stuck forever.
const safetyTimer = setTimeout(() => {
  console.error('[auth-guard] Timed out waiting for Firebase — removing overlay.');
  removeOverlay();
}, 10_000);

// ── Default no-op hub ─────────────────────────────────────────────────────────
// script.js may call window._hub on any Apply button click, so we need a safe
// stub in place before the real Firebase session is confirmed.
window._hub = {
  isApplied:       ()       => false,
  saveApplication: async () => {},
  refreshApplied:  ()       => {},
};

// ── Unconfigured / demo mode ──────────────────────────────────────────────────
const configured = Boolean(firebaseConfig?.apiKey) &&
                   !firebaseConfig.apiKey.startsWith('YOUR_');

if (!configured) {
  console.warn('[auth-guard] Firebase not configured — skipping auth guard.');
  removeOverlay();
} else {

  // ── Safe Firebase init ────────────────────────────────────────────────────────
  // getApps() check prevents the "app already exists" crash that occurs when
  // multiple module scripts on the same page all call initializeApp().
  const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Explicitly request LOCAL persistence so sessions survive browser restarts.
  // Firebase's default is already LOCAL, but being explicit avoids surprises
  // in private-browsing or cross-origin iframe contexts.
  setPersistence(auth, browserLocalPersistence)
    .catch(err => console.warn('[auth-guard] Persistence warning:', err.message));

  // ── Stat-card helpers ─────────────────────────────────────────────────────────

  function updateStatCards(apps) {
    const total     = apps.length;
    const interview = apps.filter(a => a.status === 'interview').length;
    const pending   = apps.filter(a => a.status === 'pending').length;
    const rejected  = apps.filter(a => a.status === 'rejected').length;
    const counts    = [total, interview, pending, rejected];
    const totDen    = total || 1;
    const pcts      = [
      100,
      Math.round(interview / totDen * 100),
      Math.round(pending   / totDen * 100),
      Math.round(rejected  / totDen * 100),
    ];

    document.querySelectorAll('.stat-card__value').forEach((el, i) => {
      if (counts[i] === undefined) return;
      el.textContent = counts[i];
      el.setAttribute('data-target', counts[i]);
    });
    document.querySelectorAll('.stat-card__bar').forEach((bar, i) => {
      if (pcts[i] !== undefined) bar.style.setProperty('--bar-pct', pcts[i] + '%');
    });
  }

  // ── Firestore — dynamic import keeps auth unblocked ───────────────────────────
  // Firestore is optional: if the database is not set up, or a network error
  // occurs, loadFirestore() logs a warning and resolves silently.
  // The auth guard NEVER awaits this — overlay removal is never delayed by it.

  const _applied = new Set();

  async function loadFirestore(uid) {
    try {
      const {
        getFirestore, collection, getDocs, doc, setDoc, serverTimestamp,
      } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

      const db      = getFirestore(app);
      const colRef  = () => collection(db, 'users', uid, 'applications');
      const docKey  = url => btoa(url).replace(/[/+=]/g, '_').slice(0, 500);
      const fetchApps = async () => (await getDocs(colRef())).docs.map(d => d.data());

      // Load existing applied jobs
      const apps = await fetchApps();
      apps.forEach(a => _applied.add(a.url));
      updateStatCards(apps);

      // Replace stub hub with live implementation
      window._hub = {
        isApplied: url => _applied.has(url),

        async saveApplication(job) {
          if (!job?.url || _applied.has(job.url)) return;
          _applied.add(job.url);
          try {
            await setDoc(doc(db, 'users', uid, 'applications', docKey(job.url)), {
              company:   job.company   || '',
              role:      job.role      || '',
              location:  job.location  || '',
              salary:    job.salary    || '',
              type:      job.type      || '',
              url:       job.url,
              status:    'pending',
              appliedAt: serverTimestamp(),
            });
            updateStatCards(await fetchApps());
          } catch (err) {
            _applied.delete(job.url);
            console.warn('[hub] saveApplication failed:', err.message);
          }
        },

        refreshApplied() {
          document.querySelectorAll('.apply-btn[data-url]').forEach(btn => {
            if (!_applied.has(btn.dataset.url)) return;
            btn.classList.add('apply-btn--applied');
            btn.innerHTML = '<span class="material-icons">check_circle</span> Applied';
            btn.disabled  = true;
          });
        },
      };

      window._hub.refreshApplied();

    } catch (err) {
      console.warn('[auth-guard] Firestore unavailable — applied-job tracking disabled:', err.message);
    }
  }

  // ── Auth state ────────────────────────────────────────────────────────────────
  onAuthStateChanged(auth, async (user) => {

    if (!user) {
      // Not signed in — redirect to the auth page.
      // Do NOT call removeOverlay() here; the page is about to navigate away.
      clearTimeout(safetyTimer);
      window.location.replace('auth.html');
      return;
    }

    // User is confirmed signed in.
    try {

      // 1 ── Populate every user-info element in the UI ─────────────────────────
      const name      = (user.displayName || user.email.split('@')[0]).trim();
      const firstName = name.split(' ')[0];
      const base      = 'https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true';
      const navPhoto  = user.photoURL || `${base}&name=${encodeURIComponent(name)}&size=36`;
      const panPhoto  = user.photoURL || `${base}&name=${encodeURIComponent(name)}&size=48`;

      const set = (sel, prop, val) => {
        const el = document.querySelector(sel);
        if (el) el[prop] = val;
      };

      set('.navbar__avatar',    'src',         navPhoto);
      set('.navbar__avatar',    'alt',         name);
      set('.navbar__user-name', 'textContent', name);
      set('.user-panel__avatar','src',         panPhoto);
      set('.user-panel__avatar','alt',         name);
      set('.user-panel__name',  'textContent', name);
      set('.user-panel__email', 'textContent', user.email);
      set('.content__subtitle', 'textContent',
        `Welcome back, ${firstName}! Here's your job hunt at a glance.`);

      // 2 ── Wire logout buttons ─────────────────────────────────────────────────
      // { once: true } prevents duplicate listeners on the rare occasions where
      // onAuthStateChanged fires more than once (e.g. token refresh).
      async function doSignOut() {
        try { await signOut(auth); } catch { /* ignore sign-out errors */ }
        window.location.replace('auth.html');
      }

      document.querySelector('.user-panel__link--danger')
        ?.addEventListener('click', e => { e.preventDefault(); doSignOut(); }, { once: true });
      document.querySelector('.sidebar__nav-link--danger')
        ?.addEventListener('click', e => { e.preventDefault(); doSignOut(); }, { once: true });

      // 3 ── Load Firestore data (non-blocking — never delays overlay removal) ───
      loadFirestore(user.uid); // intentionally NOT awaited

    } catch (err) {
      console.error('[auth-guard] Unexpected error during session setup:', err);

    } finally {
      // ── CRITICAL ─────────────────────────────────────────────────────────────
      // removeOverlay() is in `finally` so it is GUARANTEED to run even if
      // something in the try block above throws.  This is what makes the
      // "infinite loading / white screen" impossible regardless of what else
      // goes wrong.
      removeOverlay();
    }
  });
}
