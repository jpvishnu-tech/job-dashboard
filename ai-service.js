/* ============================================================
   ai-service.js
   AI Resume Analysis — orchestrates PDF text extraction,
   the /api/analyze-resume Vercel function, UI rendering,
   and Firestore history persistence.

   Data flow:
     User clicks "Analyze"
       → getResumeText()  reads URL from Firestore, parses PDF
       → callAPI()        proxies to OpenAI via Vercel function
       → renderAnalysis() / renderMatch()  writes HTML into result panels
       → saveHistory()    stores result in users/{uid}/ai-analyses
   ============================================================ */

import { initializeApp, getApps, getApp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, getDoc, addDoc, collection, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig }      from './firebase-config.js';
import { extractTextFromPDF }  from './resume-parser.js';

const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Per-session text cache (invalidates when the stored URL changes) ──

let _cachedUrl  = null;
let _cachedText = null;

// ── Tiny DOM helpers ───────────────────────────────────────────────

const qs   = sel => document.querySelector(sel);
const show = el  => { if (el) el.hidden = false; };
const hide = el  => { if (el) el.hidden = true;  };

function setBusy(btnId, loaderId, busy) {
  const btn = qs(`#${btnId}`);
  const ldr = qs(`#${loaderId}`);
  if (btn) btn.disabled = busy;
  if (ldr) ldr.hidden   = !busy;
}

// ── Score helpers ──────────────────────────────────────────────────

function scoreColor(n) {
  if (n >= 75) return 'var(--color-green)';
  if (n >= 50) return 'var(--color-primary)';
  if (n >= 30) return 'var(--color-amber)';
  return 'var(--color-red)';
}

function scoreLabel(n) {
  if (n >= 80) return 'Excellent';
  if (n >= 65) return 'Good';
  if (n >= 50) return 'Fair';
  if (n >= 30) return 'Needs Work';
  return 'Poor';
}

// ── Safe HTML escaping ─────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── HTML builders ──────────────────────────────────────────────────

function scoreRingHTML(score, label) {
  // SVG circle: r=40, circumference = 2π×40 ≈ 251.2
  const offset = (251.2 - 251.2 * Math.min(100, Math.max(0, score)) / 100).toFixed(1);
  const color  = scoreColor(score);
  return `
    <div class="ai-score-ring">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle class="ai-score-ring__bg"   cx="50" cy="50" r="40"/>
        <circle class="ai-score-ring__fill" cx="50" cy="50" r="40"
          transform="rotate(-90 50 50)"
          style="stroke-dashoffset:${offset};stroke:${color}"/>
      </svg>
      <div class="ai-score-ring__inner">
        <span class="ai-score-ring__value">${score}</span>
        <span class="ai-score-ring__lbl">${esc(label)}</span>
      </div>
    </div>`;
}

function listHTML(items, icon = 'arrow_forward') {
  if (!items?.length) return '<li class="ai-list__empty">None identified</li>';
  return items
    .map(item => `<li>
        <span class="material-icons ai-list__icon">${icon}</span>
        ${esc(item)}
      </li>`)
    .join('');
}

function tagCloud(items, cls = '') {
  if (!items?.length) return '<span class="ai-list__empty">None</span>';
  return items.map(t => `<span class="ai-tag ${cls}">${esc(t)}</span>`).join('');
}

function subScoreHTML(label, score) {
  return `
    <div class="ai-sub-score">
      <span class="ai-sub-score__label">${esc(label)}</span>
      <div class="ai-sub-score__bar-wrap">
        <div class="ai-sub-score__bar"
          style="width:${score ?? 0}%;background:${scoreColor(score ?? 0)}"></div>
      </div>
      <span class="ai-sub-score__val">${score ?? 0}</span>
    </div>`;
}

// ── Firestore: read resume URL ─────────────────────────────────────

async function getResumeUrl(uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'resume', 'current'));
  if (!snap.exists()) {
    throw new Error('No resume found. Please upload your PDF resume above first.');
  }
  const url = snap.data()?.url;
  if (!url) throw new Error('Resume URL is missing. Please re-upload your resume.');
  return url;
}

// ── Firestore: save analysis history ──────────────────────────────

async function saveHistory(uid, payload) {
  try {
    await addDoc(collection(db, 'users', uid, 'ai-analyses'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[ai-service] history save failed:', err.message);
  }
}

// ── Resume text (URL-keyed cache) ──────────────────────────────────

async function getResumeText(uid) {
  const url = await getResumeUrl(uid);

  // Cache hit: same URL means same PDF
  if (url === _cachedUrl && _cachedText) return _cachedText;

  _cachedUrl  = url;
  _cachedText = null;

  const text = await extractTextFromPDF(url);

  if (!text || text.length < 100) {
    throw new Error(
      'Extracted text is too short. ' +
      'Ensure your resume is a text-based PDF (not a scanned image).'
    );
  }

  _cachedText = text;
  return text;
}

// ── API proxy call ─────────────────────────────────────────────────

async function callAPI(payload) {
  const res = await fetch('/api/analyze-resume', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Analysis failed. Please try again.');
  return data;
}

// ── Render: general analysis ───────────────────────────────────────

function renderAnalysis(data) {
  const panel = qs('#aiAnalysisResult');
  if (!panel) return;

  const score = data.atsScore ?? 0;
  const color = scoreColor(score);

  panel.innerHTML = `
    <div class="ai-result-header">
      <h3 class="ai-result-title">
        <span class="material-icons">auto_awesome</span>
        AI Resume Analysis
      </h3>
    </div>

    <div class="ai-score-row">
      ${scoreRingHTML(score, 'ATS Score')}
      <div class="ai-score-meta">
        <div class="ai-score-grade" style="color:${color}">${scoreLabel(score)}</div>
        <p class="ai-score-feedback">${esc(data.overallFeedback)}</p>
        <div class="ai-sub-scores">
          ${subScoreHTML('Formatting', data.formattingScore)}
          ${subScoreHTML('Content',    data.contentScore)}
        </div>
      </div>
    </div>

    <div class="ai-divider"></div>

    <div class="ai-content-grid">
      <div class="ai-inner-card ai-inner-card--green">
        <h4 class="ai-inner-card__title">
          <span class="material-icons">verified</span> Strengths
        </h4>
        <ul class="ai-list">${listHTML(data.strengths, 'check_circle')}</ul>
      </div>
      <div class="ai-inner-card ai-inner-card--red">
        <h4 class="ai-inner-card__title">
          <span class="material-icons">warning</span> Weaknesses
        </h4>
        <ul class="ai-list">${listHTML(data.weaknesses, 'cancel')}</ul>
      </div>
    </div>

    <div class="ai-inner-card" style="margin-bottom:14px">
      <h4 class="ai-inner-card__title">
        <span class="material-icons">tips_and_updates</span> Recommendations
      </h4>
      <ul class="ai-list">${listHTML(data.recommendations, 'arrow_forward')}</ul>
    </div>

    ${data.skillsFound?.length ? `
    <div class="ai-tags-row">
      <span class="ai-tags-label">Skills Found:</span>
      ${tagCloud(data.skillsFound)}
    </div>` : ''}

    ${data.missingElements?.length ? `
    <div class="ai-tags-row">
      <span class="ai-tags-label">Missing:</span>
      ${tagCloud(data.missingElements, 'ai-tag--miss')}
    </div>` : ''}
  `;

  show(panel);
}

// ── Render: job match ──────────────────────────────────────────────

function renderMatch(data) {
  const panel = qs('#aiMatchResult');
  if (!panel) return;

  const score = data.matchScore ?? 0;
  const color = scoreColor(score);

  panel.innerHTML = `
    <div class="ai-result-header">
      <h3 class="ai-result-title">
        <span class="material-icons">compare_arrows</span>
        Job Match Analysis
      </h3>
    </div>

    <div class="ai-score-row">
      ${scoreRingHTML(score, 'Match %')}
      <div class="ai-score-meta">
        <div class="ai-score-grade" style="color:${color}">${scoreLabel(score)} Match</div>
        <p class="ai-score-feedback">${esc(data.matchAssessment)}</p>
      </div>
    </div>

    <div class="ai-divider"></div>

    <div class="ai-content-grid">
      <div class="ai-inner-card ai-inner-card--green">
        <h4 class="ai-inner-card__title">
          <span class="material-icons">verified</span> Matching Keywords
        </h4>
        <div class="ai-keyword-wrap">${tagCloud(data.matchingKeywords)}</div>
      </div>
      <div class="ai-inner-card ai-inner-card--red">
        <h4 class="ai-inner-card__title">
          <span class="material-icons">search_off</span> Missing Keywords
        </h4>
        <div class="ai-keyword-wrap">${tagCloud(data.missingKeywords, 'ai-tag--miss')}</div>
      </div>
    </div>

    ${data.qualificationGaps?.length ? `
    <div class="ai-inner-card ai-inner-card--amber" style="margin-bottom:14px">
      <h4 class="ai-inner-card__title">
        <span class="material-icons">report_problem</span> Qualification Gaps
      </h4>
      <ul class="ai-list">${listHTML(data.qualificationGaps, 'error_outline')}</ul>
    </div>` : ''}

    <div class="ai-inner-card" style="margin-bottom:14px">
      <h4 class="ai-inner-card__title">
        <span class="material-icons">tips_and_updates</span> How to Tailor This Resume
      </h4>
      <ul class="ai-list">${listHTML(data.tailoringTips, 'arrow_forward')}</ul>
    </div>

    ${data.recommendedSkills?.length ? `
    <div class="ai-tags-row">
      <span class="ai-tags-label">Skills to Add:</span>
      ${tagCloud(data.recommendedSkills, 'ai-tag--skill')}
    </div>` : ''}
  `;

  show(panel);
}

// ── Click handlers ─────────────────────────────────────────────────

async function handleAnalyze() {
  const user = auth.currentUser;
  if (!user) return;

  const errEl = qs('#aiAnalyzeError');
  hide(errEl);
  hide(qs('#aiAnalysisResult'));
  setBusy('aiAnalyzeBtn', 'aiAnalyzeLoader', true);

  try {
    const resumeText = await getResumeText(user.uid);
    const data       = await callAPI({ resumeText, mode: 'analyze' });
    renderAnalysis(data);
    saveHistory(user.uid, {
      type:     'analyze',
      atsScore: data.atsScore ?? null,
      result:   data,
    });
  } catch (err) {
    console.warn('[ai-service] analyze error:', err.message);
    if (errEl) { errEl.textContent = err.message; show(errEl); }
  } finally {
    setBusy('aiAnalyzeBtn', 'aiAnalyzeLoader', false);
  }
}

async function handleMatch() {
  const user = auth.currentUser;
  if (!user) return;

  const errEl = qs('#aiMatchError');
  const jd    = qs('#aiJobDesc')?.value.trim() ?? '';

  hide(errEl);
  hide(qs('#aiMatchResult'));

  if (jd.length < 50) {
    if (errEl) {
      errEl.textContent = 'Please paste a complete job description (at least a few sentences).';
      show(errEl);
    }
    return;
  }

  setBusy('aiMatchBtn', 'aiMatchLoader', true);

  try {
    const resumeText = await getResumeText(user.uid);
    const data       = await callAPI({ resumeText, jobDescription: jd, mode: 'match' });
    renderMatch(data);
    saveHistory(user.uid, {
      type:       'match',
      matchScore: data.matchScore ?? null,
      result:     data,
    });
  } catch (err) {
    console.warn('[ai-service] match error:', err.message);
    if (errEl) { errEl.textContent = err.message; show(errEl); }
  } finally {
    setBusy('aiMatchBtn', 'aiMatchLoader', false);
  }
}

// ── Init ───────────────────────────────────────────────────────────

function init() {
  qs('#aiAnalyzeBtn')?.addEventListener('click', handleAnalyze);
  qs('#aiMatchBtn')  ?.addEventListener('click', handleMatch);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
