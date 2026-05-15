import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getSkillsGap, refreshSkillsGap } from '../../../services/career';

const PRIORITY_META = {
  critical:     { label: 'Critical',      color: '#ef4444', bg: '#fee2e2' },
  important:    { label: 'Important',     color: '#f59e0b', bg: '#fef3c7' },
  nice_to_have: { label: 'Nice to have',  color: '#64748b', bg: '#f1f5f9' },
};

const DEMAND_META = {
  very_high: { label: 'Very High', width: '95%', color: '#6366f1' },
  high:      { label: 'High',      width: '72%', color: '#3b82f6' },
  medium:    { label: 'Medium',    width: '48%', color: '#f59e0b' },
  low:       { label: 'Low',       width: '25%', color: '#94a3b8' },
};

const ADOPTION_META = {
  mainstream:  { label: 'Mainstream',  bg: '#d1fae5', color: '#065f46' },
  emerging:    { label: 'Emerging',    bg: '#dbeafe', color: '#1e40af' },
  cutting_edge:{ label: 'Cutting Edge',bg: '#ede9fe', color: '#4c1d95' },
};

const TREND_META = {
  growing:   { icon: 'trending_up',   color: '#10b981' },
  stable:    { icon: 'trending_flat', color: '#64748b' },
  declining: { icon: 'trending_down', color: '#ef4444' },
};

export default function SkillsGapPanel() {
  const { user }  = useAuth();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,    setError]    = useState(null);
  const [roleInput,setRoleInput]= useState('');

  const load = useCallback(async (targetRole) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getSkillsGap(() => user.getIdToken(), targetRole || undefined);
      setData(res.data);
      if (res.data?.targetRoleOverview === undefined && !res.data?.hasTargetRole) {
        // no target role
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleRefresh(e) {
    e.preventDefault();
    setRefreshing(true);
    setError(null);
    try {
      const res = await refreshSkillsGap(() => user.getIdToken(), { targetRole: roleInput.trim() || undefined });
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="skills-gap-panel">
        {[1,2,3].map(i => <div key={i} className="card career-skeleton" style={{ height: 120 }} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="skills-gap-panel">
        <div className="card career-empty">
          <span className="material-icons">error_outline</span>
          <h3>Couldn't load skills gap analysis</h3>
          <p>{error}</p>
          <button className="btn btn--secondary btn--sm" onClick={() => load()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data?.hasProfile) {
    return (
      <div className="skills-gap-panel">
        <div className="card career-empty">
          <span className="material-icons">manage_accounts</span>
          <h3>{!data?.hasResume ? 'No resume uploaded' : 'Resume not analysed yet'}</h3>
          <p>
            {!data?.hasResume
              ? 'Upload your resume to get a personalised skills gap analysis.'
              : 'Run an AI analysis on your resume first to extract your skills profile.'}
          </p>
          <a href="/resume" className="btn btn--primary btn--sm">
            {!data?.hasResume ? 'Upload Resume' : 'Analyse Resume'}
          </a>
        </div>
      </div>
    );
  }

  if (!data?.hasTargetRole && !data?.targetRoleOverview) {
    return (
      <div className="skills-gap-panel">
        <div className="card career-empty">
          <span className="material-icons">explore</span>
          <h3>Set a target role to analyse</h3>
          <p>Enter the role you're aiming for to get a detailed skills gap analysis.</p>
          <form onSubmit={handleRefresh} style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <input className="form-control" style={{ maxWidth: 280 }}
              placeholder="e.g. Senior Full Stack Engineer"
              value={roleInput} onChange={e => setRoleInput(e.target.value)} required />
            <button type="submit" className="btn btn--primary btn--sm" disabled={refreshing}>
              <span className="material-icons">auto_awesome</span>
              {refreshing ? 'Analysing…' : 'Analyse'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const matchColor = data.matchScore >= 70 ? '#10b981' : data.matchScore >= 45 ? '#f59e0b' : '#ef4444';

  return (
    <div className="skills-gap-panel">
      {/* Header */}
      <div className="card skills-gap-header">
        <div className="skills-gap-header__left">
          <div className="match-score-ring">
            <svg viewBox="0 0 36 36" className="match-ring-svg">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border-color)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={matchColor} strokeWidth="3"
                strokeDasharray={`${data.matchScore ?? 0} ${100 - (data.matchScore ?? 0)}`}
                strokeDashoffset="25" strokeLinecap="round" />
            </svg>
            <span className="match-ring-val" style={{ color: matchColor }}>{data.matchScore ?? '—'}</span>
          </div>
          <div>
            <p className="skills-gap-header__overview">{data.targetRoleOverview}</p>
            {data.analysedAt && (
              <span className="career-meta-chip">
                <span className="material-icons">update</span>
                Analysed {new Date(data.analysedAt).toLocaleDateString()}
                {data.cached && ' (cached)'}
              </span>
            )}
          </div>
        </div>
        <form onSubmit={handleRefresh} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="form-control" style={{ width: 200, fontSize: 13 }}
            placeholder="Change target role…"
            value={roleInput} onChange={e => setRoleInput(e.target.value)} />
          <button type="submit" className="btn btn--ghost btn--sm" disabled={refreshing}>
            <span className="material-icons">refresh</span>
            {refreshing ? 'Analysing…' : 'Refresh'}
          </button>
        </form>
      </div>

      <div className="skills-gap-body">
        {/* Left column: strengths + priority path */}
        <div className="skills-gap-col">
          {/* Current Strengths */}
          {data.currentStrengths?.length > 0 && (
            <div className="card skills-section">
              <h4 className="skills-section__title">
                <span className="material-icons" style={{ color: '#10b981' }}>verified</span>
                Current Strengths
              </h4>
              <div className="strengths-chips">
                {data.currentStrengths.map((s, i) => (
                  <span key={i} className="strength-chip-lg">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Priority Learning Path */}
          {data.priorityLearningPath?.length > 0 && (
            <div className="card skills-section">
              <h4 className="skills-section__title">
                <span className="material-icons" style={{ color: '#6366f1' }}>route</span>
                Priority Learning Path
              </h4>
              <ol className="priority-path">
                {data.priorityLearningPath.map((skill, i) => (
                  <li key={i} className="priority-path__item">
                    <span className="priority-path__num">{i + 1}</span>
                    {skill}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Recruiter Expectations */}
          {data.recruiterExpectations?.length > 0 && (
            <div className="card skills-section">
              <h4 className="skills-section__title">
                <span className="material-icons" style={{ color: '#f59e0b' }}>person_search</span>
                Recruiter Expectations
              </h4>
              <ul className="recruiter-list">
                {data.recruiterExpectations.map((exp, i) => (
                  <li key={i}><span className="material-icons">chevron_right</span>{exp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column: missing skills + trending techs */}
        <div className="skills-gap-col">
          {/* Missing Skills */}
          {data.missingSkills?.length > 0 && (
            <div className="card skills-section">
              <h4 className="skills-section__title">
                <span className="material-icons" style={{ color: '#ef4444' }}>add_task</span>
                Skills to Acquire ({data.missingSkills.length})
              </h4>
              <div className="missing-skills-list">
                {data.missingSkills.map((s, i) => {
                  const pMeta = PRIORITY_META[s.priority] || PRIORITY_META.important;
                  const dMeta = DEMAND_META[s.demandLevel] || DEMAND_META.medium;
                  const tMeta = TREND_META[s.trend]        || TREND_META.stable;
                  return (
                    <div key={i} className="missing-skill-row">
                      <div className="missing-skill-row__header">
                        <span className="missing-skill-name">{s.skill}</span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span className="career-chip" style={{ background: pMeta.bg, color: pMeta.color, fontSize: 11 }}>
                            {pMeta.label}
                          </span>
                          <span className="material-icons" style={{ color: tMeta.color, fontSize: 16 }} title={s.trend}>
                            {tMeta.icon}
                          </span>
                        </div>
                      </div>
                      <div className="demand-bar-wrap">
                        <div className="demand-bar" style={{ width: dMeta.width, background: dMeta.color }} />
                      </div>
                      <div className="missing-skill-row__footer">
                        <span>Demand: {dMeta.label}</span>
                        <span>~{s.estimatedLearningWeeks}w to learn</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trending Technologies */}
          {data.trendingTechnologies?.length > 0 && (
            <div className="card skills-section">
              <h4 className="skills-section__title">
                <span className="material-icons" style={{ color: '#8b5cf6' }}>trending_up</span>
                Trending in {data.priorityLearningPath?.[0] ? 'This Field' : 'Tech'}
              </h4>
              <div className="trending-grid">
                {data.trendingTechnologies.map((t, i) => {
                  const adMeta = ADOPTION_META[t.adoptionStage] || ADOPTION_META.mainstream;
                  const dMeta  = DEMAND_META[t.demandLevel]     || DEMAND_META.high;
                  return (
                    <div key={i} className="trending-tech-card">
                      <span className="trending-tech-name">{t.tech}</span>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <span className="career-chip" style={{ background: adMeta.bg, color: adMeta.color, fontSize: 10 }}>
                          {adMeta.label}
                        </span>
                        <span style={{ fontSize: 11, color: dMeta.color, fontWeight: 600 }}>
                          {dMeta.label} demand
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
