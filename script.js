/* ============================================================
   DARK MODE TOGGLE
   Priority order for the initial theme:
     1. Explicit user choice saved in localStorage ('theme' key)
     2. OS / browser preference via prefers-color-scheme
     3. Fallback → light mode
   The pill toggle slides and flips aria-checked; CSS variables
   handle every visual change automatically.
   ============================================================ */

const html       = document.documentElement;
const darkToggle = document.getElementById('darkToggle');

/* System-level dark preference media query */
const prefDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(dark) {
  if (dark) {
    html.setAttribute('data-theme', 'dark');
    darkToggle.setAttribute('aria-checked', 'true');
  } else {
    html.removeAttribute('data-theme');
    darkToggle.setAttribute('aria-checked', 'false');
  }
}

/* Determine the initial theme without flashing */
function resolveInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark')  return true;
  if (saved === 'light') return false;
  return prefDark.matches;   /* fall back to OS preference */
}

applyTheme(resolveInitialTheme());

/* Manual toggle — saves an explicit choice, overriding the OS default */
darkToggle.addEventListener('click', () => {
  const isDark = html.hasAttribute('data-theme');
  applyTheme(!isDark);
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
});

/* Follow OS changes only when the user has not set a manual preference */
prefDark.addEventListener('change', e => {
  if (!localStorage.getItem('theme')) applyTheme(e.matches);
});


/* ============================================================
   SIDEBAR TOGGLE
   Desktop: collapses to icon-only strip.
   Mobile:  slides in as a full-height overlay with a dim backdrop.
   ============================================================ */

const sidebar         = document.getElementById('sidebar');
const mainWrapper     = document.getElementById('mainWrapper');
const sidebarBtn      = document.getElementById('sidebarToggle');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const MOBILE_BP       = 768;

function openMobileSidebar() {
  sidebar.classList.add('sidebar--open');
  sidebarBackdrop.classList.add('sidebar-backdrop--visible');
  document.body.style.overflow = 'hidden'; /* prevent page scroll behind overlay */
}

function closeMobileSidebar() {
  sidebar.classList.remove('sidebar--open');
  sidebarBackdrop.classList.remove('sidebar-backdrop--visible');
  document.body.style.overflow = '';
}

sidebarBtn.addEventListener('click', () => {
  if (window.innerWidth <= MOBILE_BP) {
    sidebar.classList.contains('sidebar--open') ? closeMobileSidebar() : openMobileSidebar();
  } else {
    sidebar.classList.toggle('sidebar--collapsed');
    mainWrapper.classList.toggle('main-wrapper--shifted');
  }
});

/* Close when tapping the backdrop or anywhere outside the sidebar */
document.addEventListener('click', (e) => {
  if (
    window.innerWidth <= MOBILE_BP &&
    sidebar.classList.contains('sidebar--open') &&
    !sidebar.contains(e.target) &&
    !sidebarBtn.contains(e.target)
  ) {
    closeMobileSidebar();
  }
});

/* Close overlay when a nav link is tapped on mobile */
sidebar.querySelectorAll('.sidebar__nav-link').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= MOBILE_BP) closeMobileSidebar();
  });
});

/* If the viewport grows past the mobile breakpoint while the overlay
   is open (e.g. rotating from portrait to landscape), clean up. */
window.addEventListener('resize', () => {
  if (window.innerWidth > MOBILE_BP && sidebar.classList.contains('sidebar--open')) {
    closeMobileSidebar();
  }
});


/* ============================================================
   SECTION NAVIGATION
   Each sidebar nav item carries a data-section attribute that
   maps to a group of DOM elements to show or hide.
   ============================================================ */

const SECTION_MAP = {
  dashboard:    ['#dashboardHeader', '.stats-grid', '#chartsSection', '.jobs-section'],
  applications: ['#applicationsSection'],
  resume:       ['#resumeSection'],
};

function showSection(name) {
  const showSelectors = SECTION_MAP[name] || SECTION_MAP.dashboard;
  const allSelectors  = Object.values(SECTION_MAP).flat();
  allSelectors.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.hidden = !showSelectors.includes(sel);
  });
}


/* ============================================================
   ACTIVE NAV LINK
   Tracks clicks on both the main nav list and the footer links.
   ============================================================ */

const navItems    = document.querySelectorAll('.sidebar__nav-item');
const footerLinks = document.querySelectorAll('.sidebar__footer .sidebar__nav-link');

function clearActive() {
  navItems.forEach(i => i.classList.remove('sidebar__nav-item--active'));
  footerLinks.forEach(l => l.classList.remove('sidebar__nav-link--active'));
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    clearActive();
    item.classList.add('sidebar__nav-item--active');
    if (item.dataset.section) showSection(item.dataset.section);
  });
});

footerLinks.forEach(link => {
  if (link.classList.contains('sidebar__nav-link--danger')) return; /* logout — no active state */
  link.addEventListener('click', () => { clearActive(); link.classList.add('sidebar__nav-link--active'); });
});


/* ============================================================
   SEARCH HELPERS
   Shared utilities used by both the navbar overlay and the
   jobs table filter.
   ============================================================ */

/* Escape special regex metacharacters in a user-supplied string */
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* Escape HTML special characters to prevent injection */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

/* Wrap query matches in <mark class="search-mark">; stores original
   text in data-original so it can be restored on the next search. */
function applyHighlight(el, q) {
  if (!el) return;
  if (!el.dataset.original) el.dataset.original = el.textContent.trim();
  if (!q) { el.textContent = el.dataset.original; return; }
  const safe = escapeHtml(el.dataset.original);
  el.innerHTML = safe.replace(
    new RegExp(`(${escapeRe(q)})`, 'gi'),
    '<mark class="search-mark">$1</mark>'
  );
}

/* Highlight matches inside a plain string — returns an HTML string */
function hlText(text, q) {
  const safe = escapeHtml(text);
  if (!q) return safe;
  return safe.replace(
    new RegExp(`(${escapeRe(q)})`, 'gi'),
    '<mark class="search-mark">$1</mark>'
  );
}


/* ============================================================
   SEARCH BAR  (navbar)
   Clear button + Ctrl/Cmd+K shortcut + global search overlay.
   ============================================================ */

const navSearch     = document.getElementById('navSearch');
const searchClear   = document.getElementById('searchClear');
const searchKbd     = document.querySelector('.navbar__search-kbd');
const searchOverlay = document.getElementById('searchOverlay');

let searchFocusIdx = -1;   /* tracks keyboard-focused result item */

function openSearchOverlay()  { if (searchOverlay) searchOverlay.hidden = false; }

function closeSearchOverlay() {
  if (searchOverlay) searchOverlay.hidden = true;
  searchFocusIdx = -1;
}

/* Rebuild overlay and toggle clear/kbd UI on every keystroke */
navSearch.addEventListener('input', () => {
  const val = navSearch.value;
  const q   = val.trim();
  searchClear.hidden = !val.length;
  if (searchKbd) searchKbd.style.display = val.length ? 'none' : '';
  renderSearchOverlay(q);
});

searchClear.addEventListener('click', () => {
  navSearch.value = '';
  searchClear.hidden = true;
  if (searchKbd) searchKbd.style.display = '';
  closeSearchOverlay();
  navSearch.focus();
});

/* Ctrl+K / Cmd+K — focus and select the search input */
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    navSearch.focus();
    navSearch.select();
  }
});

/* ↑ / ↓ / Enter / Escape keyboard navigation within the overlay */
navSearch.addEventListener('keydown', e => {
  if (!searchOverlay || searchOverlay.hidden) return;
  const items = Array.from(searchOverlay.querySelectorAll('.search-result'));
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchFocusIdx = Math.min(searchFocusIdx + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchFocusIdx = Math.max(searchFocusIdx - 1, 0);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    /* Activate focused item, or first item if nothing is focused */
    (searchFocusIdx >= 0 ? items[searchFocusIdx] : items[0]).dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true })
    );
    return;
  } else if (e.key === 'Escape') {
    closeSearchOverlay();
    return;
  } else {
    return;
  }

  items.forEach((el, i) => el.classList.toggle('search-result--focused', i === searchFocusIdx));
  items[searchFocusIdx]?.scrollIntoView({ block: 'nearest' });
});

/* Close overlay when clicking anywhere outside the search widget */
document.addEventListener('click', e => {
  if (searchOverlay &&
      !searchOverlay.contains(e.target) &&
      !navSearch.closest('.navbar__search').contains(e.target)) {
    closeSearchOverlay();
  }
});


/* ============================================================
   NOTIFICATION DROPDOWN
   ============================================================ */

const notifBtn    = document.getElementById('notifBtn');
const notifPanel  = document.getElementById('notifPanel');
const notifDot    = document.getElementById('notifDot');
const markAllBtn  = document.getElementById('markAllRead');

function openNotifPanel()  {
  notifPanel.hidden = false;
  notifBtn.setAttribute('aria-expanded', 'true');
  closeUserPanel();   /* ensure the two dropdowns never overlap */
}

function closeNotifPanel() {
  notifPanel.hidden = true;
  notifBtn.setAttribute('aria-expanded', 'false');
}

notifBtn.addEventListener('click', e => {
  e.stopPropagation();
  notifPanel.hidden ? openNotifPanel() : closeNotifPanel();
});

/* Mark-all-read: strip unread styles, hide bell dot, disable the button */
markAllBtn.addEventListener('click', () => {
  document.querySelectorAll('.notif-item--unread').forEach(el =>
    el.classList.remove('notif-item--unread')
  );
  notifDot.style.display = 'none';
  markAllBtn.textContent = 'All read';
  markAllBtn.disabled = true;
});


/* ============================================================
   USER PROFILE DROPDOWN
   ============================================================ */

const userBtn   = document.getElementById('userBtn');
const userPanel = document.getElementById('userPanel');

function openUserPanel()  {
  userPanel.hidden = false;
  userBtn.setAttribute('aria-expanded', 'true');
  closeNotifPanel();  /* ensure the two dropdowns never overlap */
}

function closeUserPanel() {
  userPanel.hidden = true;
  userBtn.setAttribute('aria-expanded', 'false');
}

userBtn.addEventListener('click', e => {
  e.stopPropagation();
  userPanel.hidden ? openUserPanel() : closeUserPanel();
});


/* ============================================================
   SHARED: CLOSE DROPDOWNS ON OUTSIDE CLICK OR ESCAPE
   ============================================================ */

document.addEventListener('click', e => {
  if (!document.getElementById('notifWrap').contains(e.target)) closeNotifPanel();
  if (!document.getElementById('userWrap').contains(e.target))  closeUserPanel();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeNotifPanel(); closeUserPanel(); closeSearchOverlay(); }
});


/* ============================================================
   STAT CARD ANIMATIONS
   Count-up: each .stat-card__value reads its data-target and
   animates from 0 to that number with an ease-out curve.
   Progress bars: CSS transition handles the animation; JS just
   sets the final width from the --bar-pct custom property.
   ============================================================ */

function countUp(el) {
  const target   = parseInt(el.dataset.target, 10);
  const duration = 1100; /* ms */
  const start    = performance.now();

  (function step(now) {
    const t   = Math.min((now - start) / duration, 1);
    /* Ease-out cubic — decelerates as it approaches the target */
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * target);
    if (t < 1) requestAnimationFrame(step);
  })(start);
}

/* Kick off the progress bar CSS transition.
   We set width to the --bar-pct value so the transition plays. */
function animateBars() {
  document.querySelectorAll('.stat-card__bar').forEach(bar => {
    /* getComputedStyle reads inline custom properties */
    const pct = bar.style.getPropertyValue('--bar-pct').trim();
    if (pct) requestAnimationFrame(() => { bar.style.width = pct; });
  });
}

/* IntersectionObserver fires count-up when a card scrolls into view.
   This ensures the animation plays even on short viewports. */
const cardObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const val = entry.target.querySelector('.stat-card__value[data-target]');
    if (val) countUp(val);
    cardObserver.unobserve(entry.target);
  });
}, { threshold: 0.25 });

document.querySelectorAll('.stat-card').forEach(card => cardObserver.observe(card));

/* Bars start their CSS transitions immediately (CSS delay handles timing) */
animateBars();


/* ============================================================
   JOBS TABLE
   Live filter (all columns) · text highlight · result count ·
   column sort · Apply button
   ============================================================ */

const jobsFilterInput = document.getElementById('jobsFilter');
const jobsBody        = document.getElementById('jobsBody');
const jobsResultCount = document.getElementById('jobsResultCount');

/* Run the table filter against every text column.
   Highlights matched text in pure-text cells; updates the count pill. */
function runJobsFilter(q) {
  if (!jobsBody) return;
  if (typeof apiLoaded !== 'undefined' && apiLoaded) return; /* API mode handles its own filter */
  let visible = 0;

  jobsBody.querySelectorAll('tr:not(.jobs-empty-row)').forEach(row => {
    const companyEl = row.querySelector('.co-cell__name');
    const roleEl    = row.querySelector('.role-cell__title');
    const deptEl    = row.querySelector('.role-cell__dept');
    const typeEl    = row.querySelector('.type-badge');
    const locText   = row.querySelector('.loc-cell')?.textContent.toLowerCase() ?? '';

    /* Use stored original text (before any prior highlighting) for matching */
    const getText = el => (el?.dataset.original ?? el?.textContent ?? '').toLowerCase();
    const show = !q || [
      getText(companyEl), getText(roleEl), getText(deptEl), getText(typeEl), locText
    ].some(t => t.includes(q));

    row.style.display = show ? '' : 'none';

    /* Apply or strip highlights on the pure-text cells */
    [companyEl, roleEl, deptEl, typeEl].forEach(el =>
      applyHighlight(el, show && q ? q : '')
    );

    if (show) visible++;
  });

  /* Update the count badge in the toolbar */
  if (jobsResultCount) {
    jobsResultCount.textContent = q
      ? `${visible} result${visible !== 1 ? 's' : ''}`
      : '148 positions';
  }

  /* Insert or remove the "no results" empty-state row */
  let emptyRow = jobsBody.querySelector('.jobs-empty-row');
  if (visible === 0 && !emptyRow) {
    emptyRow = jobsBody.insertRow();
    emptyRow.className = 'jobs-empty-row';
    const td = emptyRow.insertCell();
    td.colSpan = 6;
    td.innerHTML = `
      <div class="jobs-table__empty">
        <span class="material-icons">search_off</span>
        No jobs match "<strong>${escapeHtml(q)}</strong>"
      </div>`;
  } else if (visible > 0 && emptyRow) {
    emptyRow.remove();
  }
}

if (jobsFilterInput) {
  jobsFilterInput.addEventListener('input', () => {
    runJobsFilter(jobsFilterInput.value.toLowerCase().trim());
  });
}

if (jobsBody) {

  /* ---- Apply button: open career page, save to Firestore, mark as applied ---- */
  jobsBody.addEventListener('click', e => {
    const btn = e.target.closest('.apply-btn');
    if (!btn || btn.classList.contains('apply-btn--applied')) return;

    if (btn.dataset.url) window.open(btn.dataset.url, '_blank', 'noopener,noreferrer');

    // Mark button immediately so the UI responds without waiting for Firestore
    btn.classList.add('apply-btn--applied');
    btn.innerHTML = '<span class="material-icons">check_circle</span> Applied';
    btn.disabled  = true;

    // Collect job data from the DOM row or from the API job object
    const row = btn.closest('tr');
    let job;

    if (typeof apiLoaded !== 'undefined' && apiLoaded) {
      // API mode: find the matching job object by URL
      const url = btn.dataset.url;
      job = apiJobs.find(j => j.url === url);
      if (job) {
        job = {
          company:  job.company,
          role:     job.role,
          location: job.location,
          salary:   job.salary,
          type:     job.type.label,
          url:      job.url,
        };
      }
    }

    if (!job && row) {
      // DOM/demo mode: read data from the table cells
      job = {
        company:  row.querySelector('.co-cell__name')?.textContent.trim()   || '',
        role:     row.querySelector('.role-cell__title')?.textContent.trim() || '',
        location: row.querySelector('.loc-cell')?.textContent.trim()         || '',
        salary:   row.querySelector('.salary')?.textContent.trim()           || '',
        type:     row.querySelector('.type-badge')?.textContent.trim()       || '',
        url:      btn.dataset.url || '',
      };
    }

    if (job?.url) window._hub?.saveApplication(job);
  });

  /* ---- Column sort: click a sortable <th> to sort ascending / descending ---- */
  const jobsSortState = { col: -1, dir: 1 }; /* dir: 1 = asc, -1 = desc */

  document.querySelectorAll('.jobs-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      if (typeof apiLoaded !== 'undefined' && apiLoaded) return; /* API mode handles sort */
      const colIdx = parseInt(th.dataset.sort, 10);

      /* Toggle direction when clicking the already-sorted column */
      jobsSortState.dir = (jobsSortState.col === colIdx) ? -jobsSortState.dir : 1;
      jobsSortState.col = colIdx;

      /* Update sort icons on all sortable headers */
      document.querySelectorAll('.jobs-table th[data-sort]').forEach(h => {
        const icon = h.querySelector('.sort-icon');
        if (h === th) {
          icon.textContent = jobsSortState.dir === 1 ? 'arrow_upward' : 'arrow_downward';
          h.classList.add('th--sorted');
        } else {
          icon.textContent = 'unfold_more';
          h.classList.remove('th--sorted');
        }
      });

      /* Re-order visible rows */
      const rows = Array.from(jobsBody.querySelectorAll('tr:not(.jobs-empty-row)'));
      rows.sort((a, b) => {
        const aCell = a.cells[colIdx];
        const bCell = b.cells[colIdx];
        /* data-value carries the numeric key for salary; fall back to plain text */
        const aVal  = aCell.dataset.value ?? aCell.textContent.trim();
        const bVal  = bCell.dataset.value ?? bCell.textContent.trim();
        const aNum  = parseFloat(aVal);
        const bNum  = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) return (aNum - bNum) * jobsSortState.dir;
        return aVal.localeCompare(bVal) * jobsSortState.dir;
      });

      rows.forEach(row => jobsBody.appendChild(row));
    });
  });

}


/* ============================================================
   GLOBAL SEARCH OVERLAY
   Reads job data from the table rows and renders a live-results
   dropdown beneath the navbar search input.
   ============================================================ */

/* Build a lightweight data index — reads from apiJobs[] when the API is
   loaded, or from the live DOM rows when showing static/demo data. */
function getJobRows() {
  /* API mode: search the full dataset, not just the current page */
  if (typeof apiLoaded !== 'undefined' && apiLoaded && apiJobs.length) {
    return apiJobs.map(job => ({
      row:     null,                        /* no DOM row — navigation handled separately */
      company: job.company,
      logoSrc: job.logoUrl,
      logoAlt: job.company,
      role:    job.role,
      dept:    job.dept,
      location:job.location,
      type:    job.type.label,
      typeCls: `type-badge ${job.type.cls}`,
      _apiJob: job,                         /* back-reference for activateSearchResult */
    }));
  }
  /* DOM mode: static / demo rows */
  if (!jobsBody) return [];
  return Array.from(jobsBody.querySelectorAll('tr:not(.jobs-empty-row)')).map(row => ({
    row,
    company:  (row.querySelector('.co-cell__name')?.dataset.original    ?? row.querySelector('.co-cell__name')?.textContent    ?? '').trim(),
    logoSrc:  row.querySelector('.co-cell__logo')?.src  ?? '',
    logoAlt:  row.querySelector('.co-cell__logo')?.alt  ?? '',
    role:     (row.querySelector('.role-cell__title')?.dataset.original ?? row.querySelector('.role-cell__title')?.textContent ?? '').trim(),
    dept:     (row.querySelector('.role-cell__dept')?.dataset.original  ?? row.querySelector('.role-cell__dept')?.textContent  ?? '').trim(),
    location: (row.querySelector('.loc-cell')?.textContent ?? '').trim(),
    type:     (row.querySelector('.type-badge')?.textContent ?? '').trim(),
    typeCls:  row.querySelector('.type-badge')?.className ?? '',
  }));
}

/* Scroll to a matching job and play the flash animation.
   In API mode the result comes from the full dataset — navigate to
   that job's page in the table rather than scrolling to a DOM row. */
function activateSearchResult(job) {
  closeSearchOverlay();
  navSearch.value = '';
  searchClear.hidden = true;
  if (searchKbd) searchKbd.style.display = '';

  /* API mode — filter to just this job and re-render */
  if (typeof apiLoaded !== 'undefined' && apiLoaded && job._apiJob) {
    if (jobsFilterInput) jobsFilterInput.value = '';
    filteredJobs = [job._apiJob];
    renderApiPage(1);
    document.querySelector('.jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      const first = jobsBody?.querySelector('tr');
      if (first) {
        first.classList.add('jobs-row--flash');
        first.addEventListener('animationend', () => first.classList.remove('jobs-row--flash'), { once: true });
      }
    }, 350);
    return;
  }

  /* DOM mode — original behaviour */
  if (job.row?.style.display === 'none') {
    if (jobsFilterInput) { jobsFilterInput.value = ''; runJobsFilter(''); }
  }
  job.row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  job.row?.classList.add('jobs-row--flash');
  job.row?.addEventListener('animationend', () =>
    job.row.classList.remove('jobs-row--flash'), { once: true }
  );
}

/* Build and display the overlay for the given query string */
function renderSearchOverlay(q) {
  if (!searchOverlay) return;
  if (!q) { closeSearchOverlay(); return; }

  const ql      = q.toLowerCase();
  const jobs    = getJobRows();
  const matches = jobs.filter(j =>
    [j.company, j.role, j.dept, j.location, j.type].some(t => t.toLowerCase().includes(ql))
  );
  const shown = matches.slice(0, 5); /* cap visible results at 5 */

  /* ---- Empty state ---- */
  if (matches.length === 0) {
    searchOverlay.innerHTML = `
      <div class="search-overlay__empty">
        <span class="material-icons">search_off</span>
        No results for "<strong>${escapeHtml(q)}</strong>"
      </div>`;
    openSearchOverlay();
    return;
  }

  /* ---- Result items ---- */
  const items = shown.map((j, i) => `
    <div class="search-result" role="option" data-idx="${i}">
      <img class="search-result__logo" src="${escapeHtml(j.logoSrc)}" alt="${escapeHtml(j.logoAlt)}">
      <div class="search-result__info">
        <span class="search-result__role">${hlText(j.role, q)}</span>
        <span class="search-result__meta">${hlText(j.company, q)} &middot; ${escapeHtml(j.location)}</span>
      </div>
      <span class="${escapeHtml(j.typeCls)}">${escapeHtml(j.type)}</span>
    </div>`).join('');

  /* ---- "See all" footer (only when results are truncated) ---- */
  const footer = matches.length > 5 ? `
    <div class="search-overlay__footer">
      <button class="search-overlay__see-all" id="seeAllResults">
        See all ${matches.length} results
        <span class="material-icons">arrow_forward</span>
      </button>
    </div>` : '';

  searchOverlay.innerHTML = `
    <div class="search-overlay__head">
      <span class="search-overlay__label">Jobs</span>
      <span class="search-overlay__count">${matches.length} found</span>
    </div>
    <div class="search-overlay__list">${items}</div>
    ${footer}`;

  openSearchOverlay();
  searchFocusIdx = -1;

  /* Use mousedown so the handler fires before the input loses focus */
  searchOverlay.querySelectorAll('.search-result').forEach((el, i) => {
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      activateSearchResult(shown[i]);
    });
  });

  /* "See all" — sync the jobs table filter and scroll to it */
  document.getElementById('seeAllResults')?.addEventListener('mousedown', e => {
    e.preventDefault();
    closeSearchOverlay();
    navSearch.value = '';
    searchClear.hidden = true;
    if (searchKbd) searchKbd.style.display = '';
    if (typeof apiLoaded !== 'undefined' && apiLoaded) {
      /* API mode: pipe query into the array filter */
      if (jobsFilterInput) jobsFilterInput.value = q;
      filteredJobs = apiJobs.filter(j =>
        [j.company, j.role, j.dept, j.location, j.type.label].some(t => t.toLowerCase().includes(ql))
      );
      renderApiPage(1);
    } else {
      if (jobsFilterInput) { jobsFilterInput.value = q; runJobsFilter(ql); }
    }
    document.querySelector('.jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}


/* ============================================================
   JOBS API
   Fetches live listings from Remotive (free, no key required),
   normalises the data, and drives the table, pagination, filter,
   and sort entirely from the JS array rather than from the DOM.
   ============================================================ */

const JOBS_API  = 'https://remotive.com/api/remote-jobs?category=software-dev&limit=50';
const PER_PAGE  = 8;

/* Shared mutable state — all functions below close over these */
let apiLoaded    = false;
let apiJobs      = [];   /* full normalised dataset from the API */
let filteredJobs = [];   /* subset after applying the live filter */
let currentPage  = 1;

/* Capture static demo HTML so the error state can restore it */
const DEMO_HTML = jobsBody ? jobsBody.innerHTML : '';

/* ---- Lookup tables ---- */
const TYPE_MAP = {
  full_time: { label: 'Full-time', cls: 'type-badge--full'   },
  contract:  { label: 'Contract',  cls: 'type-badge--onsite' },
  part_time: { label: 'Part-time', cls: 'type-badge--hybrid' },
  freelance: { label: 'Freelance', cls: 'type-badge--hybrid' },
};

const DEPT_MAP = {
  'software-dev': 'Engineering', design: 'Design', marketing: 'Marketing',
  'customer-support': 'Support', devops: 'Infrastructure', product: 'Product',
  data: 'Data', sales: 'Sales', writing: 'Content',
};

/* ---- Normalise one raw Remotive job object ---- */
function normalizeJob(r) {
  const type    = TYPE_MAP[r.job_type] ?? { label: 'Remote', cls: 'type-badge--remote' };
  const salary  = r.salary?.trim() ?? '';
  const salaryN = salary ? (parseFloat(salary.replace(/[^\d.]/g, '')) || 0) : 0;
  const logoUrl = r.company_logo_url?.trim() ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(r.company_name)}&background=6366f1&color=fff&size=36&bold=true`;
  return {
    id: r.id, company: r.company_name || 'Unknown', logoUrl,
    role: r.title || 'Open Position',
    dept: DEPT_MAP[r.category] ?? 'Engineering',
    location: r.candidate_required_location || 'Remote',
    salary, salaryN, type, url: r.url || '#',
  };
}

/* ---- Build one <tr> HTML string from a normalised job ---- */
function buildRow(job) {
  const locIcon  = /remote|worldwide|anywhere/i.test(job.location) ? 'public' : 'location_on';
  const salHtml  = job.salary
    ? `<span class="salary">${escapeHtml(job.salary)}</span>`
    : `<span class="salary--na">—</span>`;
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=6366f1&color=fff&size=36&bold=true`;

  return `<tr>
    <td data-label="Company"><div class="co-cell">
      <img src="${escapeHtml(job.logoUrl)}" alt="${escapeHtml(job.company)}"
           class="co-cell__logo" onerror="this.onerror=null;this.src='${fallback}'">
      <span class="co-cell__name">${escapeHtml(job.company)}</span>
    </div></td>
    <td data-label="Role"><div class="role-cell">
      <span class="role-cell__title">${escapeHtml(job.role)}</span>
      <span class="role-cell__dept">${escapeHtml(job.dept)}</span>
    </div></td>
    <td data-label="Location"><div class="loc-cell">
      <span class="material-icons">${locIcon}</span>${escapeHtml(job.location)}
    </div></td>
    <td data-label="Salary" data-value="${job.salaryN}">${salHtml}</td>
    <td data-label="Type">
      <span class="type-badge ${escapeHtml(job.type.cls)}">${escapeHtml(job.type.label)}</span>
    </td>
    <td><button class="apply-btn" data-url="${escapeHtml(job.url)}">
      <span class="material-icons">open_in_new</span>Apply
    </button></td>
  </tr>`;
}

/* ---- Shimmer skeleton while fetching ---- */
function showSkeleton() {
  if (!jobsBody) return;
  jobsBody.innerHTML = Array.from({ length: PER_PAGE }, () => `
    <tr class="jobs-skeleton">
      <td><div class="sk-cell">
        <div class="shimmer sk-logo"></div>
        <div class="shimmer sk-text" style="width:72px"></div>
      </div></td>
      <td>
        <div class="shimmer sk-text" style="width:110px"></div>
        <div class="shimmer sk-text" style="width:60px;margin-top:5px"></div>
      </td>
      <td><div class="shimmer sk-text" style="width:96px"></div></td>
      <td><div class="shimmer sk-text" style="width:84px"></div></td>
      <td><div class="shimmer sk-badge"></div></td>
      <td><div class="shimmer sk-btn"></div></td>
    </tr>`).join('');
}

/* ---- Error card with Retry / Demo fallback ---- */
function showFetchError(msg) {
  if (!jobsBody) return;
  jobsBody.innerHTML = `<tr><td colspan="6"><div class="fetch-error">
    <span class="material-icons fetch-error__icon">cloud_off</span>
    <p class="fetch-error__title">Could not load live jobs</p>
    <p class="fetch-error__msg">${escapeHtml(msg)}</p>
    <div class="fetch-error__btns">
      <button class="btn btn--primary btn--sm" id="retryBtn">
        <span class="material-icons">refresh</span>Retry
      </button>
      <button class="btn btn--ghost btn--sm" id="demoBtn">Load demo data</button>
    </div>
  </div></td></tr>`;

  document.getElementById('retryBtn')?.addEventListener('click', initJobsFetch);
  document.getElementById('demoBtn')?.addEventListener('click', () => {
    apiLoaded = false; apiJobs = []; filteredJobs = [];
    if (jobsBody) jobsBody.innerHTML = DEMO_HTML;
    if (jobsResultCount) jobsResultCount.textContent = '148 positions';
    restoreStaticPagination();
  });
}

/* ---- Render one page of filteredJobs into the tbody ---- */
function renderApiPage(page) {
  if (!jobsBody) return;
  currentPage      = page;
  const q          = jobsFilterInput?.value.trim() ?? '';
  const total      = filteredJobs.length;
  const start      = (page - 1) * PER_PAGE;
  const slice      = filteredJobs.slice(start, start + PER_PAGE);

  if (!slice.length) {
    jobsBody.innerHTML = `<tr><td colspan="6"><div class="jobs-table__empty">
      <span class="material-icons">search_off</span>
      ${q ? `No jobs match "<strong>${escapeHtml(q)}</strong>"` : 'No jobs available'}
    </div></td></tr>`;
    buildPagination(page, 0, 0);
    if (jobsResultCount) jobsResultCount.textContent = q ? '0 results' : '0 positions';
    return;
  }

  jobsBody.innerHTML = slice.map(buildRow).join('');

  /* Re-apply text highlights when a filter query is active */
  if (q) {
    jobsBody.querySelectorAll('.co-cell__name, .role-cell__title, .role-cell__dept, .type-badge')
      .forEach(el => applyHighlight(el, q));
  }

  buildPagination(page, Math.ceil(total / PER_PAGE), total);
  if (jobsResultCount) {
    jobsResultCount.textContent = q
      ? `${total} result${total !== 1 ? 's' : ''}`
      : `${apiJobs.length} positions`;
  }

  // Restore applied state for any jobs previously saved in Firestore
  window._hub?.refreshApplied();
}

/* ---- Dynamic pagination footer ---- */
function buildPagination(page, totalPages, totalJobs) {
  const infoEl = document.getElementById('jobsPageInfo');
  const btnsEl = document.getElementById('jobsPageBtns');
  if (!infoEl || !btnsEl) return;

  if (!totalJobs) {
    infoEl.textContent = 'No positions found';
    btnsEl.innerHTML   = '';
    return;
  }

  const s = (page - 1) * PER_PAGE + 1;
  const e = Math.min(page * PER_PAGE, totalJobs);
  infoEl.textContent = `Showing ${s}–${e} of ${totalJobs} positions`;

  /* Build a sliding window of at most 5 page numbers */
  const size  = 5;
  const half  = Math.floor(size / 2);
  const rStart = Math.max(1, Math.min(page - half, totalPages - size + 1));
  const rEnd   = Math.min(totalPages, rStart + size - 1);
  const range  = Array.from({ length: rEnd - rStart + 1 }, (_, i) => rStart + i);

  const pageBtn = (p, label, active = false, disabled = false, action = '') =>
    `<button class="page-btn${active ? ' page-btn--active' : ''}"
       ${disabled ? 'disabled' : ''}
       ${action ? `data-action="${action}"` : `data-page="${p}"`}>
       ${label}
     </button>`;

  const parts = [];
  parts.push(pageBtn(0, '<span class="material-icons">chevron_left</span>', false, page <= 1, 'prev'));
  if (range[0] > 1)                    parts.push(pageBtn(1, '1'));
  if (range[0] > 2)                    parts.push('<span class="page-dots">···</span>');
  range.forEach(p =>                   parts.push(pageBtn(p, p, p === page)));
  if (range.at(-1) < totalPages - 1)  parts.push('<span class="page-dots">···</span>');
  if (range.at(-1) < totalPages)       parts.push(pageBtn(totalPages, totalPages));
  parts.push(pageBtn(0, '<span class="material-icons">chevron_right</span>', false, page >= totalPages, 'next'));

  btnsEl.innerHTML = parts.join('');
  btnsEl.onclick = evt => {
    const b = evt.target.closest('[data-page],[data-action]');
    if (!b || b.disabled) return;
    if      (b.dataset.action === 'prev') renderApiPage(currentPage - 1);
    else if (b.dataset.action === 'next') renderApiPage(currentPage + 1);
    else                                  renderApiPage(parseInt(b.dataset.page));
  };
}

/* ---- Restore the static cosmetic pagination for demo mode ---- */
function restoreStaticPagination() {
  const infoEl = document.getElementById('jobsPageInfo');
  const btnsEl = document.getElementById('jobsPageBtns');
  if (infoEl) infoEl.textContent = 'Showing 1–8 of 148 positions';
  if (btnsEl) btnsEl.innerHTML   = `
    <button class="page-btn" disabled aria-label="Previous page">
      <span class="material-icons">chevron_left</span>
    </button>
    <button class="page-btn page-btn--active">1</button>
    <button class="page-btn">2</button>
    <button class="page-btn">3</button>
    <span class="page-dots">···</span>
    <button class="page-btn">19</button>
    <button class="page-btn" aria-label="Next page">
      <span class="material-icons">chevron_right</span>
    </button>`;
}

/* ---- Wire the filter input to array-based filtering in API mode ---- */
if (jobsFilterInput) {
  jobsFilterInput.addEventListener('input', () => {
    if (!apiLoaded) return; /* DOM mode is handled by the earlier listener */
    const q = jobsFilterInput.value.toLowerCase().trim();
    filteredJobs = q
      ? apiJobs.filter(j =>
          [j.company, j.role, j.dept, j.location, j.type.label].some(t => t.toLowerCase().includes(q)))
      : [...apiJobs];
    renderApiPage(1);
  });
}

/* ---- Wire sort headers to array sort in API mode ---- */
(function wireApiSort() {
  const sortState = { col: -1, dir: 1 };
  const KEYS      = { 0: 'company', 1: 'role', 3: 'salaryN' };

  document.querySelectorAll('.jobs-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      if (!apiLoaded) return;
      const col = parseInt(th.dataset.sort, 10);
      sortState.dir = sortState.col === col ? -sortState.dir : 1;
      sortState.col = col;

      document.querySelectorAll('.jobs-table th[data-sort]').forEach(h => {
        const icon = h.querySelector('.sort-icon');
        if (h === th) { icon.textContent = sortState.dir === 1 ? 'arrow_upward' : 'arrow_downward'; h.classList.add('th--sorted'); }
        else          { icon.textContent = 'unfold_more'; h.classList.remove('th--sorted'); }
      });

      const key = KEYS[col] ?? 'company';
      filteredJobs.sort((a, b) => {
        const av = a[key] ?? '', bv = b[key] ?? '';
        return (typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))) * sortState.dir;
      });
      renderApiPage(1);
    });
  });
})();

/* ---- Show the "● Live" indicator badge in the toolbar ---- */
function showApiIndicator() {
  const left = document.querySelector('.jobs-toolbar__left');
  if (!left || left.querySelector('.api-indicator')) return;
  const badge = document.createElement('span');
  badge.className = 'api-indicator';
  badge.innerHTML = '<span class="api-indicator__dot"></span>Live';
  left.appendChild(badge);
}

/* ---- Main entry point: fetch from the API and populate the table ---- */
async function initJobsFetch() {
  if (!jobsBody) return;
  showSkeleton();
  if (jobsResultCount) jobsResultCount.textContent = 'Loading…';

  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 10_000);
    const res  = await fetch(JOBS_API, { signal: ctrl.signal });
    clearTimeout(tid);

    if (!res.ok) throw new Error(`API responded with ${res.status} ${res.statusText}`);

    const data = await res.json();
    const raw  = data.jobs ?? [];
    if (!raw.length) throw new Error('The API returned no jobs.');

    apiJobs      = raw.map(normalizeJob);
    filteredJobs = [...apiJobs];
    apiLoaded    = true;

    renderApiPage(1);
    showApiIndicator();

  } catch (err) {
    const msg = err.name === 'AbortError'
      ? 'Request timed out after 10 seconds. Check your connection.'
      : err.message;
    showFetchError(msg);
    if (jobsResultCount) jobsResultCount.textContent = 'Unavailable';
  }
}

/* Kick off the initial fetch as soon as the page loads */
initJobsFetch();
