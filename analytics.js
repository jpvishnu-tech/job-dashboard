/* ============================================================
   analytics.js
   Real-time Chart.js analytics powered by Firestore data.

   Data flow:
     auth-guard.js  →  onSnapshot  →  dispatches 'firestore:applications'
     analytics.js   →  listens     →  redraws charts + updates insight tiles

   Two charts:
     1. Monthly stacked bar  — applications per month, coloured by status
     2. Status doughnut      — share of each status across all apps
   ============================================================ */

// ── Module state ──────────────────────────────────────────────

let _apps         = [];
let monthlyChart  = null;
let statusChart   = null;
let chartsReady   = false;

// ── Colour palette (matches CSS variables) ────────────────────

const PALETTE = {
  pending:   { bg: 'rgba(251,191,36,0.75)',  border: '#f59e0b' },
  interview: { bg: 'rgba(99,102,241,0.75)',  border: '#6366f1' },
  offer:     { bg: 'rgba(34,197,94,0.75)',   border: '#22c55e' },
  rejected:  { bg: 'rgba(239,68,68,0.75)',   border: '#ef4444' },
};

const STATUS_ORDER = ['pending', 'interview', 'offer', 'rejected'];

// ── Month helpers ─────────────────────────────────────────────

function lastNMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
    });
  }
  return out;
}

function appMonthKey(app) {
  const ts = app.appliedAt;
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Chart data builders ───────────────────────────────────────

function buildMonthlyData(apps) {
  const months = lastNMonths(6);

  // Initialize zero-filled buckets for every status
  const buckets = Object.fromEntries(
    months.map(m => [m.key, Object.fromEntries(STATUS_ORDER.map(s => [s, 0]))])
  );

  apps.forEach(app => {
    const key    = appMonthKey(app);
    const status = STATUS_ORDER.includes(app.status) ? app.status : 'pending';
    if (key && buckets[key]) buckets[key][status]++;
  });

  return {
    labels: months.map(m => m.label),
    datasets: STATUS_ORDER.map(s => ({
      label:           s.charAt(0).toUpperCase() + s.slice(1),
      data:            months.map(m => buckets[m.key][s]),
      backgroundColor: PALETTE[s].bg,
      borderColor:     PALETTE[s].border,
      borderWidth:     1,
      borderRadius:    3,
      borderSkipped:   false,
    })),
  };
}

function buildStatusData(apps) {
  const counts = STATUS_ORDER.map(s => apps.filter(a => a.status === s).length);
  return {
    labels:   STATUS_ORDER.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [{
      data:            counts,
      backgroundColor: STATUS_ORDER.map(s => PALETTE[s].bg),
      borderColor:     STATUS_ORDER.map(s => PALETTE[s].border),
      borderWidth:     2,
      hoverOffset:     10,
    }],
  };
}

// ── Dynamic chart colours (dark / light mode aware) ──────────

function themeTokens() {
  const dark = document.documentElement.hasAttribute('data-theme');
  return {
    text: dark ? '#94a3b8' : '#64748b',
    grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  };
}

// ── Skeleton ↔ canvas swap ────────────────────────────────────

function revealCanvas(skeletonId, canvasId) {
  const sk = document.getElementById(skeletonId);
  const cv = document.getElementById(canvasId);
  if (sk) sk.hidden = true;
  if (cv) cv.hidden = false;
}

function showEmptyState(bodyEl, message) {
  bodyEl.innerHTML = `
    <div class="chart-empty">
      <span class="material-icons">bar_chart</span>
      <p class="chart-empty__text">${message}</p>
    </div>`;
}

// ── Monthly bar chart ─────────────────────────────────────────

function createMonthlyChart(apps) {
  const canvas = document.getElementById('monthlyChart');
  if (!canvas) return;

  const body = canvas.closest('.chart-card__body');

  if (apps.length === 0) {
    document.getElementById('monthlyChartSkeleton')?.remove();
    showEmptyState(body, 'Apply to jobs and your monthly trend will appear here.');
    return;
  }

  revealCanvas('monthlyChartSkeleton', 'monthlyChart');

  const t = themeTokens();

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: buildMonthlyData(apps),
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction:         { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color:    t.text,
            boxWidth: 10,
            padding:  14,
            font:     { size: 11.5 },
          },
        },
        tooltip: {
          callbacks: {
            footer: items => {
              const total = items.reduce((s, i) => s + i.raw, 0);
              return `Total: ${total}`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks:   { color: t.text, font: { size: 11 } },
          grid:    { color: t.grid },
          border:  { color: t.grid },
        },
        y: {
          stacked:      true,
          beginAtZero:  true,
          ticks:        { color: t.text, precision: 0, font: { size: 11 } },
          grid:         { color: t.grid },
          border:       { color: t.grid },
        },
      },
      animation: { duration: 500, easing: 'easeOutQuart' },
    },
  });
}

// ── Status doughnut chart ─────────────────────────────────────

function createStatusChart(apps) {
  const canvas = document.getElementById('statusChart');
  if (!canvas) return;

  const body = canvas.closest('.chart-card__body');

  if (apps.length === 0) {
    document.getElementById('statusChartSkeleton')?.remove();
    showEmptyState(body, 'No applications yet — start applying to see the breakdown.');
    return;
  }

  revealCanvas('statusChartSkeleton', 'statusChart');

  const t = themeTokens();

  if (statusChart) statusChart.destroy();

  statusChart = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: buildStatusData(apps),
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      cutout:              '66%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color:    t.text,
            boxWidth: 10,
            padding:  14,
            font:     { size: 11.5 },
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const sum = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round(ctx.raw / sum * 100);
              return `  ${ctx.label}: ${ctx.raw}  (${pct}%)`;
            },
          },
        },
      },
      animation: { duration: 500, easing: 'easeOutQuart' },
    },
  });
}

// ── Update charts in place (smooth re-render on data change) ──

function updateCharts(apps) {
  if (!chartsReady || !monthlyChart || !statusChart) {
    // First data arrival — create both charts from scratch
    createMonthlyChart(apps);
    createStatusChart(apps);
    chartsReady = true;
    return;
  }

  // Subsequent updates: swap data in-place for a smooth transition
  if (apps.length === 0) return; // keep last render if all apps deleted

  const monthly = buildMonthlyData(apps);
  monthlyChart.data.labels   = monthly.labels;
  monthlyChart.data.datasets = monthly.datasets;
  monthlyChart.update('active');

  const status = buildStatusData(apps);
  statusChart.data.datasets[0].data = status.datasets[0].data;
  statusChart.update('active');
}

// ── Insight metric tiles ──────────────────────────────────────

function updateInsights(apps) {
  const total      = apps.length;
  const den        = total || 1;
  const interviews = apps.filter(a => a.status === 'interview').length;
  const offers     = apps.filter(a => a.status === 'offer').length;
  const rejected   = apps.filter(a => a.status === 'rejected').length;

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  // Insight strip (below charts)
  set('insightInterviewRate', total ? `${Math.round(interviews / den * 100)}%` : '—');
  set('insightOfferRate',     total ? `${Math.round(offers     / den * 100)}%` : '—');
  set('insightRejectionRate', total ? `${Math.round(rejected   / den * 100)}%` : '—');

  // "Applied this month" count
  const thisMonthKey = lastNMonths(1)[0].key;
  const thisMonth    = apps.filter(a => appMonthKey(a) === thisMonthKey).length;
  set('insightThisMonth', String(thisMonth));

  // ── Stat card dynamic meta text ───────────────────────────────

  // Month-over-month delta for the "Jobs Applied" badge
  const [prevKey, currKey] = lastNMonths(2).map(m => m.key);
  const currCount = apps.filter(a => appMonthKey(a) === currKey).length;
  const prevCount = apps.filter(a => appMonthKey(a) === prevKey).length;
  const delta     = currCount - prevCount;

  const totalBadge = document.getElementById('statTotalBadge');
  if (totalBadge) {
    const up = delta >= 0;
    totalBadge.className = `stat-card__badge stat-card__badge--${up ? 'up' : 'down'}`;
    totalBadge.innerHTML = `<span class="material-icons">${up ? 'arrow_upward' : 'arrow_downward'}</span>${Math.abs(delta)}`;
  }
  set('statTotalMeta', delta === 0
    ? 'Same as last month'
    : `${delta > 0 ? '+' : ''}${delta} vs last month`
  );

  // Rate badges (percentage of total for each status)
  const interviewPct = Math.round(interviews / den * 100);
  const pendingCount = apps.filter(a => a.status === 'pending').length;
  const pendingPct   = Math.round(pendingCount / den * 100);
  const rejectedPct  = Math.round(rejected     / den * 100);
  const offerPct     = Math.round(offers       / den * 100);

  const setBadge = (id, pct, preferUp) => {
    const el = document.getElementById(id);
    if (!el) return;
    const up = preferUp ? pct > 0 : pct === 0;
    el.className = `stat-card__badge stat-card__badge--${up ? 'up' : 'down'}`;
    el.innerHTML = `<span class="material-icons">${up ? 'arrow_upward' : 'arrow_downward'}</span>${pct}%`;
  };

  // Up = good for interviews and offers; down = good for rejected
  setBadge('statInterviewsBadge', interviewPct, true);
  setBadge('statPendingBadge',    pendingPct,   true);
  setBadge('statRejectedBadge',   rejectedPct,  false); // fewer rejections = green
  setBadge('statOffersBadge',     offerPct,     true);

  set('statInterviewsMeta', total ? `${interviewPct}% interview rate`     : 'No data yet');
  set('statPendingMeta',    total ? `${pendingPct}% awaiting response`    : 'No data yet');
  set('statRejectedMeta',   total ? `${rejectedPct}% rejection rate`      : 'No data yet');
  set('statOffersMeta',     total ? `${offerPct}% offer rate`             : 'No data yet');
}

// ── Dark-mode observer — redraw when theme toggles ────────────

const _themeObserver = new MutationObserver(() => {
  if (!chartsReady) return;
  // Destroy and rebuild so Chart.js picks up the new colour tokens
  chartsReady = false;
  monthlyChart?.destroy(); monthlyChart = null;
  statusChart?.destroy();  statusChart  = null;

  // Restore skeleton visibility so the swap animation runs again
  const ms = document.getElementById('monthlyChartSkeleton');
  const mc = document.getElementById('monthlyChart');
  const ss = document.getElementById('statusChartSkeleton');
  const sc = document.getElementById('statusChart');
  if (ms) { ms.hidden = false; } if (mc) { mc.hidden = true; }
  if (ss) { ss.hidden = false; } if (sc) { sc.hidden = true; }

  updateCharts(_apps);
});

_themeObserver.observe(document.documentElement, {
  attributes:      true,
  attributeFilter: ['data-theme'],
});

// ── Main event listener ───────────────────────────────────────

window.addEventListener('firestore:applications', e => {
  _apps = e.detail ?? [];
  updateCharts(_apps);
  updateInsights(_apps);
});
