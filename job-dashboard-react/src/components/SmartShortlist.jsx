import { useState } from 'react';
import { Link }     from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { usePriorityJobs } from '../hooks/useShortlist';
import { getRecommendations } from '../services/shortlist';
import { useApplications }    from '../hooks/useApplications';
import './SmartShortlist.css';

const PRIORITY_META = {
  apply_now:   { label: 'Apply Now',   cls: 'priority--urgent',  icon: 'bolt'        },
  strong_fit:  { label: 'Strong Fit',  cls: 'priority--green',   icon: 'check_circle' },
  good_match:  { label: 'Good Match',  cls: 'priority--blue',    icon: 'thumb_up'     },
  consider:    { label: 'Consider',    cls: 'priority--amber',   icon: 'info'         },
  stretch:     { label: 'Stretch',     cls: 'priority--purple',  icon: 'trending_up'  },
};

function PriorityBadge({ level }) {
  const meta = PRIORITY_META[level] ?? PRIORITY_META.consider;
  return (
    <span className={`priority-badge ${meta.cls}`}>
      <span className="material-icons">{meta.icon}</span>
      {meta.label}
    </span>
  );
}

function ScoreRing({ score }) {
  const cls = score >= 80 ? 'ring--high' : score >= 65 ? 'ring--mid' : 'ring--low';
  return (
    <div className={`score-ring ${cls}`} title={`Overall score: ${score}`}>
      <span className="score-ring__value">{score}</span>
    </div>
  );
}

export default function SmartShortlist() {
  const { user }  = useAuth();
  const { jobs, loading, error, isEmpty, refresh } = usePriorityJobs(4);
  const { addApplication } = useApplications(user?.uid);

  const [generating, setGenerating]   = useState(false);
  const [genError, setGenError]       = useState(null);
  const [applying, setApplying]       = useState(null);
  const [applied, setApplied]         = useState(new Set());

  async function handleGenerate() {
    if (!user || generating) return;
    setGenerating(true);
    setGenError(null);
    try {
      await getRecommendations(() => user.getIdToken(), { refresh: jobs.length === 0 });
      await refresh();
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
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

  // ── Skeleton ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="smart-shortlist card">
        <div className="smart-shortlist__header">
          <div className="smart-shortlist__title-group">
            <h3 className="section-title">Apply First</h3>
            <span className="ai-badge"><span className="material-icons">auto_awesome</span> AI</span>
          </div>
        </div>
        <div className="smart-shortlist__skeletons">
          {[1,2,3].map(i => <div key={i} className="shortlist-skeleton" />)}
        </div>
      </div>
    );
  }

  // ── Empty / no-shortlist state ─────────────────────────────────────────
  if (error || isEmpty) {
    return (
      <div className="smart-shortlist card">
        <div className="smart-shortlist__header">
          <div className="smart-shortlist__title-group">
            <h3 className="section-title">Apply First</h3>
            <span className="ai-badge"><span className="material-icons">auto_awesome</span> AI</span>
          </div>
        </div>
        <div className="smart-shortlist__empty">
          <span className="material-icons">psychology</span>
          <h4>Get AI Job Recommendations</h4>
          <p>Our AI analyses your resume and ranks jobs by how well they match your profile.</p>
          {genError && <p className="shortlist-error">{genError}</p>}
          <button
            className="btn btn--primary btn--sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating
              ? <><span className="material-icons shortlist-spin">autorenew</span> Analysing jobs…</>
              : <><span className="material-icons">auto_awesome</span> Generate Shortlist</>
            }
          </button>
        </div>
      </div>
    );
  }

  // ── Job list ───────────────────────────────────────────────────────────
  return (
    <div className="smart-shortlist card">
      <div className="smart-shortlist__header">
        <div className="smart-shortlist__title-group">
          <h3 className="section-title">Apply First</h3>
          <span className="ai-badge"><span className="material-icons">auto_awesome</span> AI</span>
        </div>
        <div className="smart-shortlist__header-actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={handleGenerate}
            disabled={generating}
            title="Refresh shortlist"
          >
            <span className={`material-icons${generating ? ' shortlist-spin' : ''}`}>autorenew</span>
          </button>
          <Link to="/shortlist" className="btn btn--secondary btn--sm">
            View all
          </Link>
        </div>
      </div>

      {genError && <p className="shortlist-error">{genError}</p>}

      <ul className="shortlist-list">
        {jobs.map(entry => {
          if (!entry.job) return null;
          const job     = entry.job;
          const isApplied = applied.has(job._id);
          const isApplying = applying === job._id;

          return (
            <li key={entry._id} className="shortlist-item">
              <div className="shortlist-item__top">
                {/* Company logo */}
                <div className="shortlist-item__logo-wrap">
                  {job.companyLogo
                    ? <img src={job.companyLogo} alt={job.company} className="shortlist-item__logo" onError={e => e.target.style.display='none'} />
                    : <div className="shortlist-item__logo-placeholder">{job.company?.[0] ?? '?'}</div>
                  }
                </div>

                <div className="shortlist-item__info">
                  <div className="shortlist-item__title-row">
                    <PriorityBadge level={entry.priorityLevel} />
                    <ScoreRing score={entry.overallScore} />
                  </div>
                  <span className="shortlist-item__job-title">{job.title}</span>
                  <span className="shortlist-item__company">
                    {job.company}
                    {job.location && <> · {job.location}</>}
                    {job.remote   && <> · <span className="shortlist-item__remote">Remote</span></>}
                  </span>
                </div>
              </div>

              {/* Reason snippet */}
              {entry.recommendationReason && (
                <p className="shortlist-item__reason">
                  {entry.recommendationReason.slice(0, 120)}{entry.recommendationReason.length > 120 ? '…' : ''}
                </p>
              )}

              {/* Missing skills */}
              {entry.missingSkills?.length > 0 && (
                <div className="shortlist-item__gaps">
                  <span className="material-icons">school</span>
                  <span>Missing: {entry.missingSkills.slice(0, 3).join(', ')}</span>
                </div>
              )}

              <div className="shortlist-item__actions">
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--sm">
                  <span className="material-icons">open_in_new</span> View
                </a>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => handleTrack(entry)}
                  disabled={isApplying || isApplied}
                >
                  <span className="material-icons">{isApplied ? 'check' : 'bookmark_add'}</span>
                  {isApplied ? 'Tracked' : isApplying ? '…' : 'Track'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { PriorityBadge, ScoreRing, PRIORITY_META };
