import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJobMatches } from '../hooks/useJobMatches';
import { useApplications } from '../hooks/useApplications';
import { useState } from 'react';
import './RecommendedJobs.css';

function MatchScore({ score }) {
  const cls = score >= 80 ? 'rec-job-item__score--high'
            : score >= 60 ? 'rec-job-item__score--mid'
            : 'rec-job-item__score--low';
  return (
    <div className={`rec-job-item__score ${cls}`} title={`Match score: ${score}`}>
      {score}
    </div>
  );
}

export default function RecommendedJobs() {
  const { user }    = useAuth();
  const { jobs, loading, error, profileMissing, refresh, buildProfile } = useJobMatches();
  const { addApplication } = useApplications(user?.uid);

  const [building, setBuilding]  = useState(false);
  const [buildErr, setBuildErr]  = useState(null);
  const [applying, setApplying]  = useState(null);
  const [applied, setApplied]    = useState(new Set());

  async function handleBuildProfile() {
    if (building) return;
    setBuilding(true);
    setBuildErr(null);
    try {
      await buildProfile();
    } catch (err) {
      setBuildErr(err.message);
    } finally {
      setBuilding(false);
    }
  }

  async function handleTrack(match) {
    if (!user || !match.job) return;
    setApplying(match.job._id);
    try {
      await addApplication({
        company:  match.job.company,
        role:     match.job.title,
        location: match.job.location || 'Remote',
        type:     match.job.type     || 'full-time',
        url:      match.job.url,
        status:   'pending',
      });
      setApplied(prev => new Set(prev).add(match.job._id));
    } finally {
      setApplying(null);
    }
  }

  if (loading) {
    return (
      <div className="rec-jobs card">
        <div className="rec-jobs__header">
          <div className="rec-jobs__title-group">
            <h3 className="section-title">AI Job Matches</h3>
            <span className="ai-badge"><span className="material-icons">auto_awesome</span> AI</span>
          </div>
        </div>
        <div className="rec-jobs__skeletons">
          {[1,2,3].map(i => <div key={i} className="rec-jobs__skeleton" />)}
        </div>
      </div>
    );
  }

  if (profileMissing || error) {
    return (
      <div className="rec-jobs card">
        <div className="rec-jobs__header">
          <div className="rec-jobs__title-group">
            <h3 className="section-title">AI Job Matches</h3>
            <span className="ai-badge"><span className="material-icons">auto_awesome</span> AI</span>
          </div>
        </div>
        <div className="rec-jobs__empty">
          <span className="material-icons">psychology</span>
          <h4>Get Personalised Job Matches</h4>
          <p>We will analyse your resume and rank jobs by how well they match your skills and experience.</p>
          {(error || buildErr) && <p className="rec-jobs__error">{error || buildErr}</p>}
          <button
            className="btn btn--primary btn--sm"
            onClick={handleBuildProfile}
            disabled={building}
          >
            {building
              ? <><span className="material-icons rj-spin">autorenew</span> Analysing resume...</>
              : <><span className="material-icons">auto_awesome</span> Analyse My Resume</>
            }
          </button>
          <Link to="/resume" className="btn btn--ghost btn--sm" style={{ marginTop: 4 }}>
            <span className="material-icons">description</span> Upload resume first
          </Link>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rec-jobs card">
        <div className="rec-jobs__header">
          <div className="rec-jobs__title-group">
            <h3 className="section-title">AI Job Matches</h3>
            <span className="ai-badge"><span className="material-icons">auto_awesome</span> AI</span>
          </div>
        </div>
        <div className="rec-jobs__empty">
          <span className="material-icons">work_outline</span>
          <h4>No matches yet</h4>
          <p>Add some jobs to the board and we will score them against your resume.</p>
          <Link to="/jobs" className="btn btn--secondary btn--sm">
            <span className="material-icons">search</span> Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rec-jobs card">
      <div className="rec-jobs__header">
        <div className="rec-jobs__title-group">
          <h3 className="section-title">AI Job Matches</h3>
          <span className="ai-badge"><span className="material-icons">auto_awesome</span> AI</span>
        </div>
        <div className="rec-jobs__header-actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={refresh}
            title="Refresh matches"
          >
            <span className="material-icons">autorenew</span>
          </button>
          <Link to="/shortlist" className="btn btn--secondary btn--sm">View all</Link>
        </div>
      </div>

      <ul className="rec-jobs__list">
        {jobs.map(match => {
          if (!match.job) return null;
          const job        = match.job;
          const isApplied  = applied.has(job._id);
          const isApplying = applying === job._id;

          return (
            <li key={job._id} className="rec-job-item">
              <div className="rec-job-item__top">
                <div className="rec-job-item__logo-wrap">
                  {job.companyLogo
                    ? <img src={job.companyLogo} alt={job.company} className="rec-job-item__logo" onError={e => e.target.style.display='none'} />
                    : <div className="rec-job-item__logo-placeholder">{job.company?.[0] ?? '?'}</div>
                  }
                </div>
                <div className="rec-job-item__info">
                  <div className="rec-job-item__title-row">
                    <MatchScore score={match.matchScore} />
                    <span className="rec-job-item__title">{job.title}</span>
                  </div>
                  <span className="rec-job-item__company">
                    {job.company}
                    {job.location && <> - {job.location}</>}
                  </span>
                </div>
              </div>

              {match.matchReason && (
                <p className="rec-job-item__reason">
                  {match.matchReason.length > 120 ? match.matchReason.slice(0, 120) + '...' : match.matchReason}
                </p>
              )}

              {match.missingSkills && match.missingSkills.length > 0 && (
                <div className="rec-job-item__gaps">
                  <span className="material-icons">school</span>
                  <span>Missing: {match.missingSkills.slice(0, 3).join(', ')}</span>
                </div>
              )}

              <div className="rec-job-item__actions">
                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--sm">
                    <span className="material-icons">open_in_new</span> View
                  </a>
                )}
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => handleTrack(match)}
                  disabled={isApplying || isApplied}
                >
                  <span className="material-icons">{isApplied ? 'check' : 'bookmark_add'}</span>
                  {isApplied ? 'Tracked' : isApplying ? '...' : 'Track'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
