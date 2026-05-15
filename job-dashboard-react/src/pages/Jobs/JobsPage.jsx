import { useState, useEffect } from 'react';
import { useAuth }             from '../../context/AuthContext';
import { useJobs, useSavedJobs } from '../../hooks/useJobs';
import { useApplications }     from '../../hooks/useApplications';
import { applyClick, getRecommendedJobs, syncJobs } from '../../services/jobs';
import './JobsPage.css';

// ── Filter constants ───────────────────────────────────────────────────────

const JOB_TYPES = [
  { value: '',           label: 'All Types'    },
  { value: 'full-time',  label: 'Full-time'    },
  { value: 'part-time',  label: 'Part-time'    },
  { value: 'contract',   label: 'Contract'     },
  { value: 'internship', label: 'Internship'   },
];

const EXPERIENCE_LEVELS = [
  { value: '',       label: 'Any Level'  },
  { value: 'entry',  label: 'Entry'      },
  { value: 'mid',    label: 'Mid-level'  },
  { value: 'senior', label: 'Senior'     },
  { value: 'lead',   label: 'Lead'       },
];

const SORT_OPTIONS = [
  { value: 'newest',      label: 'Newest first'     },
  { value: 'oldest',      label: 'Oldest first'     },
  { value: 'salary_desc', label: 'Salary: high–low' },
  { value: 'salary_asc',  label: 'Salary: low–high' },
];

const SOURCES = [
  { value: '',           label: 'All Sources'  },
  // ── Real-world aggregation providers ──────────────────────────
  { value: 'adzuna',     label: 'Adzuna'       },
  { value: 'remoteok',   label: 'RemoteOK'     },
  { value: 'greenhouse', label: 'Greenhouse'   },
  { value: 'lever',      label: 'Lever'        },
  { value: 'rapidapi',   label: 'RapidAPI'     },
  // ── Legacy providers ───────────────────────────────────────────
  { value: 'remotive',   label: 'Remotive'     },
  { value: 'linkedin',   label: 'LinkedIn'     },
  { value: 'indeed',     label: 'Indeed'       },
  { value: 'naukri',     label: 'Naukri'       },
  { value: 'custom',     label: 'Company'      },
  { value: 'manual',     label: 'Manual'       },
];

// ── Platform brand metadata ────────────────────────────────────────────────
// Drives the source badge color + label on each job card.

export const PLATFORM_META = {
  // ── New providers ───────────────────────────────────────────────
  adzuna:     { label: 'Adzuna',     color: '#0033cc', bg: '#e6ebff' },
  remoteok:   { label: 'RemoteOK',   color: '#11181c', bg: '#f1f5f9' },
  greenhouse: { label: 'Greenhouse', color: '#24a148', bg: '#e8f5e9' },
  lever:      { label: 'Lever',      color: '#6d3fc5', bg: '#f0ebff' },
  rapidapi:   { label: 'RapidAPI',   color: '#e85d04', bg: '#fff3e8' },
  // ── Legacy providers ────────────────────────────────────────────
  linkedin:   { label: 'LinkedIn',   color: '#0077b5', bg: '#e8f4fc' },
  naukri:     { label: 'Naukri',     color: '#ff7555', bg: '#fff3f0' },
  indeed:     { label: 'Indeed',     color: '#2164f3', bg: '#eef3ff' },
  remotive:   { label: 'Remotive',   color: '#2cb67d', bg: '#ebfaf4' },
  company:    { label: 'Company',    color: '#475569', bg: '#f1f5f9' },
  custom:     { label: 'Direct',     color: '#475569', bg: '#f1f5f9' },
  // 'manual' intentionally omitted — no badge shown for internal jobs
};

// ── Main component ─────────────────────────────────────────────────────────

export default function JobsPage() {
  const { user }      = useAuth();
  const {
    jobs, pagination, loading, error,
    filters, updateFilters, setPage, resetFilters,
  } = useJobs();
  const { addApplication }    = useApplications(user?.uid);
  const { savedIds, toggleSave, isSaved, count: savedCount } = useSavedJobs();

  const { isAdmin }   = useAuth();

  const [searchDraft, setSearchDraft]       = useState('');
  const [locationDraft, setLocationDraft]   = useState('');
  const [applying, setApplying]             = useState(null);
  const [applied, setApplied]               = useState(new Set());
  const [showAdvanced, setShowAdvanced]     = useState(false);
  const [showSavedOnly, setShowSavedOnly]   = useState(false);

  // Recommended jobs (AI-matched or featured)
  const [recommended, setRecommended]       = useState([]);
  const [loadingRec, setLoadingRec]         = useState(false);

  // Sync state (admin)
  const [syncing, setSyncing]               = useState(false);
  const [lastSynced, setLastSynced]         = useState(null);
  const [syncMsg, setSyncMsg]               = useState('');

  // ── Recommended jobs ───────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    setLoadingRec(true);
    getRecommendedJobs(() => user.getIdToken())
      .then(d => setRecommended(d.data?.slice(0, 6) ?? []))
      .catch(() => {})
      .finally(() => setLoadingRec(false));
  }, [user]);

  // ── Manual sync (admin) ────────────────────────────────────────────────

  async function handleSync(providerName) {
    if (syncing) return;
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await syncJobs(() => user.getIdToken(), providerName);
      const summary = res.data;
      const total   = Object.values(summary).reduce(
        (sum, v) => sum + (v.inserted ?? 0) + (v.updated ?? 0), 0
      );
      setLastSynced(new Date());
      setSyncMsg(`Sync complete — ${total} jobs updated`);
      setTimeout(() => setSyncMsg(''), 4000);
    } catch (err) {
      setSyncMsg(`Sync failed: ${err.message}`);
      setTimeout(() => setSyncMsg(''), 5000);
    } finally {
      setSyncing(false);
    }
  }

  // ── Search ─────────────────────────────────────────────────────────────

  function handleSearch(e) {
    e.preventDefault();
    updateFilters({ search: searchDraft, location: locationDraft });
  }

  function handleClearSearch() {
    setSearchDraft('');
    setLocationDraft('');
    updateFilters({ search: '', location: '' });
  }

  // ── Apply ──────────────────────────────────────────────────────────────
  //
  // Strategy:
  //   1. Resolve the target URL (applyUrl takes priority over url)
  //   2. window.open() BEFORE any await so the browser treats it as a
  //      direct user-gesture (no popup blocker)
  //   3. Call POST /api/jobs/:id/apply-click in the background to:
  //        - log the ApplyClick event
  //        - increment job.clickCount
  //        - upsert an Application with status='applied'
  //   4. Mark the job as applied locally regardless of API success so
  //      the UI is always responsive.

  async function handleApply(job) {
    if (!user) return;

    const targetUrl = job.applyUrl || job.url;

    // Must happen synchronously in the click-event stack
    window.open(targetUrl, '_blank', 'noopener,noreferrer');

    setApplying(job._id);
    try {
      await applyClick(job._id, () => user.getIdToken());
    } catch (err) {
      console.warn('[JobsPage] apply-click tracking failed:', err.message);
    } finally {
      // Always update local state — URL already opened successfully
      setApplied(prev => new Set(prev).add(job._id));
      setApplying(null);
    }
  }

  // ── Displayed jobs ─────────────────────────────────────────────────────

  const displayedJobs = showSavedOnly
    ? jobs.filter(j => isSaved(j._id))
    : jobs;

  const hasActiveFilters =
    filters.search || filters.location || filters.type ||
    filters.remote || filters.experienceLevel ||
    filters.minSalary || filters.maxSalary || filters.source;

  return (
    <div className="jobs-page">

      {/* ── Search bar ──────────────────────────────────────────────── */}
      <div className="card jobs-search-card">
        <form onSubmit={handleSearch} className="jobs-search-row">
          <div className="jobs-search-field">
            <span className="material-icons jobs-search-icon">search</span>
            <input
              className="form-control jobs-search-input"
              placeholder="Job title, keywords or company…"
              value={searchDraft}
              onChange={e => setSearchDraft(e.target.value)}
            />
          </div>
          <div className="jobs-search-field">
            <span className="material-icons jobs-search-icon">place</span>
            <input
              className="form-control jobs-search-input"
              placeholder="Location…"
              value={locationDraft}
              onChange={e => setLocationDraft(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn--primary jobs-search-btn">
            Search
          </button>
          {(searchDraft || locationDraft) && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={handleClearSearch}>
              <span className="material-icons">close</span>
            </button>
          )}
        </form>
      </div>

      {/* ── Filter toolbar ──────────────────────────────────────────── */}
      <div className="jobs-toolbar card">
        <div className="jobs-toolbar__left">
          <div className="jobs-type-pills">
            {JOB_TYPES.map(t => (
              <button
                key={t.value}
                className={`jobs-pill ${filters.type === t.value ? 'jobs-pill--active' : ''}`}
                onClick={() => updateFilters({ type: t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="jobs-remote-toggle">
            <input
              type="checkbox"
              checked={filters.remote}
              onChange={e => updateFilters({ remote: e.target.checked })}
            />
            <span className="jobs-remote-toggle__label">
              <span className="material-icons">public</span>
              Remote only
            </span>
          </label>
        </div>

        <div className="jobs-toolbar__right">
          <select
            className="jobs-select"
            value={filters.sort}
            onChange={e => updateFilters({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            className={`btn btn--secondary btn--sm ${showAdvanced ? 'btn--active' : ''}`}
            onClick={() => setShowAdvanced(p => !p)}
          >
            <span className="material-icons">tune</span>
            Filters{hasActiveFilters ? ' •' : ''}
          </button>

          <button
            className={`btn btn--secondary btn--sm ${showSavedOnly ? 'btn--active' : ''}`}
            onClick={() => setShowSavedOnly(p => !p)}
            title="Show saved jobs"
          >
            <span className="material-icons">{showSavedOnly ? 'bookmark' : 'bookmark_border'}</span>
            {savedCount > 0 && <span className="jobs-saved-badge">{savedCount}</span>}
          </button>

          {hasActiveFilters && (
            <button className="btn btn--ghost btn--sm" onClick={() => { resetFilters(); setSearchDraft(''); setLocationDraft(''); }}>
              Reset
            </button>
          )}

          {/* Admin: manual sync trigger */}
          {isAdmin && (
            <button
              className={`btn btn--secondary btn--sm jobs-sync-btn ${syncing ? 'jobs-sync-btn--spinning' : ''}`}
              onClick={() => handleSync()}
              disabled={syncing}
              title="Sync all enabled job providers"
            >
              <span className="material-icons">sync</span>
              {syncing ? 'Syncing…' : 'Sync Jobs'}
            </button>
          )}
        </div>
      </div>

      {/* Sync status flash */}
      {syncMsg && (
        <div className={`jobs-sync-toast ${syncMsg.startsWith('Sync failed') ? 'jobs-sync-toast--error' : ''}`}>
          <span className="material-icons">{syncMsg.startsWith('Sync failed') ? 'error_outline' : 'check_circle'}</span>
          {syncMsg}
          {lastSynced && !syncMsg.startsWith('Sync failed') && (
            <span className="jobs-sync-time"> — {lastSynced.toLocaleTimeString()}</span>
          )}
        </div>
      )}

      {/* ── Advanced filters ────────────────────────────────────────── */}
      {showAdvanced && (
        <div className="jobs-advanced-panel card">
          <div className="jobs-advanced-grid">
            <div className="jobs-advanced-group">
              <label className="jobs-advanced-label">Experience Level</label>
              <select
                className="jobs-select"
                value={filters.experienceLevel}
                onChange={e => updateFilters({ experienceLevel: e.target.value })}
              >
                {EXPERIENCE_LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className="jobs-advanced-group">
              <label className="jobs-advanced-label">Source</label>
              <select
                className="jobs-select"
                value={filters.source}
                onChange={e => updateFilters({ source: e.target.value })}
              >
                {SOURCES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="jobs-advanced-group">
              <label className="jobs-advanced-label">Min Salary ($/yr)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 60000"
                min="0"
                value={filters.minSalary}
                onChange={e => updateFilters({ minSalary: e.target.value })}
              />
            </div>

            <div className="jobs-advanced-group">
              <label className="jobs-advanced-label">Max Salary ($/yr)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 150000"
                min="0"
                value={filters.maxSalary}
                onChange={e => updateFilters({ maxSalary: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Recommended Jobs ────────────────────────────────────────── */}
      {user && !showSavedOnly && !filters.search && (recommended.length > 0 || loadingRec) && (
        <div className="jobs-recommended card">
          <div className="jobs-recommended__header">
            <span className="material-icons jobs-recommended__icon">auto_awesome</span>
            <span className="jobs-recommended__title">Recommended for You</span>
            <span className="jobs-recommended__sub">AI-matched to your resume</span>
          </div>
          <div className="jobs-recommended__track">
            {loadingRec
              ? [1,2,3].map(i => <div key={i} className="jobs-rec-skeleton" />)
              : recommended.map(job => {
                const meta  = PLATFORM_META[job.source] ?? {};
                const score = job._matchScore;
                return (
                  <div key={job._id} className="jobs-rec-card">
                    {score != null && (
                      <div
                        className="jobs-rec-score"
                        style={{
                          background: score >= 80 ? '#dcfce7' : score >= 60 ? '#fef9c3' : '#fee2e2',
                          color:      score >= 80 ? '#15803d' : score >= 60 ? '#854d0e' : '#b91c1c',
                        }}
                      >
                        {score}% match
                      </div>
                    )}
                    <div className="jobs-rec-title">{job.title}</div>
                    <div className="jobs-rec-company">
                      {job.companyLogo && <img src={job.companyLogo} alt="" className="jobs-rec-logo" />}
                      {job.company}
                    </div>
                    <div className="jobs-rec-meta">
                      {job.remote && <span className="jobs-rec-remote">Remote</span>}
                      {meta.label && (
                        <span
                          className="jobs-rec-source"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      )}
                    </div>
                    {job._matchReason && (
                      <div className="jobs-rec-reason">{job._matchReason}</div>
                    )}
                    <button
                      className="btn btn--primary btn--sm jobs-rec-apply"
                      onClick={() => handleApply(job)}
                      disabled={!user}
                    >
                      Apply
                    </button>
                  </div>
                );
              })
            }
          </div>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="jobs-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="job-card-skeleton" />)}
        </div>
      ) : error ? (
        <div className="card">
          <div className="empty-state">
            <span className="material-icons">wifi_off</span>
            <h3>Could not load jobs</h3>
            <p>{error}</p>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      ) : displayedJobs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="material-icons">search_off</span>
            <h3>{showSavedOnly ? 'No saved jobs' : 'No jobs found'}</h3>
            <p>{showSavedOnly ? 'Bookmark jobs to see them here.' : 'Try different keywords or filters.'}</p>
            {hasActiveFilters && (
              <button className="btn btn--secondary" onClick={() => { resetFilters(); setSearchDraft(''); setLocationDraft(''); }}>
                Clear filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="jobs-results-header">
            <p className="jobs-count">
              {pagination?.total != null ? `${pagination.total.toLocaleString()} jobs` : `${displayedJobs.length} jobs`}
              {filters.search && <span> for "<strong>{filters.search}</strong>"</span>}
              {filters.location && <span> in <strong>{filters.location}</strong></span>}
              {showSavedOnly && <span> · saved only</span>}
            </p>
          </div>

          <div className="jobs-grid">
            {displayedJobs.map(job => (
              <JobCard
                key={job._id}
                job={job}
                saved={isSaved(job._id)}
                onSave={toggleSave}
                onApply={handleApply}
                applying={applying === job._id}
                applied={applied.has(job._id)}
                isLoggedIn={!!user}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination pagination={pagination} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

// ── JobCard ────────────────────────────────────────────────────────────────

function JobCard({ job, saved, onSave, onApply, applying, applied, isLoggedIn }) {
  const [expanded, setExpanded] = useState(false);

  const description  = job.description?.replace(/<[^>]+>/g, '').slice(0, 280) ?? '';
  const matchScore   = job._matchScore;
  const platMeta     = PLATFORM_META[job.source];
  const hasExternUrl = !!(job.applyUrl || job.url);

  const expLabel = {
    entry: 'Entry', mid: 'Mid', senior: 'Senior', lead: 'Lead', any: null,
  }[job.experienceLevel ?? 'any'];

  return (
    <article className="job-card card">

      {/* Match score badge */}
      {matchScore != null && (
        <div className={`job-card__match-badge ${matchScore >= 70 ? 'match--green' : matchScore >= 50 ? 'match--blue' : 'match--amber'}`}>
          <span className="material-icons">auto_awesome</span>
          {matchScore}% match
        </div>
      )}

      <div className="job-card__header">
        {job.companyLogo ? (
          <img
            src={job.companyLogo}
            alt={job.company}
            className="job-card__logo"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div
          className="job-card__logo-placeholder"
          style={{ display: job.companyLogo ? 'none' : 'flex' }}
        >
          {job.company?.[0] ?? '?'}
        </div>
        <div className="job-card__info">
          <h3 className="job-card__title" title={job.title}>{job.title}</h3>
          <span className="job-card__company">{job.company}</span>
        </div>

        <button
          className={`job-card__save ${saved ? 'job-card__save--saved' : ''}`}
          onClick={() => onSave(job._id)}
          title={saved ? 'Remove from saved' : 'Save job'}
        >
          <span className="material-icons">{saved ? 'bookmark' : 'bookmark_border'}</span>
        </button>
      </div>

      {/* Meta tags */}
      <div className="job-card__meta">
        {job.location && (
          <span className="job-card__tag">
            <span className="material-icons">place</span>
            {job.location}
          </span>
        )}
        {job.salary && (
          <span className="job-card__tag">
            <span className="material-icons">payments</span>
            {job.salary}
          </span>
        )}
        {job.type && (
          <span className="job-card__tag job-card__tag--type">{job.type}</span>
        )}
        {job.remote && (
          <span className="job-card__tag job-card__tag--remote">
            <span className="material-icons">public</span>
            Remote
          </span>
        )}
        {expLabel && (
          <span className="job-card__tag job-card__tag--exp">{expLabel}</span>
        )}
      </div>

      {/* Skills chips */}
      {job.skills?.length > 0 && (
        <div className="job-card__skills">
          {job.skills.slice(0, 5).map(s => (
            <span key={s} className="job-card__skill">{s}</span>
          ))}
          {job.skills.length > 5 && (
            <span className="job-card__skill job-card__skill--more">+{job.skills.length - 5}</span>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <>
          {expanded && <p className="job-card__desc">{description}…</p>}
          <button className="job-card__expand" onClick={() => setExpanded(p => !p)}>
            {expanded ? 'Show less' : 'Show more'}
          </button>
        </>
      )}

      {/* ── Platform source badge ─────────────────────────────────────── */}
      {platMeta ? (
        <div className="job-card__platform-row">
          <span
            className="job-card__platform-badge"
            style={{ background: platMeta.bg, color: platMeta.color }}
          >
            {platMeta.label}
          </span>
          {job.clickCount > 0 && (
            <span className="job-card__click-count" title="Apply clicks">
              <span className="material-icons">touch_app</span>
              {job.clickCount}
            </span>
          )}
        </div>
      ) : job.source && job.source !== 'manual' ? (
        <span className="job-card__source">via {job.source}</span>
      ) : null}

      {/* ── Action buttons ────────────────────────────────────────────── */}
      <div className="job-card__actions">
        {/* View Job — always links to the job listing page */}
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--secondary btn--sm"
        >
          <span className="material-icons">open_in_new</span>
          View
        </a>

        {/* Apply / Applied button */}
        {isLoggedIn ? (
          <button
            className={`btn btn--sm ${applied ? 'btn--applied' : 'btn--primary'} job-card__apply-btn`}
            onClick={() => !applied && onApply(job)}
            disabled={applying}
            title={applied ? 'Application tracked' : hasExternUrl ? `Apply on ${platMeta?.label || 'external site'}` : 'Track application'}
          >
            <span className="material-icons">
              {applied ? 'check_circle' : applying ? 'hourglass_top' : 'send'}
            </span>
            {applied ? 'Applied' : applying ? 'Opening…' : 'Apply'}
            {/* external link indicator — visible only when not yet applied */}
            {!applied && !applying && platMeta && (
              <span className="job-card__apply-ext" aria-hidden="true">↗</span>
            )}
          </button>
        ) : (
          /* Logged-out: plain link so it still works */
          <a
            href={job.applyUrl || job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary btn--sm"
          >
            <span className="material-icons">send</span>
            Apply
          </a>
        )}
      </div>
    </article>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────

function Pagination({ pagination, onPageChange }) {
  const { page, totalPages, hasNext, hasPrev } = pagination;

  function buildPages() {
    const pages = [];
    const delta = 1;
    const rangeStart = Math.max(2,             page - delta);
    const rangeEnd   = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (rangeStart > 2)            pages.push('…');
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
    if (rangeEnd < totalPages - 1) pages.push('…');
    if (totalPages > 1)            pages.push(totalPages);

    return pages;
  }

  return (
    <nav className="jobs-pagination" aria-label="Pagination">
      <button
        className="jobs-pagination__btn"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev}
        aria-label="Previous page"
      >
        <span className="material-icons">chevron_left</span>
      </button>

      {buildPages().map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="jobs-pagination__ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`jobs-pagination__btn ${p === page ? 'jobs-pagination__btn--active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        className="jobs-pagination__btn"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        aria-label="Next page"
      >
        <span className="material-icons">chevron_right</span>
      </button>
    </nav>
  );
}
