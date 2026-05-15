import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getApplyQueue, prepareApplication, generateCoverLetter,
  getDrafts, updateDraft, submitDraft, deleteDraft,
} from '../../services/autoApply';
import './AutoApplyPage.css';

// ── Score helpers ──────────────────────────────────────────────
function clr(n) {
  if (n >= 75) return '#16a34a';
  if (n >= 55) return 'var(--color-primary)';
  if (n >= 35) return '#d97706';
  return '#dc2626';
}
function lbl(n) {
  if (n >= 85) return 'Excellent';
  if (n >= 70) return 'Strong';
  if (n >= 50) return 'Good';
  if (n >= 35) return 'Fair';
  return 'Weak';
}

const PRIORITY_META = {
  high:   { label: 'High Priority', color: '#dc2626', bg: '#fee2e2', icon: 'local_fire_department' },
  medium: { label: 'Medium',        color: '#d97706', bg: '#fef3c7', icon: 'trending_up' },
  low:    { label: 'Low',           color: '#2563eb', bg: '#eff6ff', icon: 'bookmark' },
};

const TONE_OPTIONS = [
  { value: 'professional',  label: 'Professional',  icon: 'business_center' },
  { value: 'enthusiastic',  label: 'Enthusiastic',  icon: 'celebration'     },
  { value: 'technical',     label: 'Technical',     icon: 'code'            },
  { value: 'concise',       label: 'Concise',       icon: 'compress'        },
];

// ── Shared sub-components ──────────────────────────────────────

function ScoreRing({ score, size = 72 }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - circ * Math.min(100, Math.max(0, score ?? 0)) / 100;
  const color = clr(score ?? 0);
  return (
    <div className="aa-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 72 72" width={size} height={size}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border-color,#e2e8f0)" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset .5s' }}
        />
      </svg>
      <div className="aa-ring__inner">
        <span className="aa-ring__val" style={{ color }}>{score ?? '–'}</span>
      </div>
    </div>
  );
}

function SalaryTag({ min, max }) {
  if (!min && !max) return null;
  const fmt = (n) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
  return <span className="aa-salary">{min ? fmt(min) : '?'} – {max ? fmt(max) : '?'}</span>;
}

function SkillPills({ skills, max = 4 }) {
  if (!skills?.length) return null;
  return (
    <>
      {skills.slice(0, max).map((s, i) => <span key={i} className="aa-skill-pill">{s}</span>)}
      {skills.length > max && <span className="aa-skill-pill aa-skill-pill--more">+{skills.length - max}</span>}
    </>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button className="aa-copy-btn" onClick={copy}>
      <span className="material-icons">{copied ? 'check' : 'content_copy'}</span>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── PrepareModal ───────────────────────────────────────────────

function PrepareModal({ item, onClose, onSubmitted, getToken }) {
  const [step,       setStep]       = useState(0); // 0=match 1=cover-letter 2=checklist
  const [loading,    setLoading]    = useState(false);
  const [draft,      setDraft]      = useState(null);
  const [matchDetail,setMatchDetail]= useState(null);
  const [error,      setError]      = useState('');
  const [tone,       setTone]       = useState('professional');
  const [regenLoading,setRegenLoading] = useState(false);
  const [notes,      setNotes]      = useState('');
  const [checklist,  setChecklist]  = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const job = item.job || item;

  // Load or prepare on mount
  useEffect(() => {
    async function prepare() {
      setLoading(true);
      setError('');
      try {
        const data = await prepareApplication(getToken, String(job._id), tone);
        setDraft(data.data.draft);
        setMatchDetail(data.data.matchDetail || null);
        setChecklist(data.data.draft?.checklist || []);
        setNotes(data.data.draft?.applicationNotes || '');
      } catch (err) {
        setError(err.message || 'Preparation failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    prepare();
  }, []);  // eslint-disable-line

  async function handleRegen() {
    if (!draft) return;
    setRegenLoading(true);
    try {
      const data = await generateCoverLetter(getToken, String(job._id), tone, String(draft._id));
      if (data.data.draft) setDraft(data.data.draft);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenLoading(false);
    }
  }

  async function saveChecklist(updated) {
    if (!draft) return;
    setChecklist(updated);
    try { await updateDraft(getToken, String(draft._id), { checklist: updated, applicationNotes: notes }); }
    catch { /* silent */ }
  }

  function toggleCheck(idx) {
    const updated = checklist.map((c, i) => i === idx ? { ...c, done: !c.done } : c);
    saveChecklist(updated);
  }

  async function handleSubmit() {
    if (!draft) return;
    setSubmitting(true);
    // Save notes first
    try { await updateDraft(getToken, String(draft._id), { applicationNotes: notes }); } catch { /* ok */ }
    try {
      await submitDraft(getToken, String(draft._id));
      setSubmitted(true);
      if (onSubmitted) onSubmitted(draft);
    } catch (err) {
      setError(err.message || 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleApplyExternal() {
    const url = draft?.jobSnapshot?.applyUrl || job.applyUrl || job.url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    handleSubmit();
  }

  const STEPS = ['Match Analysis', 'Cover Letter', 'Checklist & Apply'];

  return (
    <div className="aa-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="aa-modal">
        {/* Header */}
        <div className="aa-modal__head">
          <div>
            <h3 className="aa-modal__title">Prepare Application</h3>
            <p className="aa-modal__sub">
              {job.title} · <strong>{job.company}</strong>
            </p>
          </div>
          <button className="aa-modal__close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Step indicator */}
        <div className="aa-steps">
          {STEPS.map((s, i) => (
            <button key={i}
              className={`aa-step ${i === step ? 'aa-step--active' : ''} ${draft && i < step ? 'aa-step--done' : ''}`}
              onClick={() => draft && setStep(i)}
              disabled={!draft && i > 0}
            >
              <span className="aa-step__num">
                {draft && i < step ? <span className="material-icons" style={{ fontSize: 14 }}>check</span> : i + 1}
              </span>
              <span className="aa-step__label">{s}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="aa-modal__body">
          {loading && (
            <div className="aa-modal__loading">
              <div className="spinner" />
              <p>AI is preparing your application…<br /><small>Match analysis + cover letter generation</small></p>
            </div>
          )}

          {error && !loading && (
            <div className="aa-error">
              <span className="material-icons">error_outline</span>
              {error}
            </div>
          )}

          {/* Step 0: Match Analysis */}
          {!loading && draft && step === 0 && (
            <div className="aa-step-content">
              <div className="aa-match-header">
                <ScoreRing score={draft.matchScore} size={90} />
                <div className="aa-match-meta">
                  <div className="aa-match-grade" style={{ color: clr(draft.matchScore) }}>
                    {lbl(draft.matchScore)} Match
                    <span className="aa-priority-badge"
                      style={{ color: PRIORITY_META[draft.priority]?.color, background: PRIORITY_META[draft.priority]?.bg }}>
                      <span className="material-icons">{PRIORITY_META[draft.priority]?.icon}</span>
                      {PRIORITY_META[draft.priority]?.label}
                    </span>
                  </div>
                  {draft.matchReason && <p className="aa-match-reason">{draft.matchReason}</p>}
                </div>
              </div>

              {matchDetail && (
                <div className="aa-match-scores">
                  {[
                    { label: 'ATS Compatibility', val: matchDetail.atsCompatibility },
                    { label: 'Skill Overlap',     val: matchDetail.skillOverlap },
                    { label: 'Experience Fit',    val: matchDetail.experienceAlignment },
                  ].map(({ label, val }) => (
                    <div key={label} className="aa-mini-bar">
                      <span>{label}</span>
                      <div className="aa-mini-bar__track">
                        <div className="aa-mini-bar__fill" style={{ width: `${val ?? 0}%`, background: clr(val ?? 0) }} />
                      </div>
                      <span style={{ color: clr(val ?? 0), fontWeight: 700 }}>{val ?? '–'}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="aa-two-col">
                {draft.strengths?.length > 0 && (
                  <div className="aa-inner-card aa-inner-card--green">
                    <h4><span className="material-icons">verified</span> Strengths</h4>
                    <ul>{draft.strengths.slice(0, 4).map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {draft.skillGaps?.length > 0 && (
                  <div className="aa-inner-card aa-inner-card--red">
                    <h4><span className="material-icons">report_problem</span> Skill Gaps</h4>
                    <ul>{draft.skillGaps.slice(0, 4).map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
              </div>

              {matchDetail?.keywordAnalysis?.atsKeywordsMissing?.length > 0 && (
                <div className="aa-kw-section">
                  <span className="aa-kw-label">Keywords to Add to Resume:</span>
                  {matchDetail.keywordAnalysis.atsKeywordsMissing.slice(0, 8).map((k, i) => (
                    <span key={i} className="aa-kw-chip aa-kw-chip--miss">{k}</span>
                  ))}
                </div>
              )}

              {draft.aiRecommendations?.length > 0 && (
                <div className="aa-reco-card">
                  <h4><span className="material-icons">tips_and_updates</span> AI Recommendations</h4>
                  <ul>{draft.aiRecommendations.slice(0, 5).map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}

              {matchDetail?.resumeVersionAdvice && (
                <div className="aa-advice-card">
                  <span className="material-icons">description</span>
                  <p>{matchDetail.resumeVersionAdvice}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Cover Letter */}
          {!loading && draft && step === 1 && (
            <div className="aa-step-content">
              <div className="aa-cl-toolbar">
                <div className="aa-tone-pills">
                  {TONE_OPTIONS.map(t => (
                    <button key={t.value}
                      className={`aa-tone-pill ${tone === t.value ? 'aa-tone-pill--active' : ''}`}
                      onClick={() => setTone(t.value)}
                    >
                      <span className="material-icons">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="aa-cl-actions">
                  <CopyButton text={draft.coverLetter || ''} />
                  <button className="btn btn--secondary btn--sm" onClick={handleRegen} disabled={regenLoading}>
                    {regenLoading
                      ? <><div className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Rewriting…</>
                      : <><span className="material-icons">refresh</span> Regenerate</>
                    }
                  </button>
                </div>
              </div>
              <div className="aa-cl-version">
                Version {draft.coverLetterVersion} · Tone: <strong>{draft.coverLetterTone}</strong>
              </div>
              <div className="aa-cl-preview">
                <pre className="aa-cl-text">{draft.coverLetter || 'No cover letter generated yet.'}</pre>
              </div>
              {draft.jobSnapshot?.applyUrl && (
                <div className="aa-subject-hint">
                  <span className="material-icons">email</span>
                  <strong>Subject:</strong> Application: {draft.jobSnapshot.title} — {draft.jobSnapshot.company}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Checklist + Apply */}
          {!loading && draft && step === 2 && (
            <div className="aa-step-content">
              {checklist.length > 0 && (
                <div className="aa-checklist">
                  <h4 className="aa-checklist__title">
                    <span className="material-icons">checklist</span>
                    Application Checklist
                    <span className="aa-checklist__prog">
                      {checklist.filter(c => c.done).length}/{checklist.length}
                    </span>
                  </h4>
                  <div className="aa-checklist__progress">
                    <div className="aa-checklist__bar"
                      style={{ width: `${Math.round(checklist.filter(c => c.done).length / checklist.length * 100)}%` }} />
                  </div>
                  <div className="aa-checklist__items">
                    {['high', 'medium', 'low'].map(prio =>
                      checklist.filter(c => (c.priority || 'medium') === prio).map((c, i) => {
                        const idx = checklist.indexOf(c);
                        return (
                          <label key={idx} className={`aa-check-item ${c.done ? 'aa-check-item--done' : ''}`}>
                            <input type="checkbox" checked={c.done} onChange={() => toggleCheck(idx)} />
                            <span className="aa-check-item__text">{c.item}</span>
                            <span className={`aa-check-cat aa-check-cat--${c.category?.toLowerCase()}`}>
                              {c.category}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="aa-notes-group">
                <label className="aa-notes-label">Application Notes</label>
                <textarea
                  className="form-control aa-notes-textarea"
                  rows={3}
                  placeholder="Add personal notes, referral contact, deadline, custom questions…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {submitted ? (
                <div className="aa-submitted">
                  <span className="material-icons">check_circle</span>
                  <div>
                    <strong>Application submitted!</strong>
                    <p>Tracked in your Applications dashboard.</p>
                  </div>
                </div>
              ) : (
                <div className="aa-apply-actions">
                  {(draft.jobSnapshot?.applyUrl || job.applyUrl) ? (
                    <button className="btn btn--primary aa-apply-btn" onClick={handleApplyExternal} disabled={submitting}>
                      {submitting
                        ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Applying…</>
                        : <><span className="material-icons">open_in_new</span> Apply Externally & Track</>
                      }
                    </button>
                  ) : (
                    <button className="btn btn--primary aa-apply-btn" onClick={handleSubmit} disabled={submitting}>
                      {submitting
                        ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Saving…</>
                        : <><span className="material-icons">check</span> Mark as Applied</>
                      }
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        {!loading && draft && (
          <div className="aa-modal__footer">
            <button className="btn btn--secondary" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
              <span className="material-icons">arrow_back</span> Previous
            </button>
            <span className="aa-modal__step-lbl">{step + 1} / {STEPS.length}</span>
            <button className="btn btn--primary" onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1}>
              Next <span className="material-icons">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── JobRankCard ────────────────────────────────────────────────

function JobRankCard({ item, onPrepare }) {
  const job  = item.job;
  const pMeta = PRIORITY_META[item.priority] || PRIORITY_META.low;

  return (
    <div className={`aa-job-card aa-job-card--${item.priority}`}>
      {/* Priority badge */}
      <div className="aa-job-card__top">
        <span className="aa-priority" style={{ color: pMeta.color, background: pMeta.bg }}>
          <span className="material-icons">{pMeta.icon}</span>
          {pMeta.label}
        </span>
        {item.draft && (
          <span className="aa-draft-badge">
            <span className="material-icons">description</span>
            {item.draft.status === 'ready' ? 'Draft Ready' : 'Draft'}
            {item.draft.hasCoverLetter && ' · ✓ Cover Letter'}
          </span>
        )}
      </div>

      {/* Job info */}
      <div className="aa-job-card__body">
        <div className="aa-job-card__left">
          {job.companyLogo
            ? <img src={job.companyLogo} alt={job.company} className="aa-job-logo" />
            : <div className="aa-job-logo-placeholder">{job.company?.[0] || '?'}</div>
          }
          <div className="aa-job-info">
            <h4 className="aa-job-title">{job.title}</h4>
            <p className="aa-job-company">{job.company}</p>
            <div className="aa-job-meta">
              {job.location && (
                <span><span className="material-icons">location_on</span>{job.location}</span>
              )}
              {job.remote && (
                <span className="aa-remote-tag">Remote</span>
              )}
              {job.type && (
                <span className="aa-type-tag">{job.type}</span>
              )}
              <SalaryTag min={job.salaryMin} max={job.salaryMax} />
            </div>
          </div>
        </div>

        <div className="aa-job-card__score">
          <ScoreRing score={item.matchScore} size={70} />
          <span className="aa-job-card__score-lbl">{lbl(item.matchScore)}</span>
        </div>
      </div>

      {/* Skills */}
      {job.skills?.length > 0 && (
        <div className="aa-job-card__skills">
          <SkillPills skills={job.skills} max={5} />
        </div>
      )}

      {/* Skill gaps */}
      {item.skillGaps?.length > 0 && (
        <div className="aa-job-card__gaps">
          <span className="aa-gaps-label">Missing:</span>
          {item.skillGaps.slice(0, 3).map((g, i) => <span key={i} className="aa-gap-chip">{g}</span>)}
        </div>
      )}

      {/* Actions */}
      <div className="aa-job-card__actions">
        <button className="btn btn--primary btn--sm" onClick={() => onPrepare(item)}>
          <span className="material-icons">{item.draft ? 'edit_note' : 'auto_awesome'}</span>
          {item.draft ? 'View Draft' : 'Prepare Application'}
        </button>
        {job.applyUrl && (
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--sm">
            <span className="material-icons">open_in_new</span> View Job
          </a>
        )}
      </div>
    </div>
  );
}

// ── DraftCard ──────────────────────────────────────────────────

function DraftCard({ draft, onEdit, onDelete, onSubmit }) {
  const [deleting, setDeleting] = useState(false);
  const snap = draft.jobSnapshot || {};
  const job  = draft.job || {};
  const title   = snap.title   || job.title   || 'Unknown Role';
  const company = snap.company || job.company || 'Unknown Company';
  const prog    = draft.checklist?.length
    ? Math.round(draft.checklist.filter(c => c.done).length / draft.checklist.length * 100) : 0;

  async function handleDelete() {
    if (!confirm(`Delete draft for ${title} @ ${company}?`)) return;
    setDeleting(true);
    try { await onDelete(draft._id); } finally { setDeleting(false); }
  }

  return (
    <div className={`aa-draft-card aa-draft-card--${draft.status}`}>
      <div className="aa-draft-card__head">
        <div>
          <h4 className="aa-draft-card__title">{title}</h4>
          <p className="aa-draft-card__company">{company}</p>
        </div>
        <div className="aa-draft-card__badges">
          {draft.matchScore && <span className="aa-draft-score" style={{ color: clr(draft.matchScore) }}>{draft.matchScore}</span>}
          <span className={`aa-status-badge aa-status-badge--${draft.status}`}>{draft.status}</span>
        </div>
      </div>

      {draft.checklist?.length > 0 && (
        <div className="aa-draft-progress">
          <span>{prog}% complete</span>
          <div className="aa-draft-progress__bar">
            <div style={{ width: `${prog}%`, background: clr(prog) }} />
          </div>
        </div>
      )}

      {draft.coverLetter && (
        <p className="aa-draft-cl-preview">{draft.coverLetter.slice(0, 120)}…</p>
      )}

      <div className="aa-draft-card__actions">
        {draft.status !== 'submitted' && (
          <>
            <button className="btn btn--secondary btn--sm" onClick={() => onEdit(draft)}>
              <span className="material-icons">edit_note</span> Edit
            </button>
            <button className="btn btn--primary btn--sm" onClick={() => onSubmit(draft)}>
              <span className="material-icons">check</span> Submit
            </button>
          </>
        )}
        <button className="btn btn--danger btn--sm" onClick={handleDelete} disabled={deleting}>
          <span className="material-icons">delete</span>
        </button>
      </div>
    </div>
  );
}

// ── Stats Row ──────────────────────────────────────────────────

function StatsRow({ stats }) {
  return (
    <div className="aa-stats-row">
      <div className="aa-stat">
        <span className="aa-stat__val">{stats.total ?? 0}</span>
        <span className="aa-stat__lbl">Recommended</span>
      </div>
      <div className="aa-stat aa-stat--red">
        <span className="aa-stat__val">{stats.high ?? 0}</span>
        <span className="aa-stat__lbl">High Priority</span>
      </div>
      <div className="aa-stat aa-stat--amber">
        <span className="aa-stat__val">{stats.medium ?? 0}</span>
        <span className="aa-stat__lbl">Medium Priority</span>
      </div>
      <div className="aa-stat aa-stat--blue">
        <span className="aa-stat__val">{stats.drafts ?? 0}</span>
        <span className="aa-stat__lbl">Drafts Ready</span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

const TABS = [
  { id: 'queue',    label: 'AI Queue',    icon: 'bolt'          },
  { id: 'drafts',   label: 'My Drafts',   icon: 'description'   },
  { id: 'submitted',label: 'Submitted',   icon: 'task_alt'      },
];

export default function AutoApplyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');

  // Queue state
  const [queueData, setQueueData]   = useState(null);
  const [qLoading,  setQLoading]    = useState(false);
  const [qError,    setQError]      = useState('');

  // Drafts state
  const [drafts,    setDrafts]      = useState([]);
  const [dLoading,  setDLoading]    = useState(false);

  // Submitted state
  const [submitted, setSubmitted]   = useState([]);

  // Modal
  const [modalItem, setModalItem]   = useState(null);

  const getToken = () => user.getIdToken();

  const loadQueue = useCallback(async () => {
    setQLoading(true);
    setQError('');
    try {
      const data = await getApplyQueue(getToken);
      setQueueData(data.data);
    } catch (err) {
      if (err.status === 400 || err.message?.includes('profile')) {
        setQError('no-profile');
      } else {
        setQError(err.message || 'Failed to load queue.');
      }
    } finally {
      setQLoading(false);
    }
  }, []);  // eslint-disable-line

  const loadDrafts = useCallback(async (status) => {
    setDLoading(true);
    try {
      const data = await getDrafts(getToken, status);
      return data.data || [];
    } catch { return []; } finally { setDLoading(false); }
  }, []);  // eslint-disable-line

  useEffect(() => { loadQueue(); }, [loadQueue]);

  useEffect(() => {
    if (activeTab === 'drafts') {
      loadDrafts('ready').then(setDrafts);
    }
    if (activeTab === 'submitted') {
      loadDrafts('submitted').then(setSubmitted);
    }
  }, [activeTab, loadDrafts]);

  function handleDraftSubmitted(draft) {
    // Move from drafts to submitted
    setDrafts(prev => prev.filter(d => d._id !== draft._id));
    loadQueue();
  }

  async function handleDeleteDraft(id) {
    await deleteDraft(getToken, id);
    setDrafts(prev => prev.filter(d => d._id !== id));
    setSubmitted(prev => prev.filter(d => d._id !== id));
  }

  async function handleDraftSubmitDirect(draft) {
    try {
      await submitDraft(getToken, String(draft._id));
      handleDraftSubmitted(draft);
      setActiveTab('submitted');
    } catch { /* user will see error in modal */ }
  }

  // Filter queue
  const highPriority = queueData?.queue?.filter(q => q.priority === 'high') || [];
  const otherPriority = queueData?.queue?.filter(q => q.priority !== 'high') || [];

  return (
    <div className="aa-page">
      {/* Page header */}
      <div className="aa-page-header">
        <div className="aa-page-header__icon">
          <span className="material-icons">bolt</span>
        </div>
        <div>
          <h2 className="aa-page-header__title">Smart Auto-Apply</h2>
          <p className="aa-page-header__sub">
            AI-ranked job queue, personalized cover letters, and application preparation in one place.
          </p>
        </div>
      </div>

      {/* Stats */}
      {queueData?.stats && <StatsRow stats={queueData.stats} />}

      {/* Tab bar */}
      <div className="card aa-tab-bar">
        {TABS.map(tab => (
          <button key={tab.id}
            className={`aa-tab ${activeTab === tab.id ? 'aa-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="material-icons">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === 'drafts' && drafts.length > 0 && (
              <span className="aa-tab-badge">{drafts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── AI Queue Tab ─────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <div className="aa-tab-content">
          {qLoading && (
            <div className="aa-loading-state">
              <div className="spinner" />
              <p>Loading your personalized job queue…</p>
            </div>
          )}

          {qError === 'no-profile' && !qLoading && (
            <div className="card aa-empty-state">
              <span className="material-icons aa-empty-state__icon">person_search</span>
              <h3>No AI Profile Yet</h3>
              <p>
                Your AI profile is built from your resume. Upload a resume and run
                <strong> AI Resume Analysis</strong> to get personalized job recommendations.
              </p>
              <a href="/resume" className="btn btn--primary">
                <span className="material-icons">description</span> Set Up Resume
              </a>
            </div>
          )}

          {qError && qError !== 'no-profile' && !qLoading && (
            <div className="aa-error-banner">
              <span className="material-icons">error_outline</span>
              {qError}
              <button className="btn btn--secondary btn--sm" onClick={loadQueue}>Retry</button>
            </div>
          )}

          {!qLoading && !qError && queueData && (
            <>
              {queueData.queue?.length === 0 ? (
                <div className="card aa-empty-state">
                  <span className="material-icons aa-empty-state__icon">inbox</span>
                  <h3>Queue is Empty</h3>
                  <p>No recommended jobs yet. Browse the <a href="/jobs">Jobs</a> page and save some positions.</p>
                </div>
              ) : (
                <>
                  {highPriority.length > 0 && (
                    <div className="aa-section">
                      <h3 className="aa-section-title">
                        <span className="material-icons" style={{ color: '#dc2626' }}>local_fire_department</span>
                        High Priority ({highPriority.length})
                      </h3>
                      <div className="aa-job-grid">
                        {highPriority.map(item => (
                          <JobRankCard key={String(item._id)} item={item} onPrepare={setModalItem} />
                        ))}
                      </div>
                    </div>
                  )}

                  {otherPriority.length > 0 && (
                    <div className="aa-section">
                      <h3 className="aa-section-title">
                        <span className="material-icons">recommend</span>
                        Other Recommendations ({otherPriority.length})
                      </h3>
                      <div className="aa-job-grid">
                        {otherPriority.map(item => (
                          <JobRankCard key={String(item._id)} item={item} onPrepare={setModalItem} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Drafts Tab ───────────────────────────────────────── */}
      {activeTab === 'drafts' && (
        <div className="aa-tab-content">
          {dLoading && <div className="aa-loading-state"><div className="spinner" /></div>}
          {!dLoading && drafts.length === 0 && (
            <div className="card aa-empty-state">
              <span className="material-icons aa-empty-state__icon">description</span>
              <h3>No Drafts Yet</h3>
              <p>Prepare an application from the AI Queue to generate a draft with cover letter and checklist.</p>
            </div>
          )}
          {!dLoading && drafts.length > 0 && (
            <div className="aa-draft-grid">
              {drafts.map(d => (
                <DraftCard key={d._id} draft={d}
                  onEdit={() => setModalItem({ job: d.job || { _id: d.job }, _isDraft: true, draft: d })}
                  onDelete={handleDeleteDraft}
                  onSubmit={handleDraftSubmitDirect}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Submitted Tab ────────────────────────────────────── */}
      {activeTab === 'submitted' && (
        <div className="aa-tab-content">
          {dLoading && <div className="aa-loading-state"><div className="spinner" /></div>}
          {!dLoading && submitted.length === 0 && (
            <div className="card aa-empty-state">
              <span className="material-icons aa-empty-state__icon">task_alt</span>
              <h3>No Submitted Applications</h3>
              <p>Applications you submit from the AI Queue will appear here.</p>
            </div>
          )}
          {!dLoading && submitted.length > 0 && (
            <div className="aa-draft-grid">
              {submitted.map(d => (
                <DraftCard key={d._id} draft={d}
                  onEdit={() => {}}
                  onDelete={handleDeleteDraft}
                  onSubmit={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prepare Modal */}
      {modalItem && (
        <PrepareModal
          item={modalItem}
          getToken={getToken}
          onClose={() => setModalItem(null)}
          onSubmitted={(d) => {
            handleDraftSubmitted(d);
            setModalItem(null);
            setActiveTab('submitted');
          }}
        />
      )}
    </div>
  );
}
