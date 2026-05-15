import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as wf from '../../services/workflow.js';
import './WorkflowPage.css';

// ── Constants ─────────────────────────────────────────────────────────────

const WORKFLOW_STATES = ['saved', 'prepared', 'ready_to_apply', 'applied', 'interview', 'offer', 'rejected'];

const STATE_META = {
  saved:          { label: 'Saved',          icon: 'bookmark',       color: '#64748b', bg: '#f1f5f9' },
  prepared:       { label: 'Prepared',        icon: 'auto_fix_high',  color: '#8b5cf6', bg: '#f5f3ff' },
  ready_to_apply: { label: 'Ready to Apply',  icon: 'check_circle',   color: '#0891b2', bg: '#e0f2fe' },
  applied:        { label: 'Applied',         icon: 'send',           color: '#d97706', bg: '#fef3c7' },
  interview:      { label: 'Interview',       icon: 'event',          color: '#2563eb', bg: '#dbeafe' },
  offer:          { label: 'Offer',           icon: 'celebration',    color: '#16a34a', bg: '#dcfce7' },
  rejected:       { label: 'Rejected',        icon: 'cancel',         color: '#dc2626', bg: '#fee2e2' },
};

const PRIORITY_META = {
  high:   { color: '#dc2626', bg: '#fee2e2', label: 'High' },
  medium: { color: '#d97706', bg: '#fef3c7', label: 'Medium' },
  low:    { color: '#64748b', bg: '#f1f5f9', label: 'Low' },
};

const URGENCY_META = {
  urgent: { icon: 'priority_high',  color: '#dc2626' },
  normal: { icon: 'radio_button_unchecked', color: '#64748b' },
  low:    { icon: 'expand_more',    color: '#94a3b8' },
};

const ACTION_CAT_META = {
  prepare:       { icon: 'auto_fix_high',  color: '#8b5cf6' },
  apply:         { icon: 'send',           color: '#0891b2' },
  follow_up:     { icon: 'reply',          color: '#d97706' },
  interview_prep:{ icon: 'mic',            color: '#2563eb' },
  research:      { icon: 'search',         color: '#64748b' },
  negotiate:     { icon: 'handshake',      color: '#16a34a' },
  other:         { icon: 'more_horiz',     color: '#64748b' },
};

const TONE_OPTIONS = [
  { value: 'professional',  label: 'Professional' },
  { value: 'enthusiastic',  label: 'Enthusiastic' },
  { value: 'technical',     label: 'Technical' },
  { value: 'concise',       label: 'Concise' },
];

const COMM_TYPES = ['email', 'call', 'linkedin', 'meeting', 'message', 'other'];

// ── Utility ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 56, stroke = 5 }) {
  const r   = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(100, Math.max(0, score ?? 0));
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
  return (
    <svg width={size} height={size} className="wf-score-ring">
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--border-color,#e2e8f0)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size/2} cy={size/2} r={r}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={`${circ * pct / 100} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
            fontSize={size < 50 ? 10 : 13} fontWeight="700" fill={color}>
        {score != null ? pct : '—'}
      </text>
    </svg>
  );
}

function StateBadge({ state }) {
  const m = STATE_META[state] ?? STATE_META.saved;
  return (
    <span className="wf-state-badge" style={{ color: m.color, background: m.bg }}>
      <span className="material-icons" style={{ fontSize: 12 }}>{m.icon}</span>
      {m.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const m = PRIORITY_META[priority] ?? PRIORITY_META.medium;
  return (
    <span className="wf-priority-badge" style={{ color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

function PrepStatus({ prep }) {
  const items = [
    { key: 'resumeOptimized',      icon: 'description', label: 'Resume' },
    { key: 'atsValidated',         icon: 'fact_check',  label: 'ATS' },
    { key: 'coverLetterGenerated', icon: 'mail',        label: 'Cover Letter' },
    { key: 'checklistComplete',    icon: 'checklist',   label: 'Checklist' },
  ];
  return (
    <div className="wf-prep-status">
      {items.map(({ key, icon, label }) => (
        <span key={key} className={`wf-prep-dot ${prep?.[key] ? 'done' : ''}`} title={label}>
          <span className="material-icons">{prep?.[key] ? 'check_circle' : icon}</span>
        </span>
      ))}
    </div>
  );
}

// ── WorkspaceDrawer ───────────────────────────────────────────────────────

function WorkspaceDrawer({ workspaceId, getToken, onClose, onStateChange }) {
  const [workspace, setWorkspace]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('details');
  const [preparing, setPreparing]     = useState(false);
  const [prepTone, setPrepTone]       = useState('professional');
  const [regenerating, setRegenerating] = useState(false);
  const [nextActions, setNextActions] = useState(null);
  const [loadingNA, setLoadingNA]     = useState(false);
  const [savingNote, setSavingNote]   = useState(false);
  const [noteText, setNoteText]       = useState('');
  const [copied, setCopied]           = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [history, setHistory]         = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [contactForm, setContactForm] = useState({ show: false, type: 'email', direction: 'sent', subject: '', notes: '', outcome: '' });
  const [followUpForm, setFollowUpForm] = useState({ show: false, dueDate: '', note: '' });
  const [newContact, setNewContact]   = useState({ show: false, name: '', company: '', email: '', title: '', phone: '' });

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const r = await wf.getWorkspace(getToken, workspaceId);
      setWorkspace(r.data);
      setNoteText(r.data.workspaceNotes || '');
    } catch { /* ignore */ }
    setLoading(false);
  }, [workspaceId, getToken]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === 'history' && history.length === 0) {
      setLoadingHistory(true);
      wf.getHistory(getToken, workspaceId).then(r => setHistory(r.data ?? [])).finally(() => setLoadingHistory(false));
    }
  }, [tab]);

  async function handlePrepare() {
    setPreparing(true);
    try {
      await wf.prepareApplication(getToken, workspaceId, { tone: prepTone });
      await load();
    } catch (e) { alert(e.message); }
    setPreparing(false);
  }

  async function handleRegenCL() {
    setRegenerating(true);
    try {
      await wf.regenerateCoverLetter(getToken, workspaceId, { tone: prepTone });
      await load();
    } catch (e) { alert(e.message); }
    setRegenerating(false);
  }

  async function handleToggleChecklist(itemId, done) {
    try {
      const r = await wf.toggleChecklistItem(getToken, workspaceId, itemId, done);
      setWorkspace(r.data);
    } catch { /* ignore */ }
  }

  async function handleStateChange(newState) {
    setStatusChanging(true);
    try {
      const r = await wf.updateStatus(getToken, workspaceId, newState);
      setWorkspace(prev => ({ ...prev, workflowState: r.data.workflowState }));
      onStateChange?.();
    } catch { /* ignore */ }
    setStatusChanging(false);
  }

  async function handleSaveNote() {
    setSavingNote(true);
    try {
      await wf.updateWorkspace(getToken, workspaceId, { workspaceNotes: noteText });
    } catch { /* ignore */ }
    setSavingNote(false);
  }

  async function handleGetNextActions() {
    setLoadingNA(true);
    try {
      const r = await wf.getNextActions(getToken, workspaceId);
      setNextActions(r.data);
    } catch { /* ignore */ }
    setLoadingNA(false);
  }

  async function handleCopyCL() {
    await navigator.clipboard.writeText(workspace.coverLetter?.text ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddCommLog(e) {
    e.preventDefault();
    try {
      await wf.addCommLog(getToken, workspace.recruiterContact._id, contactForm);
      setContactForm({ show: false, type: 'email', direction: 'sent', subject: '', notes: '', outcome: '' });
      await load();
    } catch (err) { alert(err.message); }
  }

  async function handleAddFollowUp(e) {
    e.preventDefault();
    try {
      await wf.addFollowUp(getToken, workspace.recruiterContact._id, followUpForm);
      setFollowUpForm({ show: false, dueDate: '', note: '' });
      await load();
    } catch (err) { alert(err.message); }
  }

  if (!workspaceId) return null;

  const a   = workspace?.application ?? {};
  const cl  = workspace?.coverLetter ?? {};
  const ats = workspace?.ats ?? {};
  const prep = workspace?.preparation ?? {};
  const checklist = workspace?.checklist ?? [];
  const contact = workspace?.recruiterContact;

  return (
    <div className="wf-drawer-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wf-drawer">
        {/* Header */}
        <div className="wf-drawer__header">
          <div className="wf-drawer__title">
            <span className="material-icons wf-drawer__title-icon">work_outline</span>
            <div>
              <div className="wf-drawer__role">{loading ? 'Loading…' : (a.role || 'Unknown role')}</div>
              <div className="wf-drawer__company">{a.company}</div>
            </div>
          </div>
          <div className="wf-drawer__header-right">
            {workspace && <StateBadge state={workspace.workflowState} />}
            <button className="wf-drawer__close" onClick={onClose}>
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="wf-drawer__loading">
            <div className="wf-spinner" />
            <span>Loading workspace…</span>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div className="wf-drawer__tabs">
              {[
                { id: 'details',  icon: 'info',         label: 'Details'     },
                { id: 'prepare',  icon: 'auto_fix_high', label: 'Prepare'    },
                { id: 'timeline', icon: 'timeline',     label: 'Timeline'    },
                { id: 'notes',    icon: 'sticky_note_2', label: 'Notes'      },
                { id: 'recruiter',icon: 'person',        label: 'Recruiter'  },
              ].map(t => (
                <button
                  key={t.id}
                  className={`wf-drawer__tab ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  <span className="material-icons">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="wf-drawer__body">

              {/* ── Details Tab ── */}
              {tab === 'details' && (
                <div className="wf-tab-details">
                  {/* Scores */}
                  <div className="wf-scores-row">
                    <div className="wf-score-card">
                      <ScoreRing score={a.matchScore} />
                      <span>Match Score</span>
                    </div>
                    <div className="wf-score-card">
                      <ScoreRing score={ats.score} />
                      <span>ATS Score</span>
                    </div>
                    <div className="wf-score-card">
                      <ScoreRing score={workspace.aiQueueScore} />
                      <span>AI Priority</span>
                    </div>
                  </div>

                  {/* Job info */}
                  <div className="wf-detail-grid">
                    {[
                      { icon: 'location_on', label: 'Location',   value: a.location || 'N/A' },
                      { icon: 'work',        label: 'Type',        value: a.type || 'N/A' },
                      { icon: 'payments',    label: 'Salary',      value: a.salary || 'N/A' },
                      { icon: 'flag',        label: 'Priority',    value: <PriorityBadge priority={a.priority} /> },
                    ].map(({ icon, label, value }) => (
                      <div key={label} className="wf-detail-item">
                        <span className="material-icons wf-detail-icon">{icon}</span>
                        <div>
                          <div className="wf-detail-label">{label}</div>
                          <div className="wf-detail-value">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Workflow state change */}
                  <div className="wf-state-section">
                    <div className="wf-section-label">Move to Stage</div>
                    <div className="wf-state-pills">
                      {WORKFLOW_STATES.map(state => {
                        const m = STATE_META[state];
                        const active = workspace.workflowState === state;
                        return (
                          <button
                            key={state}
                            className={`wf-state-pill ${active ? 'active' : ''}`}
                            style={active ? { background: m.color, color: '#fff' } : {}}
                            onClick={() => !active && handleStateChange(state)}
                            disabled={statusChanging || active}
                          >
                            <span className="material-icons" style={{ fontSize: 14 }}>{m.icon}</span>
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Next Actions */}
                  <div className="wf-next-actions-section">
                    <div className="wf-section-header">
                      <span className="wf-section-label">AI Next Actions</span>
                      <button className="wf-btn wf-btn--sm" onClick={handleGetNextActions} disabled={loadingNA}>
                        <span className="material-icons">{loadingNA ? 'hourglass_empty' : 'refresh'}</span>
                        {loadingNA ? 'Analyzing…' : 'Get Suggestions'}
                      </button>
                    </div>

                    {nextActions ? (
                      <div className="wf-next-actions">
                        {nextActions.overallAdvice && (
                          <div className="wf-advice">{nextActions.overallAdvice}</div>
                        )}
                        {(nextActions.nextActions ?? []).map((na, i) => {
                          const m = ACTION_CAT_META[na.category] ?? ACTION_CAT_META.other;
                          return (
                            <div key={i} className="wf-action-item">
                              <span className="material-icons wf-action-icon" style={{ color: m.color }}>{m.icon}</span>
                              <div className="wf-action-body">
                                <div className="wf-action-text">{na.action}</div>
                                <div className="wf-action-meta">
                                  <PriorityBadge priority={na.priority} />
                                  <span className="wf-action-time">
                                    <span className="material-icons">schedule</span>
                                    {na.timeEstimate}
                                  </span>
                                </div>
                                {na.reasoning && <div className="wf-action-reason">{na.reasoning}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="wf-empty-hint">Click "Get Suggestions" for AI-powered next actions.</div>
                    )}
                  </div>

                  {/* ATS Keywords */}
                  {(ats.matchedKeywords?.length > 0 || ats.missingKeywords?.length > 0) && (
                    <div className="wf-keywords-section">
                      {ats.matchedKeywords?.length > 0 && (
                        <>
                          <div className="wf-section-label">Matched Keywords</div>
                          <div className="wf-keyword-chips">
                            {ats.matchedKeywords.map(kw => (
                              <span key={kw} className="wf-keyword wf-keyword--matched">{kw}</span>
                            ))}
                          </div>
                        </>
                      )}
                      {ats.missingKeywords?.length > 0 && (
                        <>
                          <div className="wf-section-label" style={{ marginTop: 12 }}>Missing Keywords</div>
                          <div className="wf-keyword-chips">
                            {ats.missingKeywords.map(kw => (
                              <span key={kw} className="wf-keyword wf-keyword--missing">{kw}</span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Prepare Tab ── */}
              {tab === 'prepare' && (
                <div className="wf-tab-prepare">
                  {/* Preparation status */}
                  <div className="wf-prep-overview card">
                    <div className="wf-prep-overview__title">Preparation Status</div>
                    <div className="wf-prep-items">
                      {[
                        { key: 'resumeOptimized',      icon: 'description',  label: 'Resume analysed' },
                        { key: 'atsValidated',         icon: 'fact_check',   label: 'ATS validated' },
                        { key: 'coverLetterGenerated', icon: 'mail',         label: 'Cover letter generated' },
                        { key: 'checklistComplete',    icon: 'checklist',    label: 'Checklist complete' },
                      ].map(({ key, icon, label }) => (
                        <div key={key} className={`wf-prep-item ${prep[key] ? 'done' : ''}`}>
                          <span className="material-icons">{prep[key] ? 'check_circle' : icon}</span>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="wf-tone-row">
                      <label className="wf-label">Cover Letter Tone</label>
                      <div className="wf-tone-pills">
                        {TONE_OPTIONS.map(t => (
                          <button
                            key={t.value}
                            className={`wf-tone-pill ${prepTone === t.value ? 'active' : ''}`}
                            onClick={() => setPrepTone(t.value)}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="wf-prep-actions">
                      <button className="wf-btn wf-btn--primary" onClick={handlePrepare} disabled={preparing}>
                        <span className="material-icons">{preparing ? 'hourglass_empty' : 'auto_awesome'}</span>
                        {preparing ? 'Running AI Preparation…' : (prep.resumeOptimized ? 'Re-run Full Prep' : 'Run Full AI Preparation')}
                      </button>
                      {prep.coverLetterGenerated && (
                        <button className="wf-btn" onClick={handleRegenCL} disabled={regenerating}>
                          <span className="material-icons">refresh</span>
                          {regenerating ? 'Regenerating…' : 'Regenerate Cover Letter'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {cl.text ? (
                    <div className="wf-cl-card card">
                      <div className="wf-cl-header">
                        <div className="wf-cl-title">
                          <span className="material-icons">mail_outline</span>
                          Cover Letter
                          <span className="wf-cl-version">v{cl.version}</span>
                        </div>
                        <button className="wf-btn wf-btn--sm" onClick={handleCopyCL}>
                          <span className="material-icons">{copied ? 'check' : 'content_copy'}</span>
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      {cl.subjectLine && (
                        <div className="wf-cl-subject">
                          <strong>Subject:</strong> {cl.subjectLine}
                        </div>
                      )}
                      <pre className="wf-cl-text">{cl.text}</pre>
                      {cl.keyHighlights?.length > 0 && (
                        <div className="wf-cl-highlights">
                          <div className="wf-section-label">Key Highlights</div>
                          {cl.keyHighlights.map((h, i) => (
                            <div key={i} className="wf-highlight-item">
                              <span className="material-icons">star</span> {h}
                            </div>
                          ))}
                        </div>
                      )}
                      {cl.aiRecommendations?.length > 0 && (
                        <div className="wf-cl-recs">
                          <div className="wf-section-label">AI Recommendations</div>
                          {cl.aiRecommendations.map((r, i) => (
                            <div key={i} className="wf-rec-item">
                              <span className="material-icons">lightbulb</span> {r}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="wf-empty-hint wf-empty-hint--box">
                      <span className="material-icons">mail_outline</span>
                      <span>Run AI Preparation to generate your cover letter</span>
                    </div>
                  )}

                  {/* Checklist */}
                  {checklist.length > 0 && (
                    <div className="wf-checklist card">
                      <div className="wf-cl-header">
                        <div className="wf-cl-title">
                          <span className="material-icons">checklist</span>
                          Application Checklist
                        </div>
                        <span className="wf-checklist-count">
                          {checklist.filter(c => c.done).length}/{checklist.length}
                        </span>
                      </div>
                      <div className="wf-checklist-items">
                        {checklist.map(item => (
                          <label key={item._id} className={`wf-check-item ${item.done ? 'done' : ''}`}>
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={e => handleToggleChecklist(item._id, e.target.checked)}
                            />
                            <span className="wf-check-text">{item.item}</span>
                            <span className="wf-check-cat">{item.category}</span>
                            <PriorityBadge priority={item.priority} />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ATS Improvements */}
                  {ats.improvements?.length > 0 && (
                    <div className="wf-improvements card">
                      <div className="wf-cl-title">
                        <span className="material-icons">tips_and_updates</span>
                        ATS Improvements
                      </div>
                      {ats.improvements.map((imp, i) => (
                        <div key={i} className="wf-improvement-item">
                          <span className="material-icons">arrow_right</span> {imp}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Timeline Tab ── */}
              {tab === 'timeline' && (
                <div className="wf-tab-timeline">
                  {loadingHistory ? (
                    <div className="wf-loading-row"><div className="wf-spinner" /></div>
                  ) : history.length === 0 ? (
                    <div className="wf-empty-hint wf-empty-hint--box">
                      <span className="material-icons">timeline</span>
                      <span>No history yet. Start by preparing your application.</span>
                    </div>
                  ) : (
                    <div className="wf-timeline">
                      {history.map((h, i) => (
                        <div key={h._id ?? i} className="wf-tl-item">
                          <div className="wf-tl-dot" />
                          <div className="wf-tl-content">
                            <div className="wf-tl-event">{h.event?.replace(/_/g, ' ')}</div>
                            {(h.from || h.to) && (
                              <div className="wf-tl-transition">
                                {h.from && <span className="wf-tl-from">{h.from}</span>}
                                {h.from && h.to && <span className="material-icons" style={{ fontSize: 12 }}>arrow_forward</span>}
                                {h.to && <span className="wf-tl-to">{h.to}</span>}
                              </div>
                            )}
                            <div className="wf-tl-meta">
                              <span className="wf-tl-actor">{h.actor}</span>
                              <span className="wf-tl-date">{new Date(h.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Notes Tab ── */}
              {tab === 'notes' && (
                <div className="wf-tab-notes">
                  <div className="wf-section-label">Workspace Notes</div>
                  <textarea
                    className="wf-notes-area"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Add private notes about this application — salary negotiation ideas, company research, contacts met…"
                    rows={10}
                  />
                  <button className="wf-btn wf-btn--primary" onClick={handleSaveNote} disabled={savingNote}>
                    <span className="material-icons">{savingNote ? 'hourglass_empty' : 'save'}</span>
                    {savingNote ? 'Saving…' : 'Save Notes'}
                  </button>
                </div>
              )}

              {/* ── Recruiter Tab ── */}
              {tab === 'recruiter' && (
                <div className="wf-tab-recruiter">
                  {contact ? (
                    <>
                      <div className="wf-contact-card card">
                        <div className="wf-contact-header">
                          <div className="wf-contact-avatar">
                            {contact.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div className="wf-contact-name">{contact.name}</div>
                            <div className="wf-contact-meta">{contact.title}{contact.company ? ` · ${contact.company}` : ''}</div>
                          </div>
                        </div>
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="wf-contact-link">
                            <span className="material-icons">email</span> {contact.email}
                          </a>
                        )}
                        {contact.linkedIn && (
                          <a href={contact.linkedIn} target="_blank" rel="noreferrer" className="wf-contact-link">
                            <span className="material-icons">link</span> LinkedIn
                          </a>
                        )}
                      </div>

                      {/* Communication Log */}
                      <div className="wf-section-header">
                        <span className="wf-section-label">Communication Log</span>
                        <button className="wf-btn wf-btn--sm" onClick={() => setContactForm(f => ({ ...f, show: true }))}>
                          <span className="material-icons">add</span> Log
                        </button>
                      </div>

                      {contactForm.show && (
                        <form className="wf-comm-form card" onSubmit={handleAddCommLog}>
                          <div className="wf-form-row">
                            <select value={contactForm.type} onChange={e => setContactForm(f => ({ ...f, type: e.target.value }))}>
                              {COMM_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <select value={contactForm.direction} onChange={e => setContactForm(f => ({ ...f, direction: e.target.value }))}>
                              <option value="sent">Sent</option>
                              <option value="received">Received</option>
                            </select>
                          </div>
                          <input className="wf-input" placeholder="Subject / topic" value={contactForm.subject}
                            onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))} />
                          <textarea className="wf-input" rows={3} placeholder="Notes…" value={contactForm.notes}
                            onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))} />
                          <input className="wf-input" placeholder="Outcome" value={contactForm.outcome}
                            onChange={e => setContactForm(f => ({ ...f, outcome: e.target.value }))} />
                          <div className="wf-form-actions">
                            <button type="submit" className="wf-btn wf-btn--primary wf-btn--sm">Save</button>
                            <button type="button" className="wf-btn wf-btn--sm" onClick={() => setContactForm(f => ({ ...f, show: false }))}>Cancel</button>
                          </div>
                        </form>
                      )}

                      <div className="wf-comm-log">
                        {(contact.communicationLog ?? []).slice(0, 10).map((l, i) => (
                          <div key={l._id ?? i} className="wf-comm-item">
                            <span className={`wf-comm-type ${l.direction}`}>{l.type}</span>
                            <div className="wf-comm-body">
                              {l.subject && <div className="wf-comm-subject">{l.subject}</div>}
                              {l.notes   && <div className="wf-comm-notes">{l.notes}</div>}
                            </div>
                            <span className="wf-comm-date">{new Date(l.date ?? l.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                        {(contact.communicationLog?.length ?? 0) === 0 && (
                          <div className="wf-empty-hint">No communications logged yet.</div>
                        )}
                      </div>

                      {/* Follow-ups */}
                      <div className="wf-section-header">
                        <span className="wf-section-label">Follow-up Reminders</span>
                        <button className="wf-btn wf-btn--sm" onClick={() => setFollowUpForm(f => ({ ...f, show: true }))}>
                          <span className="material-icons">add</span> Add
                        </button>
                      </div>

                      {followUpForm.show && (
                        <form className="wf-comm-form card" onSubmit={handleAddFollowUp}>
                          <input type="date" className="wf-input" value={followUpForm.dueDate}
                            onChange={e => setFollowUpForm(f => ({ ...f, dueDate: e.target.value }))} required />
                          <input className="wf-input" placeholder="Reminder note" value={followUpForm.note}
                            onChange={e => setFollowUpForm(f => ({ ...f, note: e.target.value }))} />
                          <div className="wf-form-actions">
                            <button type="submit" className="wf-btn wf-btn--primary wf-btn--sm">Add Reminder</button>
                            <button type="button" className="wf-btn wf-btn--sm" onClick={() => setFollowUpForm(f => ({ ...f, show: false }))}>Cancel</button>
                          </div>
                        </form>
                      )}

                      <div className="wf-followup-list">
                        {(contact.followUps ?? []).filter(fu => !fu.completed).map((fu, i) => (
                          <div key={fu._id ?? i} className={`wf-followup-item ${new Date(fu.dueDate) < new Date() ? 'overdue' : ''}`}>
                            <span className="material-icons">alarm</span>
                            <div>
                              <div className="wf-followup-date">{new Date(fu.dueDate).toLocaleDateString()}</div>
                              {fu.note && <div className="wf-followup-note">{fu.note}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="wf-empty-hint wf-empty-hint--box">
                      <span className="material-icons">person_add</span>
                      <span>No recruiter contact linked. Go to the Contacts tab to add one and link it here.</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Queue Card ────────────────────────────────────────────────────────────

function QueueCard({ item, onOpen, onPrepare, preparing }) {
  const urgM = URGENCY_META[item.urgency] ?? URGENCY_META.normal;
  const catM = ACTION_CAT_META[item.nextActionCategory] ?? ACTION_CAT_META.other;

  return (
    <div className="wf-queue-card card" onClick={() => onOpen(item.workspaceId)}>
      <div className="wf-qc-header">
        <div className="wf-qc-rank">
          <span className="material-icons" style={{ color: urgM.color, fontSize: 18 }}>{urgM.icon}</span>
          <span className="wf-qc-score">{item.priorityScore}</span>
        </div>
        <div className="wf-qc-title-group">
          <div className="wf-qc-role">{item.application?.role ?? 'Unknown role'}</div>
          <div className="wf-qc-company">{item.application?.company}</div>
        </div>
        <div className="wf-qc-badges">
          <StateBadge state={item.workflowState} />
          {item.pinned && <span className="wf-pin-badge"><span className="material-icons">push_pin</span></span>}
        </div>
      </div>

      <div className="wf-qc-scores">
        <span className="wf-qc-stat">
          <span className="material-icons">psychology</span>
          Match: {item.application?.matchScore ?? '—'}%
        </span>
        <span className="wf-qc-stat">
          <span className="material-icons">fact_check</span>
          ATS: {item.ats?.score ?? '—'}%
        </span>
        <PrepStatus prep={item.preparation} />
      </div>

      <div className="wf-qc-action">
        <span className="material-icons" style={{ color: catM.color }}>{catM.icon}</span>
        <span className="wf-qc-action-text">{item.nextAction}</span>
      </div>

      {item.reasoning && <div className="wf-qc-reason">{item.reasoning}</div>}

      <div className="wf-qc-footer">
        <button className="wf-btn wf-btn--sm wf-btn--primary"
          onClick={e => { e.stopPropagation(); onPrepare(item.workspaceId); }}
          disabled={preparing === item.workspaceId}>
          <span className="material-icons">{preparing === item.workspaceId ? 'hourglass_empty' : 'auto_awesome'}</span>
          {item.preparation?.resumeOptimized ? 'Re-Prepare' : 'Prepare'}
        </button>
        <button className="wf-btn wf-btn--sm" onClick={e => { e.stopPropagation(); onOpen(item.workspaceId); }}>
          <span className="material-icons">open_in_full</span>
          Open
        </button>
      </div>
    </div>
  );
}

// ── Board Column ──────────────────────────────────────────────────────────

function BoardColumn({ state, workspaces, onOpen }) {
  const m = STATE_META[state];
  const items = workspaces.filter(ws => ws.workflowState === state);
  return (
    <div className="wf-board-col">
      <div className="wf-board-col__header" style={{ borderTop: `3px solid ${m.color}` }}>
        <span className="material-icons" style={{ color: m.color }}>{m.icon}</span>
        <span className="wf-board-col__label">{m.label}</span>
        <span className="wf-board-col__count">{items.length}</span>
      </div>
      <div className="wf-board-col__cards">
        {items.length === 0 ? (
          <div className="wf-board-empty">No applications</div>
        ) : (
          items.map(ws => (
            <div key={ws._id} className="wf-board-card" onClick={() => onOpen(ws._id)}>
              <div className="wf-bc-role">{ws.application?.role ?? 'Unknown'}</div>
              <div className="wf-bc-company">{ws.application?.company}</div>
              <div className="wf-bc-meta">
                {ws.ats?.score != null && (
                  <span className="wf-bc-ats">ATS {ws.ats.score}%</span>
                )}
                <PrepStatus prep={ws.preparation} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Contacts Panel ────────────────────────────────────────────────────────

function ContactsPanel({ getToken }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', company: '', email: '', title: '', phone: '', linkedIn: '' });
  const [saving, setSaving]     = useState(false);
  const [followUps, setFollowUps] = useState([]);

  useEffect(() => {
    Promise.all([
      wf.listContacts(getToken).then(r => setContacts(r.contacts ?? [])),
      wf.getUpcomingFollowUps(getToken).then(r => setFollowUps(r.data ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await wf.createContact(getToken, form);
      setContacts(prev => [r.data, ...prev]);
      setForm({ name: '', company: '', email: '', title: '', phone: '', linkedIn: '' });
      setShowForm(false);
    } catch (err) { alert(err.message); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this contact?')) return;
    await wf.deleteContact(getToken, id).catch(() => {});
    setContacts(prev => prev.filter(c => String(c._id) !== String(id)));
  }

  const STATUS_COLORS = { active: '#16a34a', responded: '#2563eb', unresponsive: '#d97706', archived: '#64748b' };

  return (
    <div className="wf-contacts-panel">
      {/* Upcoming Follow-ups */}
      {followUps.length > 0 && (
        <div className="wf-followups-banner card">
          <div className="wf-section-header">
            <span className="wf-section-label">
              <span className="material-icons">alarm</span>
              Upcoming Follow-ups ({followUps.length})
            </span>
          </div>
          <div className="wf-followups-list">
            {followUps.slice(0, 5).map((fu, i) => (
              <div key={i} className={`wf-fu-item ${fu.overdue ? 'overdue' : ''}`}>
                <span className="wf-fu-name">{fu.contact.name}</span>
                <span className="wf-fu-company">{fu.contact.company}</span>
                <span className="wf-fu-date">{new Date(fu.followUp.dueDate).toLocaleDateString()}</span>
                {fu.overdue && <span className="wf-fu-overdue-badge">OVERDUE</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wf-section-header">
        <span className="wf-section-label">{contacts.length} Contacts</span>
        <button className="wf-btn wf-btn--primary wf-btn--sm" onClick={() => setShowForm(s => !s)}>
          <span className="material-icons">{showForm ? 'close' : 'person_add'}</span>
          {showForm ? 'Cancel' : 'Add Contact'}
        </button>
      </div>

      {showForm && (
        <form className="wf-contact-form card" onSubmit={handleCreate}>
          <div className="wf-form-grid">
            <input className="wf-input" placeholder="Name *" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="wf-input" placeholder="Company" value={form.company}
              onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            <input className="wf-input" placeholder="Title / Role" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <input className="wf-input" type="email" placeholder="Email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input className="wf-input" placeholder="Phone" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <input className="wf-input" placeholder="LinkedIn URL" value={form.linkedIn}
              onChange={e => setForm(f => ({ ...f, linkedIn: e.target.value }))} />
          </div>
          <button type="submit" className="wf-btn wf-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Create Contact'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="wf-loading-row"><div className="wf-spinner" /></div>
      ) : contacts.length === 0 ? (
        <div className="wf-empty-state">
          <span className="material-icons">people_outline</span>
          <p>No recruiter contacts yet. Add your first contact above.</p>
        </div>
      ) : (
        <div className="wf-contacts-grid">
          {contacts.map(c => (
            <div key={c._id} className="wf-contact-tile card">
              <div className="wf-ct-header">
                <div className="wf-ct-avatar">{c.name[0]?.toUpperCase()}</div>
                <div className="wf-ct-info">
                  <div className="wf-ct-name">{c.name}</div>
                  <div className="wf-ct-title">{c.title}{c.company ? ` · ${c.company}` : ''}</div>
                </div>
                <span className="wf-ct-status" style={{ color: STATUS_COLORS[c.status] }}>
                  {c.status}
                </span>
              </div>
              <div className="wf-ct-links">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="wf-ct-link" onClick={e => e.stopPropagation()}>
                    <span className="material-icons">email</span>
                    {c.email}
                  </a>
                )}
              </div>
              <div className="wf-ct-stats">
                <span>{c.applications?.length ?? 0} apps linked</span>
                <span>{c.communicationLog?.length ?? 0} comms</span>
                {c.lastContactedAt && <span>Last: {new Date(c.lastContactedAt).toLocaleDateString()}</span>}
              </div>
              <div className="wf-ct-actions">
                <button className="wf-btn wf-btn--sm wf-btn--ghost" onClick={() => handleDelete(c._id)}>
                  <span className="material-icons">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function WorkflowPage() {
  const { getToken } = useAuth();

  const [activeTab,    setActiveTab]    = useState('queue');
  const [queue,        setQueue]        = useState(null);
  const [workspaces,   setWorkspaces]   = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [drawerId,     setDrawerId]     = useState(null);
  const [preparingId,  setPreparingId]  = useState(null);

  // Stats derived from queue + workspaces
  const stateCounts = WORKFLOW_STATES.reduce((acc, s) => {
    acc[s] = workspaces.filter(ws => ws.workflowState === s).length;
    return acc;
  }, {});

  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const r = await wf.getQueue(getToken);
      setQueue(r.data);
    } catch { /* ignore */ }
    setLoadingQueue(false);
  }, [getToken]);

  const loadBoard = useCallback(async () => {
    setLoadingBoard(true);
    try {
      const r = await wf.listWorkspaces(getToken, { limit: 200 });
      setWorkspaces(r.data ?? []);
    } catch { /* ignore */ }
    setLoadingBoard(false);
  }, [getToken]);

  useEffect(() => { loadQueue(); loadBoard(); }, []);

  async function handleQuickPrepare(workspaceId) {
    setPreparingId(workspaceId);
    try {
      await wf.prepareApplication(getToken, workspaceId);
      await loadQueue();
    } catch (e) { alert(e.message); }
    setPreparingId(null);
  }

  const totalApps = workspaces.length;
  const readyCount = (stateCounts.prepared ?? 0) + (stateCounts.ready_to_apply ?? 0);
  const appliedCount = stateCounts.applied ?? 0;
  const interviewCount = stateCounts.interview ?? 0;
  const offerCount = stateCounts.offer ?? 0;

  return (
    <div className="wf-page">
      {/* Page header */}
      <div className="wf-page__header">
        <div>
          <h1 className="wf-page__title">
            <span className="material-icons">account_tree</span>
            Smart Workflow
          </h1>
          <p className="wf-page__subtitle">AI-powered application workspace and priority queue</p>
        </div>

        <div className="wf-stats-row">
          {[
            { label: 'Total',     value: totalApps,      icon: 'folder_open',   color: '#64748b' },
            { label: 'Ready',     value: readyCount,     icon: 'check_circle',  color: '#0891b2' },
            { label: 'Applied',   value: appliedCount,   icon: 'send',          color: '#d97706' },
            { label: 'Interview', value: interviewCount, icon: 'event',         color: '#2563eb' },
            { label: 'Offer',     value: offerCount,     icon: 'celebration',   color: '#16a34a' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="wf-stat-chip">
              <span className="material-icons" style={{ color, fontSize: 18 }}>{icon}</span>
              <div>
                <div className="wf-stat-value">{value}</div>
                <div className="wf-stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="wf-tabs card">
        {[
          { id: 'queue',    icon: 'queue',         label: 'Smart Queue' },
          { id: 'board',    icon: 'view_kanban',   label: 'Board'       },
          { id: 'contacts', icon: 'people',        label: 'Contacts'    },
        ].map(t => (
          <button
            key={t.id}
            className={`wf-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="material-icons">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Smart Queue Tab ── */}
      {activeTab === 'queue' && (
        <div className="wf-queue-panel">
          {loadingQueue ? (
            <div className="wf-loading-center">
              <div className="wf-spinner wf-spinner--lg" />
              <p>AI is ranking your applications…</p>
            </div>
          ) : !queue || queue.queue.length === 0 ? (
            <div className="wf-empty-state card">
              <span className="material-icons">queue</span>
              <h3>Queue is empty</h3>
              <p>Add applications and create workspaces to start using the smart queue.</p>
            </div>
          ) : (
            <>
              {/* Queue insights */}
              <div className="wf-queue-header card">
                <div className="wf-qh-left">
                  <span className="material-icons wf-qh-icon">auto_awesome</span>
                  <div>
                    <div className="wf-qh-title">Today's Recommendation</div>
                    <div className="wf-qh-sub">Focus on <strong>{queue.dailyTarget}</strong> applications today</div>
                  </div>
                </div>
                <div className="wf-qh-insights">
                  {(queue.insights ?? []).map((insight, i) => (
                    <div key={i} className="wf-qh-insight">
                      <span className="material-icons">lightbulb</span>
                      {insight}
                    </div>
                  ))}
                </div>
                <button className="wf-btn wf-btn--sm" onClick={loadQueue}>
                  <span className="material-icons">refresh</span>
                  Refresh Queue
                </button>
              </div>

              <div className="wf-queue-grid">
                {queue.queue.map((item, i) => (
                  <QueueCard
                    key={item.workspaceId}
                    item={{ ...item, rank: i + 1 }}
                    onOpen={setDrawerId}
                    onPrepare={handleQuickPrepare}
                    preparing={preparingId}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Board Tab ── */}
      {activeTab === 'board' && (
        <div className="wf-board">
          {loadingBoard ? (
            <div className="wf-loading-center">
              <div className="wf-spinner wf-spinner--lg" />
            </div>
          ) : (
            <div className="wf-board-cols">
              {WORKFLOW_STATES.map(state => (
                <BoardColumn
                  key={state}
                  state={state}
                  workspaces={workspaces}
                  onOpen={setDrawerId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Contacts Tab ── */}
      {activeTab === 'contacts' && (
        <ContactsPanel getToken={getToken} />
      )}

      {/* Workspace Drawer */}
      {drawerId && (
        <WorkspaceDrawer
          workspaceId={drawerId}
          getToken={getToken}
          onClose={() => setDrawerId(null)}
          onStateChange={() => { loadQueue(); loadBoard(); }}
        />
      )}
    </div>
  );
}
