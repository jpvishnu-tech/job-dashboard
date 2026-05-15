import { useState } from 'react';
import { Link }     from 'react-router-dom';
import { useAuth }  from '../../context/AuthContext';
import { useShortlist } from '../../hooks/useShortlist';
import { useApplications } from '../../hooks/useApplications';
import { PriorityBadge, ScoreRing, PRIORITY_META } from '../../components/SmartShortlist';
import './ShortlistPage.css';

// ── Filter constants ──────────────────────────────────────────────────────

const PRIORITY_TABS = [
  { value: '',           label: 'All'         },
  { value: 'apply_now',  label: 'Apply Now'   },
  { value: 'strong_fit', label: 'Strong Fit'  },
  { value: 'good_match', label: 'Good Match'  },
  { value: 'consider',   label: 'Consider'    },
];

const SORT_OPTIONS = [
  { value: 'score',   label: 'Best Match'    },
  { value: 'recency', label: 'Most Recent'   },
  { value: 'salary',  label: 'Highest Salary' },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ScoreBar({ label, value, max = 100 }) {
  const pct = Math.round((value / max) * 100);
  const cls  = pct >= 80 ? 'bar--high' : pct >= 60 ? 'bar--mid' : 'bar--low';
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div className={`score-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="score-bar-value">{value}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function ShortlistPage() {
  const { user }    = useAuth();
  const [activeTab, setActiveTab]   = useState('');
  const [sort, setSort]             = useState('score');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [expanded, setExpanded]     = useState(new Set());

  const filters = { priorityLevel: activeTab, sort, remote: remoteOnly || undefined };
  const { items, analytics, loading, generating, error, lastUpdated, generate, refresh } = useShortlist(filters);
  const { addApplication } = useApplications(user?.uid);

  const [applying, setApplying] = useState(null);
  const [applied, setApplied]   = useState(new Set());

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleTrack(entry) {
    if (!user || !entry.job) return;
    setApplying(entry.job._id);
    try {
      await addApplication({
        company:  entry.job.company,
        role:     entry.job.title,
        location: entry.job.location || 'Remote',
        type:     entry.job.type     || 'full-time',
        url:      entry.job.url,
        status:   'pending',
      });
      setApplied(prev => new Set(prev).add(entry.job._id));
    } finally {
      setApplying(null);
    }
  }

  // ── Analytics banner ───────────────────────────────────────────────────

  const AnalyticsBanner = () => {
    if (!analytics) return null;
    return (
      <div className="shortlist-analytics">
        <div className="analytics-stat">
          <span className="analytics-stat__value">{analytics.total}</span>
          <span className="analytics-stat__label">Analysed</span>
        </div>
        <div className="analytics-divider" />
        <div className="analytics-stat">
          <span className="analytics-stat__value priority--urgent-text">{analytics.applyNowCount}</span>
          <span className="analytics-stat__label">Apply Now</span>
        </div>
        <div className="analytics-divider" />
        <div className="analytics-stat">
          <span className="analytics-stat__value priority--green-text">{analytics.strongFitCount}</span>
          <span className="analytics-stat__label">Strong Fit</span>
        </div>
        <div className="analytics-divider" />
        <div className="analytics-stat">
          <span className="analytics-stat__value">{analytics.averageScore}</span>
          <span className="analytics-stat__label">Avg Score</span>
        </div>
        <div className="analytics-divider" />
        <div className="analytics-stat">
          <span className="analytics-stat__value">{analytics.applicationRate}%</span>
          <span className="analytics-stat__label">Apply Rate</span>
        </div>
        {analytics.successRate > 0 && (
          <>
            <div className="analytics-divider" />
            <div className="analytics-stat">
              <span className="analytics-stat__value priority--green-text">{analytics.successRate}%</span>
              <span className="analytics-stat__label">Success Rate</span>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="shortlist-page">

      {/* Page header */}
      <div className="shortlist-page__header">
        <div>
          <div className="shortlist-page__title-row">
            <h2 className="shortlist-page__title">AI Smart Shortlist</h2>
            <span className="ai-badge"><span className="material-icons">auto_awesome</span> AI</span>
          </div>
          {lastUpdated && (
            <p className="shortlist-page__sub">
              Last updated {timeAgo(lastUpdated)}
              {items.length > 0 && ` · ${items.length} jobs ranked`}
            </p>
          )}
        </div>
        <div className="shortlist-page__header-actions">
          <button
            className="btn btn--primary"
            onClick={() => generate(true)}
            disabled={generating}
          >
            {generating
              ? <><span className="material-icons shortlist-spin">autorenew</span> Analysing…</>
              : <><span className="material-icons">auto_awesome</span> Refresh Shortlist</>
            }
          </button>
        </div>
      </div>

      {/* Analytics banner */}
      <AnalyticsBanner />

      {/* Filters */}
      <div className="shortlist-filters card">
        <div className="shortlist-filters__tabs">
          {PRIORITY_TABS.map(tab => (
            <button
              key={tab.value}
              className={`shortlist-tab ${activeTab === tab.value ? 'shortlist-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
              {tab.value && analytics && (
                <span className="shortlist-tab__count">
                  {analytics[`${tab.value === 'apply_now' ? 'applyNow' : tab.value === 'strong_fit' ? 'strongFit' : tab.value === 'good_match' ? 'goodMatch' : 'consider'}Count`] ?? ''}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="shortlist-filters__controls">
          <label className="shortlist-remote-toggle">
            <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} />
            <span><span className="material-icons">public</span> Remote only</span>
          </label>
          <select className="shortlist-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card shortlist-error-card">
          <span className="material-icons">error_outline</span>
          <p>{error}</p>
          <button className="btn btn--secondary btn--sm" onClick={refresh}>Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="shortlist-grid">
          {[1,2,3,4].map(i => <div key={i} className="shortlist-card-skeleton" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="card shortlist-empty-state">
          <span className="material-icons">psychology</span>
          <h3>No shortlisted jobs yet</h3>
          <p>
            {activeTab
              ? `No ${PRIORITY_META[activeTab]?.label} jobs in your shortlist.`
              : 'Click "Refresh Shortlist" to generate AI-powered job recommendations based on your resume.'
            }
          </p>
          {!activeTab && (
            <button
              className="btn btn--primary"
              onClick={() => generate(false)}
              disabled={generating}
            >
              <span className="material-icons">auto_awesome</span>
              Generate Shortlist
            </button>
          )}
          {activeTab && (
            <button className="btn btn--secondary btn--sm" onClick={() => setActiveTab('')}>
              View all
            </button>
          )}
          <Link to="/resume" className="btn btn--ghost btn--sm" style={{ marginTop: 4 }}>
            <span className="material-icons">description</span> Upload / update resume
          </Link>
        </div>
      )}

      {/* Job cards */}
      {!loading && items.length > 0 && (
        <div className="shortlist-grid">
          {items.map(entry => {
            if (!entry.job) return null;
            const job         = entry.job;
            const isExpanded  = expanded.has(entry._id);
            const isApplied   = applied.has(job._id);
            const isApplying  = applying === job._id;

            return (
              <article key={entry._id} className="shortlist-card card">

                {/* Priority + score header */}
                <div className="shortlist-card__top">
                  <PriorityBadge level={entry.priorityLevel} />
                  <div className="shortlist-card__top-right">
                    <ScoreRing score={entry.overallScore} />
                  </div>
                </div>

                {/* Job identity */}
                <div className="shortlist-card__identity">
                  {job.companyLogo
                    ? <img src={job.companyLogo} alt={job.company} className="shortlist-card__logo" onError={e => e.target.style.display='none'} />
                    : <div className="shortlist-card__logo-placeholder">{job.company?.[0] ?? '?'}</div>
                  }
                  <div className="shortlist-card__job-info">
                    <h3 className="shortlist-card__job-title">{job.title}</h3>
                    <span className="shortlist-card__company">
                      {job.company}
                      {job.location && <> · {job.location}</>}
                    </span>
                    <div className="shortlist-card__tags">
                      {job.type && <span className="job-tag job-tag--type">{job.type}</span>}
                      {job.remote && <span className="job-tag job-tag--remote"><span className="material-icons">public</span>Remote</span>}
                      {job.experienceLevel && job.experienceLevel !== 'any' && (
                        <span className="job-tag job-tag--exp">{job.experienceLevel}</span>
                      )}
                      {job.salary && <span className="job-tag"><span className="material-icons">payments</span>{job.salary}</span>}
                    </div>
                  </div>
                </div>

                {/* Recommendation reason */}
                {entry.recommendationReason && (
                  <div className="shortlist-card__reason">
                    <span className="material-icons">lightbulb</span>
                    <p>{entry.recommendationReason}</p>
                  </div>
                )}

                {/* Expandable detail */}
                <button
                  className="shortlist-card__expand-btn"
                  onClick={() => toggleExpand(entry._id)}
                >
                  <span className="material-icons">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                  {isExpanded ? 'Less detail' : 'Score breakdown & skills'}
                </button>

                {isExpanded && (
                  <div className="shortlist-card__detail">
                    {/* Score bars */}
                    <div className="score-bars">
                      <h4 className="score-bars__title">Score Breakdown</h4>
                      <ScoreBar label="AI Match"    value={entry.matchScore} />
                      <ScoreBar label="Career Fit"  value={entry.careerRelevanceScore} />
                      <ScoreBar label="Experience"  value={entry.experienceAlignmentScore} />
                      <ScoreBar label="Salary"      value={entry.salaryRelevanceScore} />
                      <ScoreBar label="Recency"     value={entry.recencyScore} />
                    </div>

                    {/* Strengths */}
                    {entry.strengths?.length > 0 && (
                      <div className="shortlist-card__strengths">
                        <h4>Your Strengths</h4>
                        <div className="skill-chips skill-chips--green">
                          {entry.strengths.map(s => (
                            <span key={s} className="skill-chip skill-chip--green">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing skills */}
                    {entry.missingSkills?.length > 0 && (
                      <div className="shortlist-card__gaps">
                        <h4><span className="material-icons">school</span> Skill Gaps</h4>
                        <div className="skill-chips">
                          {entry.missingSkills.map(s => (
                            <span key={s} className="skill-chip skill-chip--gap">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Career growth */}
                    {entry.careerGrowthPotential && (
                      <div className="shortlist-card__growth">
                        <span className="material-icons">trending_up</span>
                        <p>{entry.careerGrowthPotential}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="shortlist-card__actions">
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--sm">
                    <span className="material-icons">open_in_new</span>
                    View Job
                  </a>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => handleTrack(entry)}
                    disabled={isApplying || isApplied}
                  >
                    <span className="material-icons">{isApplied ? 'check' : 'bookmark_add'}</span>
                    {isApplied ? 'Tracked' : isApplying ? 'Tracking…' : 'Track Application'}
                  </button>
                </div>

              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
