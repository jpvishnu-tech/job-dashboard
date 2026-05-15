import { useState } from 'react';
import { useAuth }  from '../../../context/AuthContext';
import { optimizeResume } from '../../../services/resumeOptimizer';

function clr(n) {
  if (n >= 75) return '#16a34a';
  if (n >= 55) return 'var(--color-primary)';
  if (n >= 35) return '#d97706';
  return '#dc2626';
}

function lbl(n) {
  if (n >= 85) return 'Well Optimized';
  if (n >= 65) return 'Good Fit';
  if (n >= 45) return 'Needs Tailoring';
  return 'Major Rewrite Needed';
}

function ScoreRing({ score, label, size = 100 }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - circ * Math.min(100, Math.max(0, score ?? 0)) / 100;
  const color = clr(score ?? 0);
  return (
    <div className="ro-score-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 90 90" width={size} height={size} aria-hidden="true">
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--border-color,#e2e8f0)" strokeWidth="7" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="ro-score-ring__inner">
        <span className="ro-score-ring__val" style={{ color }}>{score ?? '–'}</span>
        <span className="ro-score-ring__lbl">{label}</span>
      </div>
    </div>
  );
}

function List({ items, icon = 'arrow_forward', color }) {
  if (!items?.length) return <li style={{ color: 'var(--text-muted)', fontSize: 13 }}>None identified</li>;
  return items.map((item, i) => (
    <li key={i}>
      <span className="material-icons" style={{ fontSize: 14, color: color || 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
      {item}
    </li>
  ));
}

function KeywordPill({ item, variant }) {
  const keyword = typeof item === 'string' ? item : item?.keyword;
  const context = typeof item === 'object' ? item?.context : null;
  return (
    <div className={`ro-kw-pill ro-kw-pill--${variant}`} title={context || keyword}>
      <span>{keyword}</span>
      {context && <span className="ro-kw-pill__ctx">{context}</span>}
    </div>
  );
}

function OptimizerResult({ result }) {
  const sec = result.sectionSuggestions || {};
  const ACTION_ICON = { rewrite: 'edit', enhance: 'upgrade', add: 'add_circle', improve: 'trending_up', add_metrics: 'bar_chart', add_keywords: 'sell', reorganize: 'reorder', remove_generic: 'delete_sweep', expand: 'open_in_full', add_irrelevant: 'remove_circle', remove_irrelevant: 'remove_circle' };

  return (
    <div className="ro-result">
      {/* Score + target role */}
      <div className="ro-opt-header">
        <ScoreRing score={result.optimizationScore} label="Fit Score" size={110} />
        <div className="ro-opt-meta">
          {result.targetRole && (
            <div className="ro-opt-role">
              <span className="material-icons">work</span>
              {result.targetRole}
            </div>
          )}
          <span className="ro-score-grade" style={{ color: clr(result.optimizationScore) }}>{lbl(result.optimizationScore)}</span>
          {result.overallFeedback && <p className="ro-feedback">{result.overallFeedback}</p>}
        </div>
      </div>

      {/* Keyword recommendations */}
      <div className="ro-card">
        <h4 className="ro-card__title"><span className="material-icons">sell</span> Keywords to Add</h4>
        {result.keywordsToAdd?.mustHave?.length > 0 && (
          <div className="ro-kw-group">
            <span className="ro-kw-group__label ro-kw-group__label--red">Must Have</span>
            <div className="ro-kw-pills">
              {result.keywordsToAdd.mustHave.map((k, i) => <KeywordPill key={i} item={k} variant="red" />)}
            </div>
          </div>
        )}
        {result.keywordsToAdd?.shouldHave?.length > 0 && (
          <div className="ro-kw-group">
            <span className="ro-kw-group__label ro-kw-group__label--amber">Should Have</span>
            <div className="ro-kw-pills">
              {result.keywordsToAdd.shouldHave.map((k, i) => <KeywordPill key={i} item={k} variant="amber" />)}
            </div>
          </div>
        )}
        {result.keywordsToAdd?.niceToHave?.length > 0 && (
          <div className="ro-kw-group">
            <span className="ro-kw-group__label">Nice to Have</span>
            <div className="ro-kw-pills">
              {result.keywordsToAdd.niceToHave.map((k, i) => <KeywordPill key={i} item={k} variant="muted" />)}
            </div>
          </div>
        )}
      </div>

      {/* Missing skills */}
      <div className="ro-two-col">
        <div className="ro-card ro-card--red">
          <h4 className="ro-card__title"><span className="material-icons">code</span> Missing Skills</h4>
          {result.missingSkills?.technical?.length > 0 && (
            <>
              <span className="ro-tag-label">Technical</span>
              <ul className="ro-list"><List items={result.missingSkills.technical} icon="code" color="#dc2626" /></ul>
            </>
          )}
          {result.missingSkills?.tools?.length > 0 && (
            <>
              <span className="ro-tag-label">Tools</span>
              <ul className="ro-list"><List items={result.missingSkills.tools} icon="build" color="#dc2626" /></ul>
            </>
          )}
          {result.missingSkills?.soft?.length > 0 && (
            <>
              <span className="ro-tag-label">Soft Skills</span>
              <ul className="ro-list"><List items={result.missingSkills.soft} icon="people" color="#dc2626" /></ul>
            </>
          )}
        </div>

        <div className="ro-card ro-card--green">
          <h4 className="ro-card__title"><span className="material-icons">star</span> Your Strengths for This Role</h4>
          <ul className="ro-list"><List items={result.strengthsForRole} icon="check_circle" color="#16a34a" /></ul>
          {result.gapsForRole?.length > 0 && (
            <>
              <h5 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 12 }}>Gaps to Address</h5>
              <ul className="ro-list"><List items={result.gapsForRole} icon="error_outline" color="#d97706" /></ul>
            </>
          )}
        </div>
      </div>

      {/* Section suggestions */}
      {Object.keys(sec).length > 0 && (
        <div className="ro-card">
          <h4 className="ro-card__title"><span className="material-icons">edit_note</span> Section-by-Section Improvements</h4>
          {Object.entries(sec).map(([key, val]) => (
            <div key={key} className="ro-section-suggestion">
              <div className="ro-section-suggestion__head">
                <span className="material-icons" style={{ fontSize: 15 }}>{ACTION_ICON[val?.action] || 'edit'}</span>
                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}</strong>
                <span className="ro-action-badge">{val?.action}</span>
              </div>
              <p className="ro-section-suggestion__tip">{val?.tip}</p>
              {val?.example && (
                <pre className="ro-section-suggestion__example">{val.example}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tailored recommendations */}
      <div className="ro-card">
        <h4 className="ro-card__title"><span className="material-icons">tips_and_updates</span> Tailored Recommendations</h4>
        <ul className="ro-list"><List items={result.tailoredRecommendations} icon="arrow_forward" /></ul>
      </div>

      {/* Missing technologies */}
      {result.missingTechnologies?.length > 0 && (
        <div className="ro-tags-row">
          <span className="ro-tags-label">Technologies to Add:</span>
          {result.missingTechnologies.map((t, i) => (
            <span key={i} className="ro-tag ro-tag--red">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OptimizerPanel({ hasResume }) {
  const { user }    = useAuth();
  const [jobDesc, setJobDesc]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [result,  setResult]    = useState(null);

  async function handleOptimize() {
    if (jobDesc.trim().length < 30) {
      setError('Please paste a job description (at least a few sentences).');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await optimizeResume(() => user.getIdToken(), jobDesc.trim());
      setResult(data.data.result);
    } catch (err) {
      setError(err.message || 'Optimization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!hasResume) {
    return (
      <div className="ro-empty-state">
        <span className="material-icons ro-empty-state__icon">work</span>
        <p>Upload a resume to run job-specific optimization.</p>
      </div>
    );
  }

  return (
    <div className="ro-panel">
      <div className="ro-panel__header">
        <div>
          <h3 className="ro-panel__title">Job-Specific Optimizer</h3>
          <p className="ro-panel__sub">
            Paste a job description to get keyword recommendations, missing skills, section improvements, and a fit score tailored to that role.
          </p>
        </div>
      </div>

      <div className="ro-form-group">
        <label className="ro-label">Job Description</label>
        <textarea
          className="form-control ro-textarea"
          rows={7}
          placeholder="Paste the full job description here…"
          value={jobDesc}
          onChange={e => setJobDesc(e.target.value)}
        />
        <div className="ro-form-footer">
          <span className="ro-char-count">{jobDesc.length} chars</span>
          <button className="btn btn--primary" onClick={handleOptimize} disabled={loading || jobDesc.trim().length < 30}>
            {loading
              ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Optimizing…</>
              : <><span className="material-icons">tune</span> Optimize for This Role</>
            }
          </button>
        </div>
      </div>

      {error && (
        <div className="ro-error">
          <span className="material-icons">error_outline</span>
          {error}
        </div>
      )}

      {result && <OptimizerResult result={result} />}
    </div>
  );
}
