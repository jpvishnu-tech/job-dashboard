import { initializeApp }                from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut }
                                        from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
}                                       from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig }               from './firebase-config.js';

// ── Auth-loading overlay ──────────────────────────────────────────────────────

const overlay = document.getElementById('authLoading');

function removeOverlay() {
  if (!overlay) return;
  overlay.classList.add('auth-loading--done');
  setTimeout(() => overlay.remove(), 400);
}

// ── Stub hub — replaced with live implementation once Firebase resolves ────────
// script.js calls window._hub as soon as Apply is clicked, so we need a safe
// no-op stub in place from the moment the page starts.

window._hub = {
  isApplied:       ()  => false,
  saveApplication: async () => {},
  refreshApplied:  ()  => {},
};

// ── Placeholder mode ─────────────────────────────────────────────────────────

if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
  removeOverlay();
} else {

  // ── Firebase init ───────────────────────────────────────────────────────────

  const app  = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db   = getFirestore(app);

  // ── Applied-job tracking ────────────────────────────────────────────────────

  const _appliedKeys = new Set(); // keyed by job URL (unique per listing)

  function markBtnApplied(btn) {
    btn.classList.add('apply-btn--applied');
    btn.innerHTML = '<span class="material-icons">check_circle</span> Applied';
    btn.disabled  = true;
  }

  // ── Stat card helpers ───────────────────────────────────────────────────────

  // Stat cards are ordered: Applied, Interviews, Pending, Rejected
  function updateStatCards(apps) {
    const total     = apps.length;
    const interview = apps.filter(a => a.status === 'interview').length;
    const pending   = apps.filter(a => a.status === 'pending').length;
    const rejected  = apps.filter(a => a.status === 'rejected').length;

    const counts = [total, interview, pending, rejected];
    document.querySelectorAll('.stat-card__value').forEach((el, i) => {
      if (counts[i] === undefined) return;
      el.textContent = counts[i];
      el.setAttribute('data-target', counts[i]);
    });

    // Update the bar widths proportionally to total (capped at 100%)
    const bars   = document.querySelectorAll('.stat-card__bar');
    const totDen = total || 1;
    const pcts   = [
      100,
      Math.round((interview / totDen) * 100),
      Math.round((pending   / totDen) * 100),
      Math.round((rejected  / totDen) * 100),
    ];
    bars.forEach((bar, i) => {
      if (pcts[i] !== undefined) bar.style.setProperty('--bar-pct', pcts[i] + '%');
    });
  }

  // ── Firestore helpers ───────────────────────────────────────────────────────

  function appDocRef(uid, url) {
    // Use a URL-safe, length-bounded string as the document ID
    const key = btoa(url).replace(/[/+=]/g, '_').slice(0, 500);
    return doc(db, 'users', uid, 'applications', key);
  }

  async function loadApplications(uid) {
    const snap = await getDocs(collection(db, 'users', uid, 'applications'));
    return snap.docs.map(d => d.data());
  }

  // ── Live hub ────────────────────────────────────────────────────────────────

  window._hub = {
    isApplied(url) {
      return _appliedKeys.has(url);
    },

    async saveApplication(job) {
      const uid = auth.currentUser?.uid;
      if (!uid || !job.url) return;
      if (_appliedKeys.has(job.url)) return; // already saved

      _appliedKeys.add(job.url);

      await setDoc(appDocRef(uid, job.url), {
        company:   job.company   || '',
        role:      job.role      || '',
        location:  job.location  || '',
        salary:    job.salary    || '',
        type:      job.type      || '',
        url:       job.url,
        status:    'pending',
        appliedAt: serverTimestamp(),
      });

      // Refresh stat cards after saving
      const apps = await loadApplications(uid);
      updateStatCards(apps);
    },

    // Re-scan all visible Apply buttons and mark already-applied ones
    refreshApplied() {
      document.querySelectorAll('.apply-btn[data-url]').forEach(btn => {
        if (_appliedKeys.has(btn.dataset.url)) markBtnApplied(btn);
      });
    },
  };

  // ── Auth state listener ─────────────────────────────────────────────────────

  onAuthStateChanged(auth, async user => {
    if (!user) {
      window.location.replace('auth.html');
      return;
    }

    // ── Populate user UI ──────────────────────────────────────────────────────

    const displayName = user.displayName || user.email.split('@')[0];
    const email       = user.email;
    const photoURL    = user.photoURL
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=48&bold=true`;

    const navAvatar   = document.querySelector('.navbar__avatar');
    const navName     = document.querySelector('.navbar__user-name');
    if (navAvatar) { navAvatar.src = photoURL; navAvatar.alt = displayName; }
    if (navName)     navName.textContent = displayName;

    const panelAvatar = document.querySelector('.user-panel__avatar');
    const panelName   = document.querySelector('.user-panel__name');
    const panelEmail  = document.querySelector('.user-panel__email');
    if (panelAvatar) { panelAvatar.src = photoURL; panelAvatar.alt = displayName; }
    if (panelName)     panelName.textContent  = displayName;
    if (panelEmail)    panelEmail.textContent = email;

    const subtitle = document.querySelector('.content__subtitle');
    if (subtitle) {
      subtitle.textContent = `Welcome back, ${displayName.split(' ')[0]}! Here's your job hunt at a glance.`;
    }

    // ── Load Firestore applications & update dashboard ────────────────────────

    try {
      const apps = await loadApplications(user.uid);
      apps.forEach(a => _appliedKeys.add(a.url));
      updateStatCards(apps);
      window._hub.refreshApplied(); // mark any already-rendered apply buttons
    } catch (err) {
      console.warn('Firestore load failed:', err.message);
    }

    // ── Wire sign-out ─────────────────────────────────────────────────────────

    async function doSignOut() {
      await signOut(auth);
      window.location.replace('auth.html');
    }

    document.querySelector('.user-panel__link--danger')
      ?.addEventListener('click', e => { e.preventDefault(); doSignOut(); });

    document.querySelector('.sidebar__nav-link--danger')
      ?.addEventListener('click', e => { e.preventDefault(); doSignOut(); });

    removeOverlay();
  });
}
