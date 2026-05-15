import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getRecommendations } from '../../../services/automation';

const CATEGORY_META = {
  missing_skills: {
    icon:  'add_task',
    label: 'Missing Skills',
    color: '#8b5cf6',
    bg:    '#ede9fe',
    desc:  'Skills and certifications to add or highlight',
  },
  ats_improvements: {
    icon:  'tune',
    label: 'ATS Improvements',
    color: '#3b82f6',
    bg:    '#dbeafe',
    desc:  'Formatting and structure changes to pass ATS filters',
  },
  keyword_optimization: {
    icon:  'key',
    label: 'Keyword Optimization',
    color: '#f59e0b',
    bg:    '#fef3c7',
    desc:  'Keywords and phrases missing from your resume',
  },
  experience_improvements: {
    icon:  'workspace_premium',
    label: 'Experience Improvements',
    color: '#10b981',
    bg:    '#d1fae5',
    desc:  'Ways to better quantify and present your achievements',
  },
};

function ScoreRing({ score, color }) {
  const r   = 15.9;
  const pct = Math.min(100, Math.max(0, score ?? 0));
  return (
    <div className="score-ring-wrap">
      <svg viewBox="0 0 36 36" className="score-ring">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border-color)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${pct} ${100 - pct}`}
          strokeDashoffset="25"
          strokeLinecap="round"
        />
      </svg>
      <span className="score-ring__val" style={{ color }}>{pct}</span>
    </div>
  );
}

function CategoryCard({ catKey, items }) {
  const meta     = CATEGORY_META[catKey];
  const [open, setOpen] = useState(true);
  if (!items?.length) return null;

  return (
    <div className="rec-category card">
      <button
        className="rec-category__header"
        onClick={() => setOpen(p => !p)}
        type="button"
      >
        <div className="rec-category__title">
          <div className="rec-category__icon" style={{ background: meta.bg, color: meta.color }}>
            <span className="material-icons">{meta.icon}</span>
          </div>
          <div>
            <strong>{meta.label}</strong>
            <p className="rec-category__desc">{meta.desc}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="rec-count-badge" style={{ background: meta.bg, color: meta.color }}>
            {items.length}
          </span>
          <span className="material-icons rec-chevron">{open ? 'expand_less' : 'expand_more'}</span>
        </div>
      </button>
      {open && (
        <ul className="rec-items">
          {items.map((item, i) => (
            <li key={i} className="rec-item">
              <span className="material-icons rec-item__dot" style={{ color: meta.color }}>fiber_manual_record</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RecommendationsPanel() {
  const { user }    = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getRecommendations(() => user.getIdToken());
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="rec-panel">
        {[1, 2, 3, 4].map(i => <div key={i} className="rec-category card auto-skeleton" style={{ height: 80 }} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rec-panel">
        <div className="card auto-empty">
          <span className="material-icons">error_outline</span>
          <h3>Couldn't load recommendations</h3>
          <p>{error}</p>
          <button className="btn btn--secondary btn--sm" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data?.hasResume) {
    return (
      <div className="rec-panel">
        <div className="card auto-empty">
          <span className="material-icons">description</span>
          <h3>No resume uploaded</h3>
          <p>Upload your resume to get AI-powered recommendations for improving your job search.</p>
          <a href="/resume" className="btn btn--primary btn--sm">Upload Resume</a>
        </div>
      </div>
    );
  }

  if (!data?.hasAnalysis) {
    return (
      <div className="rec-panel">
        <div className="card auto-empty">
          <span className="material-icons">analytics</span>
          <h3>Resume not yet analysed</h3>
          <p>Run an AI analysis on your resume to unlock personalised improvement recommendations.</p>
          <a href="/resume" className="btn btn--primary btn--sm">Analyse Resume</a>
        </div>
      </div>
    );
  }

  const { atsScore, analyzedAt, strengths, skillsFound, categories } = data;
  const totalItems = Object.values(categories || {}).reduce((n, arr) => n + (arr?.length || 0), 0);
  const scoreColor = atsScore >= 80 ? '#10b981' : atsScore >= 60 ? '#3b82f6' : '#f59e0b';

  return (
    <div className="rec-panel">
      {/* Score summary */}
      <div className="rec-summary card">
        <div className="rec-summary__score">
          <ScoreRing score={atsScore} color={scoreColor} />
          <div>
            <strong className="rec-summary__score-label" style={{ color: scoreColor }}>
              ATS Score
            </strong>
            <p className="rec-summary__score-sub">
              {atsScore >= 80 ? 'Great — highly ATS-compatible' : atsScore >= 60 ? 'Good — a few tweaks recommended' : 'Needs improvement — act on items below'}
            </p>
          </div>
        </div>
        <div className="rec-summary__meta">
          {analyzedAt && (
            <span className="rec-meta-chip">
              <span className="material-icons">update</span>
              Analysed {new Date(analyzedAt).toLocaleDateString()}
            </span>
          )}
          <span className="rec-meta-chip">
            <span className="material-icons">tips_and_updates</span>
            {totalItems} improvement{totalItems !== 1 ? 's' : ''} found
          </span>
          <a href="/resume" className="btn btn--ghost btn--sm">
            <span className="material-icons">refresh</span>
            Re-analyse
          </a>
        </div>
      </div>

      {/* Strengths */}
      {strengths?.length > 0 && (
        <div className="rec-strengths card">
          <div className="rec-strengths__header">
            <span className="material-icons" style={{ color: '#10b981' }}>verified</span>
            <strong>Resume Strengths</strong>
          </div>
          <div className="rec-strengths__chips">
            {strengths.map((s, i) => (
              <span key={i} className="strength-chip">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Improvement categories */}
      {totalItems === 0 ? (
        <div className="card auto-empty">
          <span className="material-icons">task_alt</span>
          <h3>Resume looks great!</h3>
          <p>No significant improvements found. Keep applying and update your resume as your experience grows.</p>
        </div>
      ) : (
        <div className="rec-categories">
          {Object.entries(categories).map(([key, items]) => (
            <CategoryCard key={key} catKey={key} items={items} />
          ))}
        </div>
      )}

      {/* Skills found */}
      {skillsFound?.length > 0 && (
        <div className="rec-skills card">
          <div className="rec-strengths__header">
            <span className="material-icons" style={{ color: '#6366f1' }}>psychology</span>
            <strong>Skills Detected on Resume</strong>
          </div>
          <div className="rec-strengths__chips">
            {skillsFound.slice(0, 20).map((s, i) => (
              <span key={i} className="skill-chip">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
