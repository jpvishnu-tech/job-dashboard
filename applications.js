/* ============================================================
   Applications tracker — listens for firestore:applications events
   dispatched by auth-guard.js and renders the full applications UI.
   ============================================================ */

const section     = document.getElementById('applicationsSection');
const tableBody   = document.getElementById('appsTableBody');
const emptyState  = document.getElementById('appsEmpty');
const badge       = document.getElementById('appsBadge');
const filterBtns  = document.querySelectorAll('.apps-filter');

let allApps     = [];
let activeFilter = 'all';

// ── Status config ─────────────────────────────────────────────

const STATUS_META = {
  pending:   { label: 'Pending',   cls: 'status-badge--pending'   },
  interview: { label: 'Interview', cls: 'status-badge--interview' },
  offer:     { label: 'Offer',     cls: 'status-badge--offer'     },
  rejected:  { label: 'Rejected',  cls: 'status-badge--rejected'  },
};

const ALL_STATUSES = ['pending', 'interview', 'offer', 'rejected'];

// ── Helper ────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatDate(val) {
  if (!val) return '—';
  // Firestore serverTimestamp arrives as { seconds, nanoseconds } or a Date
  const d = val.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Render ─────────────────────────────────────────────────────

function filteredApps() {
  if (activeFilter === 'all') return allApps;
  return allApps.filter(a => a.status === activeFilter);
}

function render() {
  const apps = filteredApps();

  // Update sidebar badge with total count
  if (badge) {
    badge.textContent = allApps.length;
    badge.hidden = allApps.length === 0;
  }

  // Update filter button counts
  filterBtns.forEach(btn => {
    const f = btn.dataset.filter;
    const count = f === 'all'
      ? allApps.length
      : allApps.filter(a => a.status === f).length;
    const countEl = btn.querySelector('.apps-filter__count');
    if (countEl) countEl.textContent = count;
    btn.classList.toggle('apps-filter--active', f === activeFilter);
  });

  if (apps.length === 0) {
    tableBody.innerHTML = '';
    emptyState.hidden   = false;
    return;
  }

  emptyState.hidden = true;
  tableBody.innerHTML = apps
    .slice()
    .sort((a, b) => {
      const ta = a.appliedAt?.seconds ?? 0;
      const tb = b.appliedAt?.seconds ?? 0;
      return tb - ta;
    })
    .map(app => buildRow(app))
    .join('');
}

function buildRow(app) {
  const meta   = STATUS_META[app.status] || STATUS_META.pending;
  const picker = ALL_STATUSES
    .map(s => {
      const m = STATUS_META[s];
      const active = s === app.status ? ' status-picker__opt--active' : '';
      return `<button class="status-picker__opt${active}" data-appid="${escHtml(app._id)}" data-status="${s}" data-url="${escHtml(app.url)}">${m.label}</button>`;
    })
    .join('');

  return `
  <tr data-appid="${escHtml(app._id)}">
    <td data-label="Company">
      <div class="app-company">
        <span class="app-company__name">${escHtml(app.company)}</span>
        ${app.url ? `<a class="app-company__link" href="${escHtml(app.url)}" target="_blank" rel="noopener noreferrer"><span class="material-icons" style="font-size:14px">open_in_new</span></a>` : ''}
      </div>
    </td>
    <td data-label="Role">${escHtml(app.role)}</td>
    <td data-label="Location">${escHtml(app.location)}</td>
    <td data-label="Type">${escHtml(app.type)}</td>
    <td data-label="Applied">${formatDate(app.appliedAt)}</td>
    <td data-label="Status">
      <div class="status-cell">
        <button class="status-badge ${meta.cls}" data-toggle-picker="${escHtml(app._id)}"
                aria-haspopup="true" aria-expanded="false">
          ${meta.label}
          <span class="material-icons" style="font-size:14px;vertical-align:middle;margin-left:2px">expand_more</span>
        </button>
        <div class="status-picker" id="picker-${escHtml(app._id)}" hidden>
          ${picker}
        </div>
      </div>
    </td>
    <td data-label="Actions">
      <div class="app-actions">
        <button class="app-action-btn app-action-btn--delete" data-appid="${escHtml(app._id)}" data-url="${escHtml(app.url)}"
                title="Delete application" aria-label="Delete">
          <span class="material-icons">delete_outline</span>
        </button>
      </div>
    </td>
  </tr>`;
}

// ── Event delegation ──────────────────────────────────────────

if (tableBody) {
  tableBody.addEventListener('click', e => {

    // Status badge toggle — open/close picker
    const toggleBtn = e.target.closest('[data-toggle-picker]');
    if (toggleBtn) {
      const appId  = toggleBtn.dataset.togglePicker;
      const picker = document.getElementById(`picker-${appId}`);
      if (!picker) return;
      const open = picker.hidden;
      closeAllPickers();
      if (open) {
        picker.hidden = false;
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    // Picker option — update status
    const opt = e.target.closest('.status-picker__opt');
    if (opt) {
      const { appid, status, url } = opt.dataset;
      // Optimistic UI update
      const app = allApps.find(a => a._id === appid);
      if (app && app.status !== status) {
        app.status = status;
        render();
        window._hub?.updateApplicationStatus(appid, status);
      }
      closeAllPickers();
      return;
    }

    // Delete button
    const delBtn = e.target.closest('.app-action-btn--delete');
    if (delBtn) {
      const { appid, url } = delBtn.dataset;
      // Optimistic UI update
      allApps = allApps.filter(a => a._id !== appid);
      render();
      window._hub?.deleteApplication(appid, url);
      return;
    }
  });
}

function closeAllPickers() {
  document.querySelectorAll('.status-picker').forEach(p => { p.hidden = true; });
  document.querySelectorAll('[data-toggle-picker]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}

// Close pickers when clicking outside the table
document.addEventListener('click', e => {
  if (!e.target.closest('.status-cell')) closeAllPickers();
});

// ── Filter tabs ───────────────────────────────────────────────

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    render();
  });
});

// ── Firestore event listener ──────────────────────────────────

window.addEventListener('firestore:applications', e => {
  allApps = e.detail ?? [];
  render();
});
