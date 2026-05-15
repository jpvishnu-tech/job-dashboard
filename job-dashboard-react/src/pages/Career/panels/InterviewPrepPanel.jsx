import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  createInterviewSession,
  getInterviewHistory,
  getInterviewSession,
  submitAnswer,
} from '../../../services/career';

const TYPE_META = {
  technical:     { label: 'Technical',      color: '#3b82f6', bg: '#dbeafe' },
  behavioral:    { label: 'Behavioral',     color: '#10b981', bg: '#d1fae5' },
  system_design: { label: 'System Design',  color: '#8b5cf6', bg: '#ede9fe' },
  mixed:         { label: 'Mixed',          color: '#f59e0b', bg: '#fef3c7' },
};

const DIFF_META = {
  easy:   { label: 'Easy',   color: '#10b981', bg: '#d1fae5' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fef3c7' },
  hard:   { label: 'Hard',   color: '#ef4444', bg: '#fee2e2' },
};

const Q_TYPE_META = {
  technical:     { label: 'Technical',     color: '#3b82f6' },
  behavioral:    { label: 'Behavioral',    color: '#10b981' },
  system_design: { label: 'System Design', color: '#8b5cf6' },
};

const EMPTY_FORM = {
  company: '', role: '', type: 'mixed', difficulty: 'medium', questionCount: 5,
};

function ScoreRing({ score, max = 10 }) {
  const pct      = score != null ? (score / max) * 100 : 0;
  const color    = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div className="score-ring-wrap">
      <svg viewBox="0 0 36 36" className="score-ring-svg">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border-color)" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${pct} ${100 - pct}`}
          strokeDashoffset="25" strokeLinecap="round" />
      </svg>
      <span className="score-ring-val" style={{ color }}>
        {score != null ? score : '—'}
      </span>
    </div>
  );
}

function QuestionCard({ q, index, sessionId, onFeedbackSaved }) {
  const { user }        = useAuth();
  const [open, setOpen] = useState(index === 0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [answer, setAnswer]             = useState(q.userAnswer || '');
  const [submitting, setSubmitting]     = useState(false);
  const [feedback, setFeedback]         = useState(
    q.aiFeedback ? {
      score: q.aiScore, feedback: q.aiFeedback,
      strengths: q.aiStrengths, improvements: q.aiImprovements, idealPoints: q.aiIdealPoints,
    } : null
  );
  const [submitError, setSubmitError] = useState('');

  const qTypeMeta = Q_TYPE_META[q.type]  || Q_TYPE_META.technical;
  const diffMeta  = DIFF_META[q.difficulty] || DIFF_META.medium;

  async function handleSubmitAnswer() {
    if (!answer.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await submitAnswer(() => user.getIdToken(), sessionId, {
        questionIndex: index, answer: answer.trim(),
      });
      const updated = res.data.question;
      setFeedback({
        score:        updated.aiScore,
        feedback:     updated.aiFeedback,
        strengths:    updated.aiStrengths,
        improvements: updated.aiImprovements,
        idealPoints:  updated.aiIdealPoints,
      });
      onFeedbackSaved?.(res.data);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`interview-q-card card${open ? ' interview-q-card--open' : ''}`}>
      <button className="interview-q-header" onClick={() => setOpen(p => !p)} type="button">
        <div className="interview-q-header__left">
          <span className="interview-q-num">{index + 1}</span>
          <div>
            <p className="interview-q-text">{q.question}</p>
            <div className="interview-q-chips">
              <span className="career-chip" style={{ background: qTypeMeta.color + '20', color: qTypeMeta.color, fontSize: 11 }}>
                {qTypeMeta.label}
              </span>
              <span className="career-chip" style={{ background: diffMeta.bg, color: diffMeta.color, fontSize: 11 }}>
                {diffMeta.label}
              </span>
              {feedback && <ScoreRing score={feedback.score} />}
            </div>
          </div>
        </div>
        <span className="material-icons interview-q-chevron">{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {open && (
        <div className="interview-q-body">
          {q.context && (
            <div className="interview-q-context">
              <span className="material-icons">info_outline</span>
              <p>{q.context}</p>
            </div>
          )}

          {q.hints?.length > 0 && (
            <div className="interview-q-section">
              <p className="interview-q-section__label">
                <span className="material-icons">lightbulb</span> Hints
              </p>
              <ul className="interview-hints">
                {q.hints.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          )}

          {q.evaluationCriteria?.length > 0 && (
            <div className="interview-q-section">
              <p className="interview-q-section__label">
                <span className="material-icons">checklist</span> What interviewers look for
              </p>
              <div className="eval-criteria-chips">
                {q.evaluationCriteria.map((c, i) => (
                  <span key={i} className="eval-chip">{c}</span>
                ))}
              </div>
            </div>
          )}

          {q.sampleAnswer && (
            <div className="interview-q-section">
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setShowAnswer(p => !p)}
                type="button"
              >
                <span className="material-icons">{showAnswer ? 'visibility_off' : 'visibility'}</span>
                {showAnswer ? 'Hide' : 'Reveal'} Sample Answer
              </button>
              {showAnswer && (
                <div className="sample-answer-box">
                  <p>{q.sampleAnswer}</p>
                </div>
              )}
            </div>
          )}

          {/* Practice mode */}
          <div className="interview-q-section">
            <button
              className={`btn btn--sm ${practiceMode ? 'btn--secondary' : 'btn--primary'}`}
              onClick={() => setPracticeMode(p => !p)}
              type="button"
            >
              <span className="material-icons">{practiceMode ? 'close' : 'edit'}</span>
              {practiceMode ? 'Cancel' : 'Practice Answer'}
            </button>

            {practiceMode && (
              <div className="practice-area">
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Type your answer here…"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                />
                {submitError && (
                  <div className="modal-error">
                    <span className="material-icons">error_outline</span>{submitError}
                  </div>
                )}
                <button
                  className="btn btn--primary btn--sm"
                  onClick={handleSubmitAnswer}
                  disabled={submitting || !answer.trim()}
                  type="button"
                >
                  <span className="material-icons">{submitting ? 'hourglass_top' : 'auto_awesome'}</span>
                  {submitting ? 'Getting Feedback…' : 'Get AI Feedback'}
                </button>
              </div>
            )}
          </div>

          {/* AI Feedback */}
          {feedback && (
            <div className="ai-feedback-card">
              <div className="ai-feedback-card__header">
                <ScoreRing score={feedback.score} />
                <div>
                  <strong className="ai-feedback-label">AI Score: {feedback.score}/10</strong>
                  <p className="ai-feedback-text">{feedback.feedback}</p>
                </div>
              </div>
              <div className="ai-feedback-grid">
                {feedback.strengths?.length > 0 && (
                  <div>
                    <p className="ai-feedback-section-label" style={{ color: '#10b981' }}>
                      <span className="material-icons">thumb_up</span> Strengths
                    </p>
                    <ul className="ai-feedback-list ai-feedback-list--good">
                      {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {feedback.improvements?.length > 0 && (
                  <div>
                    <p className="ai-feedback-section-label" style={{ color: '#f59e0b' }}>
                      <span className="material-icons">build</span> Improvements
                    </p>
                    <ul className="ai-feedback-list ai-feedback-list--warn">
                      {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              {feedback.idealPoints?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p className="ai-feedback-section-label" style={{ color: '#6366f1' }}>
                    <span className="material-icons">star</span> Ideal answer covers
                  </p>
                  <ul className="ai-feedback-list">
                    {feedback.idealPoints.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SessionView({ session, onBack }) {
  const [current, setCurrent] = useState(session);
  const typeMeta = TYPE_META[current.interviewType] || TYPE_META.mixed;
  const diffMeta = DIFF_META[current.difficulty]    || DIFF_META.medium;
  const answeredCount = current.questions.filter(q => q.aiFeedback).length;

  return (
    <div className="session-view">
      <button className="btn btn--ghost btn--sm" onClick={onBack} style={{ marginBottom: 16 }}>
        <span className="material-icons">arrow_back</span> Back
      </button>

      {/* Session header */}
      <div className="card session-header">
        <div className="session-header__info">
          <h4 className="session-header__role">{current.role}</h4>
          {current.company && <p className="session-header__company">{current.company}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <span className="career-chip" style={{ background: typeMeta.bg, color: typeMeta.color }}>
              {typeMeta.label}
            </span>
            <span className="career-chip" style={{ background: diffMeta.bg, color: diffMeta.color }}>
              {diffMeta.label}
            </span>
            <span className="career-chip">
              <span className="material-icons">quiz</span>
              {current.questions.length} questions
            </span>
            <span className="career-chip">
              <span className="material-icons">rate_review</span>
              {answeredCount} answered
            </span>
          </div>
        </div>
        {current.readinessScore != null && (
          <div style={{ textAlign: 'center' }}>
            <ScoreRing score={current.readinessScore} max={10} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Readiness</p>
          </div>
        )}
      </div>

      {current.sessionOverview && (
        <div className="card roadmap-market-insight">
          <span className="material-icons" style={{ color: '#6366f1' }}>info</span>
          <p>{current.sessionOverview}</p>
        </div>
      )}

      {current.preparationTips?.length > 0 && (
        <div className="card skills-section" style={{ marginBottom: 16 }}>
          <h4 className="skills-section__title">
            <span className="material-icons" style={{ color: '#f59e0b' }}>tips_and_updates</span>
            Preparation Tips
          </h4>
          <ul className="recruiter-list">
            {current.preparationTips.map((t, i) => (
              <li key={i}><span className="material-icons">chevron_right</span>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Questions */}
      <div className="interview-questions">
        {current.questions.map((q, i) => (
          <QuestionCard
            key={i} q={q} index={i} sessionId={current._id}
            onFeedbackSaved={updated => setCurrent(prev => ({
              ...prev,
              readinessScore: updated.readinessScore,
              questions: prev.questions.map((pq, pi) => pi === i ? updated.question : pq),
            }))}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryList({ onSelect }) {
  const { user }       = useAuth();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getInterviewHistory(() => user.getIdToken());
        setItems(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <div className="card career-skeleton" style={{ height: 100 }} />;
  if (error)   return <p style={{ color: '#ef4444', padding: '12px 0' }}>{error}</p>;
  if (!items.length) return (
    <div className="career-empty" style={{ padding: '32px 0', textAlign: 'center' }}>
      <span className="material-icons" style={{ fontSize: 40, color: 'var(--text-muted)' }}>history</span>
      <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>No past sessions yet.</p>
    </div>
  );

  return (
    <div className="history-list">
      {items.map(s => {
        const typeMeta = TYPE_META[s.interviewType] || TYPE_META.mixed;
        const diffMeta = DIFF_META[s.difficulty]    || DIFF_META.medium;
        const answered = s.questions.filter(q => q.aiFeedback).length;
        return (
          <button key={s._id} className="history-item card" onClick={() => onSelect(s)}>
            <div className="history-item__info">
              <strong className="history-item__role">{s.role}</strong>
              {s.company && <span className="history-item__company">{s.company}</span>}
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <span className="career-chip" style={{ background: typeMeta.bg, color: typeMeta.color, fontSize: 11 }}>{typeMeta.label}</span>
                <span className="career-chip" style={{ background: diffMeta.bg, color: diffMeta.color, fontSize: 11 }}>{diffMeta.label}</span>
                <span className="career-chip" style={{ fontSize: 11 }}>
                  {answered}/{s.questions.length} answered
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {s.readinessScore != null && <ScoreRing score={s.readinessScore} />}
              <span className="material-icons" style={{ color: 'var(--text-muted)' }}>chevron_right</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function InterviewPrepPanel() {
  const { user }        = useAuth();
  const [view, setView] = useState('generate'); // 'generate' | 'session' | 'history'
  const [form, setForm] = useState(EMPTY_FORM);
  const [session, setSession]     = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');
    if (!form.role.trim()) { setError('Role is required.'); return; }
    setGenerating(true);
    try {
      const res = await createInterviewSession(() => user.getIdToken(), {
        company:       form.company.trim() || undefined,
        role:          form.role.trim(),
        interviewType: form.type,
        difficulty:    form.difficulty,
        questionCount: Number(form.questionCount),
      });
      setSession(res.data);
      setView('session');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSelectHistory(item) {
    try {
      const res = await getInterviewSession(() => user.getIdToken(), item._id);
      setSession(res.data);
      setView('session');
    } catch {
      setSession(item);
      setView('session');
    }
  }

  return (
    <div className="interview-prep-panel">
      {/* Sub-navigation */}
      <div className="interview-subnav">
        {[
          { key: 'generate', icon: 'add_circle', label: 'New Session' },
          { key: 'history',  icon: 'history',    label: 'History'     },
        ].map(t => (
          <button
            key={t.key}
            className={`interview-subnav__tab${view === t.key || (view === 'session' && t.key === 'generate') ? ' interview-subnav__tab--active' : ''}`}
            onClick={() => { if (t.key === 'generate') { setView('generate'); setSession(null); } else setView(t.key); }}
            type="button"
          >
            <span className="material-icons">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Generate form */}
      {view === 'generate' && (
        <div className="card interview-form">
          <div className="salary-form__header">
            <span className="material-icons" style={{ color: '#6366f1', fontSize: 28 }}>record_voice_over</span>
            <div>
              <h3 className="salary-form__title">AI Interview Prep</h3>
              <p className="salary-form__sub">Get tailored interview questions with hints, sample answers, and AI feedback on your responses</p>
            </div>
          </div>
          <form onSubmit={handleGenerate}>
            <div className="salary-form__fields">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Target Role *</label>
                <input className="form-control" placeholder="e.g. Senior Frontend Engineer"
                  value={form.role} onChange={e => set('role', e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Company (optional)</label>
                <input className="form-control" placeholder="e.g. Google"
                  value={form.company} onChange={e => set('company', e.target.value)} />
              </div>
            </div>
            <div className="salary-form__fields">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Interview Type</label>
                <select className="form-control" value={form.type} onChange={e => set('type', e.target.value)}>
                  {Object.entries(TYPE_META).map(([v, m]) => (
                    <option key={v} value={v}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Difficulty</label>
                <select className="form-control" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                  {Object.entries(DIFF_META).map(([v, m]) => (
                    <option key={v} value={v}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">No. of Questions</label>
                <input type="number" className="form-control" min="3" max="10" step="1"
                  value={form.questionCount} onChange={e => set('questionCount', e.target.value)} />
              </div>
            </div>
            {error && <div className="modal-error"><span className="material-icons">error_outline</span>{error}</div>}
            <button type="submit" className="btn btn--primary" disabled={generating} style={{ marginTop: 12 }}>
              <span className="material-icons">{generating ? 'hourglass_top' : 'auto_awesome'}</span>
              {generating ? 'Generating Questions…' : 'Start Interview Prep'}
            </button>
          </form>
        </div>
      )}

      {/* Active session */}
      {view === 'session' && session && (
        <SessionView session={session} onBack={() => { setView('generate'); setSession(null); }} />
      )}

      {/* History */}
      {view === 'history' && (
        <HistoryList onSelect={handleSelectHistory} />
      )}
    </div>
  );
}
