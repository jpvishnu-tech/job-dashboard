/* ============================================================
   admin.js — Firebase Admin Dashboard
   Self-contained ES module: auth guard, CRUD, UI.
   Does NOT depend on script.js to avoid SECTION_MAP conflicts.
   ============================================================ */

import { getApp, initializeApp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  collection, collectionGroup,
  doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs,
  onSnapshot, query, orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// ── Firebase init ─────────────────────────────────────────────
// Reuse existing app (auth-guard.js may have already called initializeApp)
let app;
try   { app = getApp(); }
catch { app = initializeApp(firebaseConfig); }

const auth = getAuth(app);
const db   = getFirestore(app);

// ── Dark mode ─────────────────────────────────────────────────
// Replicated from script.js — admin.html doesn't import script.js
// to avoid conflicts with the SECTION_MAP and job-table listeners.

const html       = document.documentElement;
const darkToggle = document.getElementById('darkToggle');

function applyTheme(dark) {
  if (dark) html.setAttribute('data-theme', 'dark');
  else      html.removeAttribute('data-theme');
  darkToggle?.setAttribute('aria-checked', String(dark));
}

applyTheme(
  localStorage.getItem('theme') === 'dark' ||
  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
);

darkToggle?.addEventListener('click', () => {
  const isDark = html.hasAttribute('data-theme');
  applyTheme(!isDark);
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (!localStorage.getItem('theme')) applyTheme(e.matches);
});

// ── Sidebar toggle ────────────────────────────────────────────
const sidebar         = document.getElementById('sidebar');
const mainWrapper     = document.getElementById('mainWrapper');
const sidebarBtn      = document.getElementById('sidebarToggle');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

sidebarBtn?.addEventListener('click', () => {
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('sidebar--open');
    sidebarBackdrop.classList.toggle('sidebar-backdrop--visible');
    document.body.style.overflow = sidebar.classList.contains('sidebar--open') ? 'hidden' : '';
  } else {
    sidebar.classList.toggle('sidebar--collapsed');
    mainWrapper.classList.toggle('main-wrapper--shifted');
  }
});

sidebarBackdrop?.addEventListener('click', () => {
  sidebar.classList.remove('sidebar--open');
  sidebarBackdrop.classList.remove('sidebar-backdrop--visible');
  document.body.style.overflow = '';
});

// ── Auth overlay ──────────────────────────────────────────────
const overlay = document.getElementById('authLoading');
let overlayGone = false;

function removeOverlay() {
  if (overlayGone) return;
  overlayGone = true;
  clearTimeout(safetyTimer);
  if (!overlay) return;
  overlay.classList.add('auth-loading--done');
  setTimeout(() => overlay.remove(), 400);
}

const safetyTimer = setTimeout(() => {
  console.error('[admin] Safety timer fired — removing overlay');
  removeOverlay();
}, 10_000);

// ── Utilities ─────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtDate(val) {
  if (!val) return '—';
  const d = val.toDate ? val.toDate() : new Date(val);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(val);
}

function setBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'stat-card__badge stat-card__badge--up';
  el.innerHTML = `<span class="material-icons">arrow_upward</span>${count}`;
}

// ── Section navigation ────────────────────────────────────────

const SECTIONS = ['overview', 'jobs', 'users', 'applications'];
const SECTION_EL = {
  overview:     document.getElementById('overviewSection'),
  jobs:         document.getElementById('jobsSection'),
  users:        document.getElementById('usersSection'),
  applications: document.getElementById('adminAppsSection'),
};

let _jobsLoaded  = false;
let _usersLoaded = false;
let _appsLoaded  = false;

function showSection(name) {
  SECTIONS.forEach(key => {
    if (SECTION_EL[key]) SECTION_EL[key].hidden = key !== name;
  });
  document.querySelectorAll('.sidebar__nav-item[data-section]').forEach(li => {
    li.classList.toggle('sidebar__nav-item--active', li.dataset.section === name);
  });
  // Lazy-load on first visit to each section
  if (name === 'jobs'         && !_jobsLoaded)  loadJobs();
  if (name === 'users'        && !_usersLoaded) loadUsers();
  if (name === 'applications' && !_appsLoaded)  loadAllApplications();
}

document.querySelectorAll('.sidebar__nav-item[data-section]').forEach(li => {
  li.addEventListener('click', e => {
    e.preventDefault();
    showSection(li.dataset.section);
  });
});

// ── Toast notifications ───────────────────────────────────────

const toastContainer = document.getElementById('toastContainer');

function showToast(msg, type = 'success') {
  const icon = { success: 'check_circle', error: 'error', info: 'info' }[type] ?? 'info';
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.innerHTML = `
    <span class="material-icons toast__icon">${icon}</span>
    <span class="toast__msg">${esc(msg)}</span>
    <button class="toast__close" aria-label="Dismiss"><span class="material-icons">close</span></button>`;
  t.querySelector('.toast__close').addEventListener('click', () => dismissToast(t));
  toastContainer.appendChild(t);
  // Force reflow so the enter transition plays
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('toast--visible')));
  setTimeout(() => dismissToast(t), 3800);
}

function dismissToast(t) {
  t.classList.remove('toast--visible');
  setTimeout(() => t.remove(), 300);
}

// ── Keyboard shortcuts (Escape closes any open modal) ─────────

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!document.getElementById('jobModalOverlay').hidden)     closeJobModal();
  else if (!document.getElementById('confirmModalOverlay').hidden) closeConfirmModal();
  else if (!document.getElementById('userModalOverlay').hidden)    closeUserModal();
});

// ══════════════════════════════════════════════════════════════
// AUTH GUARD + ADMIN CHECK
// ══════════════════════════════════════════════════════════════

let currentAdmin = null;

onAuthStateChanged(auth, async user => {
  if (!user) {
    clearTimeout(safetyTimer);
    window.location.replace('auth.html');
    return;
  }

  try {
    // Must have a document in the admins/ collection — no client can write there
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (!adminSnap.exists()) {
      clearTimeout(safetyTimer);
      window.location.replace('index.html');
      return;
    }

    currentAdmin = user;

    // Populate navbar
    const name    = (user.displayName || user.email.split('@')[0]).trim();
    const avatar  = user.photoURL ||
      `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&name=${encodeURIComponent(name)}&size=36`;

    const avatarEl = document.getElementById('adminAvatar');
    const nameEl   = document.getElementById('adminName');
    const welcomeEl = document.getElementById('adminWelcome');
    if (avatarEl) { avatarEl.src = avatar; avatarEl.alt = name; }
    if (nameEl)   nameEl.textContent = name;
    if (welcomeEl) welcomeEl.textContent =
      `Welcome back, ${name.split(' ')[0]}. Here's your platform at a glance.`;

    // Logout
    document.getElementById('adminLogoutBtn')?.addEventListener('click', async e => {
      e.preventDefault();
      await signOut(auth).catch(() => {});
      window.location.replace('auth.html');
    });

    // Load the overview immediately
    loadOverview();

  } catch (err) {
    console.error('[admin] Auth check error:', err);
    window.location.replace('index.html');
  } finally {
    removeOverlay();
  }
});

// ══════════════════════════════════════════════════════════════
// OVERVIEW
// ══════════════════════════════════════════════════════════════

const STATUS_CLASSES = {
  pending:   'status-badge--pending',
  interview: 'status-badge--interview',
  offer:     'status-badge--offer',
  rejected:  'status-badge--rejected',
};

async function loadOverview() {
  try {
    // ── Users ─────────────────────────────────────────────────
    const profilesSnap = await getDocs(collectionGroup(db, 'profile'));
    const userCount    = profilesSnap.size;
    setEl('ovTotalUsers', userCount);
    setEl('ovUsersMeta', `${userCount} registered account${userCount !== 1 ? 's' : ''}`);
    setBadge('ovBadgeUsers', userCount);

    // ── Jobs ──────────────────────────────────────────────────
    const jobsSnap  = await getDocs(collection(db, 'jobs'));
    const allJobs   = jobsSnap.docs.map(d => d.data());
    const activeJobs = allJobs.filter(j => j.active !== false).length;
    setEl('ovTotalJobs', activeJobs);
    setEl('ovJobsMeta', `${activeJobs} active listing${activeJobs !== 1 ? 's' : ''}`);
    setBadge('ovBadgeJobs', activeJobs);
    document.getElementById('ovJobsBar')
      ?.style.setProperty('--bar-pct', jobsSnap.size ? '100%' : '0%');

    const jobBadge = document.getElementById('adminJobsBadge');
    if (jobBadge) {
      jobBadge.textContent = jobsSnap.size;
      jobBadge.hidden = jobsSnap.size === 0;
    }

    // ── Applications ──────────────────────────────────────────
    const appsSnap  = await getDocs(collectionGroup(db, 'applications'));
    const allApps   = appsSnap.docs.map(d => d.data());
    const appCount  = allApps.length;
    const intvCount = allApps.filter(a => a.status === 'interview').length;

    setEl('ovTotalApps', appCount);
    setEl('ovAppsMeta', `${appCount} total submission${appCount !== 1 ? 's' : ''}`);
    setBadge('ovBadgeApps', appCount);
    document.getElementById('ovAppsBar')
      ?.style.setProperty('--bar-pct', appCount ? '100%' : '0%');

    setEl('ovTotalIntv', intvCount);
    const intvRate = appCount ? Math.round(intvCount / appCount * 100) : 0;
    setEl('ovIntvMeta', `${intvRate}% interview rate`);
    setBadge('ovBadgeIntv', intvCount);
    document.getElementById('ovIntvBar')
      ?.style.setProperty('--bar-pct', `${intvRate}%`);

    // ── Recent applications ────────────────────────────────────
    renderRecentApps(allApps);

  } catch (err) {
    console.error('[admin] Overview load failed:', err);
    showToast('Failed to load overview stats', 'error');
  }
}

function renderRecentApps(apps) {
  const tbody = document.getElementById('recentAppsBody');
  if (!tbody) return;

  const sorted = [...apps]
    .sort((a, b) => (b.appliedAt?.seconds ?? 0) - (a.appliedAt?.seconds ?? 0))
    .slice(0, 10);

  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No applications yet.</td></tr>';
    return;
  }

  tbody.innerHTML = sorted.map(app => `
    <tr>
      <td>${esc(app.email || app.uid || '—')}</td>
      <td><strong>${esc(app.company)}</strong></td>
      <td>${esc(app.role)}</td>
      <td><span class="status-badge ${STATUS_CLASSES[app.status] || STATUS_CLASSES.pending}">${esc(app.status || 'pending')}</span></td>
      <td>${fmtDate(app.appliedAt)}</td>
    </tr>`).join('');
}

// ══════════════════════════════════════════════════════════════
// JOB MANAGEMENT
// ══════════════════════════════════════════════════════════════

const TYPE_LABELS = {
  full_time: 'Full-time', part_time: 'Part-time',
  contract:  'Contract',  freelance: 'Freelance', remote: 'Remote',
};

const TYPE_BADGE_CLASSES = {
  full_time: 'type-badge--full',   part_time: 'type-badge--hybrid',
  contract:  'type-badge--onsite', freelance: 'type-badge--hybrid',
  remote:    'type-badge--remote',
};

let _allJobs     = [];
let _jobsUnsub   = null;
let _editingJobId = null;

function loadJobs() {
  if (_jobsUnsub) return; // already listening
  _jobsLoaded = true;

  _jobsUnsub = onSnapshot(
    query(collection(db, 'jobs'), orderBy('postedAt', 'desc')),
    snap => {
      _allJobs = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
      applyJobSearch();
      // Keep sidebar badge in sync
      const badge = document.getElementById('adminJobsBadge');
      if (badge) {
        badge.textContent = _allJobs.length;
        badge.hidden = _allJobs.length === 0;
      }
    },
    err => {
      console.error('[admin] Jobs listener error:', err);
      showToast('Could not load jobs — check Firestore rules', 'error');
    }
  );
}

function applyJobSearch() {
  const q = document.getElementById('jobSearchInput')?.value.toLowerCase() ?? '';
  const filtered = q
    ? _allJobs.filter(j => `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(q))
    : _allJobs;
  renderJobsTable(filtered);
  setEl('jobsCount', `${filtered.length} job${filtered.length !== 1 ? 's' : ''}`);
}

function renderJobsTable(jobs) {
  const tbody = document.getElementById('jobsTableBody');
  if (!tbody) return;

  if (jobs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No jobs found. Click "Add Job" to create the first listing.</td></tr>';
    return;
  }

  tbody.innerHTML = jobs.map(job => `
    <tr>
      <td data-label="Title"><strong>${esc(job.title)}</strong></td>
      <td data-label="Company">${esc(job.company)}</td>
      <td data-label="Location">${esc(job.location)}</td>
      <td data-label="Type">
        <span class="type-badge ${TYPE_BADGE_CLASSES[job.type] || ''}">${esc(TYPE_LABELS[job.type] || job.type)}</span>
      </td>
      <td data-label="Salary">${esc(job.salary || '—')}</td>
      <td data-label="Status">
        <span class="status-badge ${job.active !== false ? 'status-badge--offer' : 'status-badge--rejected'}">
          ${job.active !== false ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td data-label="Actions">
        <div class="app-actions">
          <button class="app-action-btn"
                  data-action="edit" data-id="${esc(job._id)}"
                  title="Edit job" aria-label="Edit ${esc(job.title)}">
            <span class="material-icons">edit</span>
          </button>
          <button class="app-action-btn app-action-btn--delete"
                  data-action="delete" data-id="${esc(job._id)}" data-title="${esc(job.title)}"
                  title="Delete job" aria-label="Delete ${esc(job.title)}">
            <span class="material-icons">delete_outline</span>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

document.getElementById('jobSearchInput')
  ?.addEventListener('input', applyJobSearch);

document.getElementById('jobsTableBody')
  ?.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'edit') {
      const job = _allJobs.find(j => j._id === btn.dataset.id);
      if (job) openJobModal(job);
    }
    if (btn.dataset.action === 'delete') {
      openConfirmModal(btn.dataset.id, btn.dataset.title);
    }
  });

// ── Job Modal ─────────────────────────────────────────────────

function openJobModal(job = null) {
  _editingJobId = job?._id ?? null;

  setEl('jobModalTitle',    job ? 'Edit Job'     : 'Add Job');
  setEl('jobModalSaveText', job ? 'Save Changes' : 'Save Job');

  document.getElementById('fTitle').value        = job?.title        ?? '';
  document.getElementById('fCompany').value      = job?.company      ?? '';
  document.getElementById('fLocation').value     = job?.location     ?? '';
  document.getElementById('fType').value         = job?.type         ?? '';
  document.getElementById('fSalary').value       = job?.salary       ?? '';
  document.getElementById('fUrl').value          = job?.url          ?? '';
  document.getElementById('fDescription').value  = job?.description  ?? '';
  document.getElementById('fRequirements').value = Array.isArray(job?.requirements)
    ? job.requirements.join('\n')
    : (job?.requirements ?? '');
  document.getElementById('fActive').checked     = job ? (job.active !== false) : true;

  const errEl = document.getElementById('jobFormError');
  if (errEl) errEl.hidden = true;

  const overlay = document.getElementById('jobModalOverlay');
  overlay.hidden = false;
  overlay.removeAttribute('aria-hidden');
  document.getElementById('fTitle').focus();
}

function closeJobModal() {
  const overlay = document.getElementById('jobModalOverlay');
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  _editingJobId = null;
}

document.getElementById('addJobBtn')   ?.addEventListener('click', () => openJobModal());
document.getElementById('jobModalClose') ?.addEventListener('click', closeJobModal);
document.getElementById('jobModalCancel')?.addEventListener('click', closeJobModal);
document.getElementById('jobModalOverlay')?.addEventListener('click', e => {
  if (e.target.id === 'jobModalOverlay') closeJobModal();
});

document.getElementById('jobModalSave')?.addEventListener('click', async () => {
  const errEl = document.getElementById('jobFormError');
  errEl.hidden = true;

  const title       = document.getElementById('fTitle').value.trim();
  const company     = document.getElementById('fCompany').value.trim();
  const location    = document.getElementById('fLocation').value.trim();
  const type        = document.getElementById('fType').value;
  const description = document.getElementById('fDescription').value.trim();

  if (!title || !company || !location || !type || !description) {
    errEl.textContent = 'Please fill in all required fields marked with *.';
    errEl.hidden = false;
    return;
  }

  const saveBtn = document.getElementById('jobModalSave');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="material-icons" style="animation:spin 1s linear infinite">hourglass_top</span><span>Saving…</span>';

  const data = {
    title, company, location, type,
    salary:       document.getElementById('fSalary').value.trim() || '',
    url:          document.getElementById('fUrl').value.trim()    || '',
    description,
    requirements: document.getElementById('fRequirements').value
      .split('\n').map(s => s.trim()).filter(Boolean),
    active:       document.getElementById('fActive').checked,
    updatedAt:    serverTimestamp(),
  };

  try {
    if (_editingJobId) {
      await updateDoc(doc(db, 'jobs', _editingJobId), data);
      showToast(`"${title}" updated`, 'success');
    } else {
      data.postedAt      = serverTimestamp();
      data.postedBy      = currentAdmin.uid;
      data.postedByEmail = currentAdmin.email;
      await addDoc(collection(db, 'jobs'), data);
      showToast(`"${title}" created`, 'success');
    }
    closeJobModal();
  } catch (err) {
    console.error('[admin] Save job error:', err);
    errEl.textContent = `Save failed: ${err.message}`;
    errEl.hidden = false;
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<span class="material-icons">save</span><span id="jobModalSaveText">${_editingJobId ? 'Save Changes' : 'Save Job'}</span>`;
  }
});

// ── Delete confirm modal ──────────────────────────────────────

let _deletingJobId = null;

function openConfirmModal(id, title) {
  _deletingJobId = id;
  setEl('confirmModalMsg', `Delete "${title}"? This action cannot be undone.`);
  const overlay = document.getElementById('confirmModalOverlay');
  overlay.hidden = false;
  overlay.removeAttribute('aria-hidden');
  document.getElementById('confirmModalConfirm').focus();
}

function closeConfirmModal() {
  const overlay = document.getElementById('confirmModalOverlay');
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  _deletingJobId = null;
}

document.getElementById('confirmModalClose') ?.addEventListener('click', closeConfirmModal);
document.getElementById('confirmModalCancel')?.addEventListener('click', closeConfirmModal);
document.getElementById('confirmModalOverlay')?.addEventListener('click', e => {
  if (e.target.id === 'confirmModalOverlay') closeConfirmModal();
});

document.getElementById('confirmModalConfirm')?.addEventListener('click', async () => {
  if (!_deletingJobId) return;
  const btn = document.getElementById('confirmModalConfirm');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  try {
    await deleteDoc(doc(db, 'jobs', _deletingJobId));
    showToast('Job deleted', 'success');
    closeConfirmModal();
  } catch (err) {
    console.error('[admin] Delete job error:', err);
    showToast(`Delete failed: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons">delete</span>Delete';
  }
});

// ══════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════════

let _allUsers = [];

async function loadUsers() {
  _usersLoaded = true;
  const tbody = document.getElementById('usersTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="table-loading">Loading users…</td></tr>';

  try {
    // collectionGroup('profile') hits users/{uid}/profile/data for every user
    const snap = await getDocs(collectionGroup(db, 'profile'));

    _allUsers = snap.docs.map(d => {
      // d.ref path: users/{uid}/profile/data
      // parent.parent.id  ↑   uid
      const uid = d.ref.parent.parent?.id ?? '?';
      return { uid, ...d.data() };
    });

    setEl('usersCount', `${_allUsers.length} user${_allUsers.length !== 1 ? 's' : ''}`);
    renderUsersTable(_allUsers);

  } catch (err) {
    console.error('[admin] Load users error:', err);
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Could not load users — verify Firestore rules allow collection group reads for admins.</td></tr>';
    showToast('Could not load users', 'error');
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No users found.</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => {
    const avatarUrl = u.photoURL ||
      `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&name=${encodeURIComponent(u.displayName || u.email || '?')}&size=32`;
    return `
    <tr>
      <td data-label="User">
        <div class="user-cell">
          <img class="user-cell__avatar" src="${esc(avatarUrl)}" alt="${esc(u.displayName || '')}" width="32" height="32">
          <span class="user-cell__name">${esc(u.displayName || '—')}</span>
        </div>
      </td>
      <td data-label="Email">${esc(u.email || '—')}</td>
      <td data-label="Last Login">${fmtDate(u.lastLogin)}</td>
      <td data-label="UID"><code class="admin-uid">${esc(u.uid)}</code></td>
      <td data-label="Actions">
        <button class="btn btn--ghost btn--sm view-apps-btn"
                data-uid="${esc(u.uid)}"
                data-name="${esc(u.displayName || u.email || u.uid)}"
                aria-label="View applications for ${esc(u.displayName || u.email || u.uid)}">
          <span class="material-icons" style="font-size:15px">visibility</span>
          View Apps
        </button>
      </td>
    </tr>`;
  }).join('');
}

document.getElementById('userSearchInput')?.addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = _allUsers.filter(u =>
    `${u.displayName} ${u.email} ${u.uid}`.toLowerCase().includes(q)
  );
  renderUsersTable(filtered);
  setEl('usersCount', `${filtered.length} user${filtered.length !== 1 ? 's' : ''}`);
});

document.getElementById('usersTableBody')?.addEventListener('click', e => {
  const btn = e.target.closest('.view-apps-btn');
  if (btn) openUserModal(btn.dataset.uid, btn.dataset.name);
});

// ── User Applications Modal ───────────────────────────────────

async function openUserModal(uid, name) {
  const overlay = document.getElementById('userModalOverlay');
  const body    = document.getElementById('userModalBody');
  setEl('userModalTitle', `${name} — Applications`);
  body.innerHTML = '<div style="padding:32px;text-align:center;color:var(--color-text-muted)">Loading…</div>';
  overlay.hidden = false;
  overlay.removeAttribute('aria-hidden');

  try {
    const snap = await getDocs(collection(db, 'users', uid, 'applications'));
    const apps = snap.docs.map(d => d.data());

    if (apps.length === 0) {
      body.innerHTML = `
        <div class="applications-empty" style="padding:32px">
          <span class="material-icons applications-empty__icon">inbox</span>
          <p class="applications-empty__title">No applications yet</p>
          <p class="applications-empty__sub">This user hasn't applied to any jobs.</p>
        </div>`;
      return;
    }

    const sorted = [...apps].sort(
      (a, b) => (b.appliedAt?.seconds ?? 0) - (a.appliedAt?.seconds ?? 0)
    );

    body.innerHTML = `
      <div class="table-wrapper">
        <table class="jobs-table">
          <thead>
            <tr><th>Company</th><th>Role</th><th>Location</th><th>Status</th><th>Applied</th></tr>
          </thead>
          <tbody>
            ${sorted.map(app => `
              <tr>
                <td><strong>${esc(app.company)}</strong></td>
                <td>${esc(app.role)}</td>
                <td>${esc(app.location || '—')}</td>
                <td><span class="status-badge ${STATUS_CLASSES[app.status] || STATUS_CLASSES.pending}">${esc(app.status || 'pending')}</span></td>
                <td>${fmtDate(app.appliedAt)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

  } catch (err) {
    body.innerHTML = `<div class="table-empty" style="padding:24px">Failed to load: ${esc(err.message)}</div>`;
  }
}

function closeUserModal() {
  const overlay = document.getElementById('userModalOverlay');
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
}

document.getElementById('userModalClose')?.addEventListener('click', closeUserModal);
document.getElementById('userModalDone') ?.addEventListener('click', closeUserModal);
document.getElementById('userModalOverlay')?.addEventListener('click', e => {
  if (e.target.id === 'userModalOverlay') closeUserModal();
});

// ══════════════════════════════════════════════════════════════
// ALL APPLICATIONS
// ══════════════════════════════════════════════════════════════

let _adminAllApps  = [];
let _adminAppsFilter = 'all';

async function loadAllApplications() {
  _appsLoaded = true;
  const tbody = document.getElementById('adminAppsTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Loading applications…</td></tr>';

  try {
    const snap   = await getDocs(collectionGroup(db, 'applications'));
    _adminAllApps = snap.docs.map(d => d.data());
    updateAppFilterCounts();
    renderAdminAppsTable();
  } catch (err) {
    console.error('[admin] Load all apps error:', err);
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Could not load applications — verify Firestore collection group rules.</td></tr>';
    showToast('Could not load applications', 'error');
  }
}

function updateAppFilterCounts() {
  const counts = {
    all:       _adminAllApps.length,
    pending:   _adminAllApps.filter(a => a.status === 'pending').length,
    interview: _adminAllApps.filter(a => a.status === 'interview').length,
    offer:     _adminAllApps.filter(a => a.status === 'offer').length,
    rejected:  _adminAllApps.filter(a => a.status === 'rejected').length,
  };
  setEl('appsFilterAll',       counts.all);
  setEl('appsFilterPending',   counts.pending);
  setEl('appsFilterInterview', counts.interview);
  setEl('appsFilterOffer',     counts.offer);
  setEl('appsFilterRejected',  counts.rejected);
}

function renderAdminAppsTable() {
  const tbody = document.getElementById('adminAppsTableBody');
  if (!tbody) return;

  const q = document.getElementById('appsSearchInput')?.value.toLowerCase() ?? '';

  let apps = _adminAppsFilter === 'all'
    ? _adminAllApps
    : _adminAllApps.filter(a => a.status === _adminAppsFilter);

  if (q) {
    apps = apps.filter(a =>
      `${a.company} ${a.role} ${a.email} ${a.location}`.toLowerCase().includes(q)
    );
  }

  setEl('appsCount', `${apps.length} application${apps.length !== 1 ? 's' : ''}`);

  if (apps.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No applications match the current filter.</td></tr>';
    return;
  }

  const sorted = [...apps].sort(
    (a, b) => (b.appliedAt?.seconds ?? 0) - (a.appliedAt?.seconds ?? 0)
  );

  tbody.innerHTML = sorted.map(app => `
    <tr>
      <td data-label="User"><span class="admin-email">${esc(app.email || app.uid || '—')}</span></td>
      <td data-label="Company"><strong>${esc(app.company)}</strong></td>
      <td data-label="Role">${esc(app.role)}</td>
      <td data-label="Location">${esc(app.location || '—')}</td>
      <td data-label="Status">
        <span class="status-badge ${STATUS_CLASSES[app.status] || STATUS_CLASSES.pending}">${esc(app.status || 'pending')}</span>
      </td>
      <td data-label="Applied">${fmtDate(app.appliedAt)}</td>
    </tr>`).join('');
}

// Filter tabs
document.getElementById('adminAppsFilters')?.addEventListener('click', e => {
  const btn = e.target.closest('.apps-filter');
  if (!btn) return;
  _adminAppsFilter = btn.dataset.filter;
  document.querySelectorAll('#adminAppsFilters .apps-filter').forEach(b =>
    b.classList.toggle('apps-filter--active', b === btn)
  );
  renderAdminAppsTable();
});

document.getElementById('appsSearchInput')?.addEventListener('input', renderAdminAppsTable);
