import { useState } from 'react';
import { useAuth }  from '../../../context/AuthContext';
import { analyzeResume } from '../../../services/resumeOptimizer';

// ── Shared helpers ─────────────────────────────────────────────

function clr(n) {
  if (n >= 75) return '#16a34a';
  if (n >= 55) return 'var(--color-primary)';
  if (n >= 35) return '#d97706';
  return '#dc2626';
}

function lbl(n) {
  if (n >= 80) return 'Excellent';
  if (n >= 65) return 'Good';
  if (n >= 50) return 'Fair';
  if (n >= 35) return 'Needs Work';
  return 'Poor';
}

function ScoreRing({ score, label, size = 90 }) {
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

function Bar({ value }) {
  return (
    <div className="ro-bar-wrap">
      <div className="ro-bar-fill" style={{ width: `${value ?? 0}%`, background: clr(value ?? 0) }} />
    </div>
  );
}

function TagGroup({ title, items, variant }) {
  if (!items?.length) return null;
  return (
    <div className="ro-tag-group">
      <span className="ro-tag-group__title">{title}</span>
      {items.map((t, i) => <span key={i} className={`ro-tag ro-tag--${variant}`}>{typeof t === 'string' ? t : t.keyword}</span>)}
    </div>
  );
}

function List({ items, icon = 'arrow_forward', color }) {
  if (!items?.length) return <li style={{ color: 'var(--text-muted)' }}>None identified</li>;
  return items.map((item, i) => (
    <li key={i}>
      <span className="material-icons" style={{ fontSize: 14, color: color || 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
      {item}
    </li>
  ));
}

// ── Main ATS result display ────────────────────────────────────

function AtsResult({ data }) {
  const { ats, keywords } = data;
  const sectionKeys = Object.keys(ats.sectionScores || {});

  return (
    <div className="ro-result">
      {/* Score rings row */}
      <div className="ro-scores-row">
        <div className="ro-score-item">
          <ScoreRing score={ats.atsScore} label="ATS Score" size={100} />
          <span className="ro-score-grade" style={{ color: clr(ats.atsScore) }}>{lbl(ats.atsScore)}</span>
        </div>
        <div className="ro-score-item">
          <ScoreRing score={ats.keywordRelevanceScore} label="Keywords" />
          <span className="ro-score-grade" style={{ fontSize: 11 }}>Relevance</span>
        </div>
        <div className="ro-score-item">
          <ScoreRing score={ats.recruiterVisibilityScore} label="Visibility" />
          <span className="ro-score-grade" style={{ fontSize: 11 }}>Recruiter</span>
        </div>
        <div className="ro-score-item">
          <ScoreRing score={ats.formattingScore} label="Format" />
          <span className="ro-score-grade" style={{ fontSize: 11 }}>Formatting</span>
        </div>
      </div>

      {ats.overallFeedback && (
        <p className="ro-feedback">{ats.overallFeedback}</p>
      )}

      {/* Section-by-section scores */}
      {sectionKeys.length > 0 && (
        <div className="ro-card">
          <h4 className="ro-card__title"><span className="material-icons">table_chart</span> Section Scores</h4>
          {sectionKeys.map(key => {
            const sec = ats.sectionScores[key] || {};
            return (
              <div key={key} className="ro-section-row">
                <span className="ro-section-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <Bar value={sec.score} />
                <span className="ro-section-score" style={{ color: clr(sec.score) }}>{sec.score ?? '–'}</span>
                {sec.feedback && <span className="ro-section-feedback">{sec.feedback}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Keyword gaps */}
      {ats.keywordGaps && (
        <div className="ro-card">
          <h4 className="ro-card__title"><span className="material-icons">search</span> Keyword Gaps</h4>
          <TagGroup title="Critical (add ASAP)" items={ats.keywordGaps.critical}  variant="red"   />
          <TagGroup title="Important"           items={ats.keywordGaps.important} variant="amber" />
          <TagGroup title="Nice to Have"        items={ats.keywordGaps.nice_to_have} variant="muted" />
        </div>
      )}

      {/* Strengths / Weaknesses */}
      <div className="ro-two-col">
        <div className="ro-card ro-card--green">
          <h4 className="ro-card__title"><span className="material-icons">verified</span> Strengths</h4>
          <ul className="ro-list"><List items={ats.strengths} icon="check_circle" color="#16a34a" /></ul>
        </div>
        <div className="ro-card ro-card--red">
          <h4 className="ro-card__title"><span className="material-icons">warning</span> Weaknesses</h4>
          <ul className="ro-list"><List items={ats.weaknesses} icon="cancel" color="#dc2626" /></ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="ro-card">
        <h4 className="ro-card__title"><span className="material-icons">tips_and_updates</span> Recommendations</h4>
        <ul className="ro-list"><List items={ats.recommendations} icon="arrow_forward" /></ul>
      </div>

      {/* Formatting issues */}
      {ats.formattingIssues?.length > 0 && (
        <div className="ro-card ro-card--amber">
          <h4 className="ro-card__title"><span className="material-icons">format_align_left</span> Formatting Issues</h4>
          <ul className="ro-list"><List items={ats.formattingIssues} icon="error_outline" color="#d97706" /></ul>
        </div>
      )}

      {/* Keyword engine results */}
      {keywords && (
        <div className="ro-card">
          <h4 className="ro-card__title"><span className="material-icons">electric_bolt</span> Keyword Intelligence</h4>
          <div className="ro-kw-scores">
            <span>Keyword Density</span><Bar value={keywords.keywordDensityScore} /><span style={{ color: clr(keywords.keywordDensityScore) }}>{keywords.keywordDensityScore}</span>
            <span>Power Words</span>   <Bar value={keywords.powerWordScore} />      <span style={{ color: clr(keywords.powerWordScore) }}>{keywords.powerWordScore}</span>
            <span>Industry Alignment</span><Bar value={keywords.industryAlignmentScore} /><span style={{ color: clr(keywords.industryAlignmentScore) }}>{keywords.industryAlignmentScore}</span>
          </div>
          {keywords.weakWordsFound?.length > 0 && (
            <div className="ro-kw-replace">
              <h5 className="ro-kw-replace__title">Weak Words to Replace</h5>
              {keywords.powerWordSuggestions?.slice(0, 6).map((s, i) => (
                <div key={i} className="ro-kw-replace__row">
                  <span className="ro-kw-replace__weak">{s.weak}</span>
                  <span className="material-icons" style={{ fontSize: 14 }}>arrow_forward</span>
                  <span className="ro-kw-replace__strong">{s.strong}</span>
                </div>
              ))}
            </div>
          )}
          {keywords.actionableInsights?.length > 0 && (
            <ul className="ro-list" style={{ marginTop: 10 }}>
              <List items={keywords.actionableInsights} icon="lightbulb" />
            </ul>
          )}
        </div>
      )}

      {/* Skills found */}
      {ats.skillsFound?.length > 0 && (
        <div className="ro-tags-row">
          <span className="ro-tags-label">Skills Found:</span>
          {ats.skillsFound.map((s, i) => <span key={i} className="ro-tag ro-tag--skill">{s}</span>)}
        </div>
      )}
    </div>
  );
}

// ── Panel export ───────────────────────────────────────────────

export default function AtsPanel({ hasResume }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [result,  setResult]  = useState(null);

  async function handleAnalyze() {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await analyzeResume(() => user.getIdToken());
      setResult(data.data);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!hasResume) {
    return (
      <div className="ro-empty-state">
        <span className="material-icons ro-empty-state__icon">description</span>
        <p>Upload a resume to run ATS analysis.</p>
      </div>
    );
  }

  return (
    <div className="ro-panel">
      <div className="ro-panel__header">
        <div>
          <h3 className="ro-panel__title">Enhanced ATS Analysis</h3>
          <p className="ro-panel__sub">
            Deep keyword relevance score, recruiter visibility score, section-by-section breakdown, and formatting audit — powered by GPT-4o mini.
          </p>
        </div>
        <button className="btn btn--primary" onClick={handleAnalyze} disabled={loading}>
          {loading
            ? <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Analyzing…</>
            : <><span className="material-icons">auto_awesome</span> Run ATS Analysis</>
          }
        </button>
      </div>

      {error && (
        <div className="ro-error">
          <span className="material-icons">error_outline</span>
          {error}
        </div>
      )}

      {result && <AtsResult data={result} />}

      {!result && !loading && !error && (
        <div className="ro-hint">
          <span className="material-icons">info</span>
          Click <strong>Run ATS Analysis</strong> to get your enhanced ATS score, keyword gaps, and section-by-section feedback.
        </div>
      )}
    </div>
  );
}
