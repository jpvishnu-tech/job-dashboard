import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getRoadmap, generateRoadmap, updateProgress } from '../../../services/career';

const DIFFICULTY_META = {
  beginner:     { label: 'Beginner',     color: '#10b981', bg: '#d1fae5' },
  intermediate: { label: 'Intermediate', color: '#f59e0b', bg: '#fef3c7' },
  advanced:     { label: 'Advanced',     color: '#ef4444', bg: '#fee2e2' },
};

const RESOURCE_TYPE_ICONS = {
  course:   'school',
  book:     'menu_book',
  project:  'code',
  practice: 'fitness_center',
  article:  'article',
};

const PROGRESS_META = {
  not_started: { icon: 'radio_button_unchecked', color: '#94a3b8', label: 'Not started' },
  in_progress: { icon: 'pending',                color: '#3b82f6', label: 'In progress' },
  completed:   { icon: 'check_circle',           color: '#10b981', label: 'Completed'   },
};

const EMPTY_FORM = {
  targetRole: '', currentRole: '', experienceLevel: 'mid',
  timelineMonths: 12, goals: '',
};

function PhaseCard({ phase, progressMap, onProgressChange }) {
  const [open, setOpen] = useState(phase.phase <= 2);

  return (
    <div className="phase-card card">
      <div className="phase-number">{phase.phase}</div>
      <div className="phase-card__body">
        <button className="phase-card__header" onClick={() => setOpen(p => !p)} type="button">
          <div>
            <div className="phase-card__title">{phase.title}</div>
            <div className="phase-card__meta">
              <span className="material-icons">schedule</span>{phase.duration}
              {phase.focus && <> &mdash; <em>{phase.focus}</em></>}
            </div>
          </div>
          <span className="material-icons phase-chevron">{open ? 'expand_less' : 'expand_more'}</span>
        </button>

        {open && (
          <div className="phase-card__content">
            {/* Skills with progress */}
            {phase.skills?.length > 0 && (
              <div className="phase-section">
                <p className="phase-section__label">
                  <span className="material-icons">psychology</span> Skills to learn
                </p>
                <div className="phase-skills">
                  {phase.skills.map((skill, i) => {
                    const status = progressMap[skill] || 'not_started';
                    const pm     = PROGRESS_META[status];
                    return (
                      <button
                        key={i}
                        className={`skill-progress-chip skill-progress-chip--${status}`}
                        onClick={() => onProgressChange(skill, nextStatus(status))}
                        title={`Status: ${pm.label} — click to cycle`}
                      >
                        <span className="material-icons" style={{ color: pm.color }}>{pm.icon}</span>
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Milestones */}
            {phase.milestones?.length > 0 && (
              <div className="phase-section">
                <p className="phase-section__label">
                  <span className="material-icons">flag</span> Milestones
                </p>
                <ul className="phase-list">
                  {phase.milestones.map((m, i) => (
                    <li key={i}><span className="material-icons">chevron_right</span>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resources */}
            {phase.resources?.length > 0 && (
              <div className="phase-section">
                <p className="phase-section__label">
                  <span className="material-icons">library_books</span> Resources
                </p>
                <div className="phase-resources">
                  {phase.resources.map((r, i) => (
                    <span key={i} className={`resource-chip resource-chip--${r.priority || 'medium'}`}>
                      <span className="material-icons">{RESOURCE_TYPE_ICONS[r.type] || 'link'}</span>
                      {r.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function nextStatus(s) {
  return s === 'not_started' ? 'in_progress' : s === 'in_progress' ? 'completed' : 'not_started';
}

export default function RoadmapPanel() {
  const { user } = useAuth();
  const [plan,      setPlan]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [generating,setGenerating]= useState(false);
  const [error,     setError]     = useState('');
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [showForm,  setShowForm]  = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getRoadmap(() => user.getIdToken());
      setPlan(res.data);
      if (res.data) {
        setForm(f => ({
          ...f,
          targetRole:       res.data.targetRole       || '',
          currentRole:      res.data.currentRole      || '',
          experienceLevel:  res.data.experienceLevel  || 'mid',
          timelineMonths:   res.data.timelineMonths   || 12,
          goals:            (res.data.goals || []).join('\n'),
        }));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');
    if (!form.targetRole.trim()) { setError('Target role is required.'); return; }
    setGenerating(true);
    try {
      const res = await generateRoadmap(() => user.getIdToken(), {
        targetRole:      form.targetRole.trim(),
        currentRole:     form.currentRole.trim(),
        experienceLevel: form.experienceLevel,
        timelineMonths:  Number(form.timelineMonths),
        goals:           form.goals.split('\n').map(g => g.trim()).filter(Boolean),
      });
      setPlan(res.data);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleProgressChange(skill, status) {
    try {
      await updateProgress(() => user.getIdToken(), { skill, status });
      setPlan(prev => {
        if (!prev) return prev;
        const lp = prev.learningProgress.map(p =>
          p.skill === skill ? { ...p, status } : p
        );
        return { ...prev, learningProgress: lp };
      });
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="roadmap-panel">
        {[1,2,3].map(i => <div key={i} className="card career-skeleton" style={{ height: 80 }} />)}
      </div>
    );
  }

  const roadmap       = plan?.roadmap;
  const hasRoadmap    = roadmap?.phases?.length > 0;
  const progressMap   = Object.fromEntries((plan?.learningProgress || []).map(p => [p.skill, p.status]));
  const diffMeta      = DIFFICULTY_META[roadmap?.difficulty] || DIFFICULTY_META.intermediate;

  const completedSkills = (plan?.learningProgress || []).filter(p => p.status === 'completed').length;
  const totalSkills     = (plan?.learningProgress || []).length;

  return (
    <div className="roadmap-panel">
      {/* Generate / Regenerate form */}
      {(!hasRoadmap || showForm) && (
        <div className="card roadmap-form">
          <div className="roadmap-form__header">
            <span className="material-icons" style={{ color: '#6366f1', fontSize: 28 }}>explore</span>
            <div>
              <h3 className="roadmap-form__title">
                {hasRoadmap ? 'Regenerate Career Roadmap' : 'Generate Your Career Roadmap'}
              </h3>
              <p className="roadmap-form__sub">
                AI will create a personalised, phase-by-phase learning plan based on your profile.
              </p>
            </div>
          </div>
          <form onSubmit={handleGenerate}>
            <div className="modal-grid">
              <div className="form-group">
                <label className="form-label">Target Role *</label>
                <input className="form-control" placeholder="e.g. Senior Backend Engineer"
                  value={form.targetRole} onChange={e => set('targetRole', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Current Role</label>
                <input className="form-control" placeholder="e.g. Junior Developer"
                  value={form.currentRole} onChange={e => set('currentRole', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select className="form-control" value={form.experienceLevel} onChange={e => set('experienceLevel', e.target.value)}>
                  <option value="entry">Entry (0-2 yrs)</option>
                  <option value="mid">Mid (2-5 yrs)</option>
                  <option value="senior">Senior (5-8 yrs)</option>
                  <option value="lead">Lead (8+ yrs)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Timeline (months)</label>
                <input type="number" className="form-control" min="3" max="36" step="3"
                  value={form.timelineMonths} onChange={e => set('timelineMonths', e.target.value)} />
              </div>
              <div className="form-group form-group--full">
                <label className="form-label">Goals (one per line, optional)</label>
                <textarea className="form-control" rows={3}
                  placeholder="e.g. Land a role at a FAANG company&#10;Improve system design skills&#10;Build a portfolio project"
                  value={form.goals} onChange={e => set('goals', e.target.value)} />
              </div>
            </div>
            {error && <div className="modal-error"><span className="material-icons">error_outline</span>{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" className="btn btn--primary" disabled={generating}>
                <span className="material-icons">{generating ? 'hourglass_top' : 'auto_awesome'}</span>
                {generating ? 'Generating Roadmap…' : 'Generate Roadmap'}
              </button>
              {hasRoadmap && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowForm(false)}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Roadmap display */}
      {hasRoadmap && !showForm && (
        <>
          {/* Summary header */}
          <div className="card roadmap-summary">
            <div className="roadmap-summary__top">
              <div className="roadmap-summary__info">
                <div className="roadmap-summary__route">
                  <span className="roadmap-summary__role roadmap-summary__role--current">
                    {plan.currentRole || 'Current Role'}
                  </span>
                  <span className="material-icons roadmap-arrow">arrow_forward</span>
                  <span className="roadmap-summary__role roadmap-summary__role--target">
                    {plan.targetRole}
                  </span>
                </div>
                <p className="roadmap-summary__text">{roadmap.summary}</p>
              </div>
              <div className="roadmap-summary__meta">
                <span className="career-chip" style={{ background: diffMeta.bg, color: diffMeta.color }}>
                  <span className="material-icons">bar_chart</span>{diffMeta.label}
                </span>
                <span className="career-chip">
                  <span className="material-icons">schedule</span>{roadmap.totalDuration}
                </span>
                {totalSkills > 0 && (
                  <span className="career-chip career-chip--progress">
                    <span className="material-icons">checklist</span>
                    {completedSkills}/{totalSkills} skills
                  </span>
                )}
                <button className="btn btn--ghost btn--sm" onClick={() => setShowForm(true)}>
                  <span className="material-icons">refresh</span> Regenerate
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {totalSkills > 0 && (
              <div className="roadmap-progress-bar">
                <div
                  className="roadmap-progress-bar__fill"
                  style={{ width: `${Math.round(completedSkills / totalSkills * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Market insight */}
          {roadmap.marketInsight && (
            <div className="card roadmap-market-insight">
              <span className="material-icons" style={{ color: '#6366f1' }}>insights</span>
              <p>{roadmap.marketInsight}</p>
            </div>
          )}

          {/* Quick wins */}
          {roadmap.quickWins?.length > 0 && (
            <div className="card roadmap-quick-wins">
              <h4 className="roadmap-section-title">
                <span className="material-icons">bolt</span> Quick Wins This Week
              </h4>
              <div className="quick-wins-grid">
                {roadmap.quickWins.map((w, i) => (
                  <div key={i} className="quick-win-card">
                    <span className="material-icons quick-win-icon">task_alt</span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key technologies */}
          {roadmap.keyTechnologies?.length > 0 && (
            <div className="card roadmap-key-tech">
              <h4 className="roadmap-section-title">
                <span className="material-icons">devices</span> Key Technologies to Master
              </h4>
              <div className="key-tech-chips">
                {roadmap.keyTechnologies.map((t, i) => (
                  <span key={i} className="key-tech-chip">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Phase timeline */}
          <div>
            <h4 className="roadmap-section-title" style={{ marginBottom: 20 }}>
              <span className="material-icons">timeline</span> Learning Roadmap
              <span className="roadmap-section-sub">Click skills to track progress</span>
            </h4>
            <div className="roadmap-timeline">
              {roadmap.phases.map(phase => (
                <PhaseCard
                  key={phase.phase}
                  phase={phase}
                  progressMap={progressMap}
                  onProgressChange={handleProgressChange}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
