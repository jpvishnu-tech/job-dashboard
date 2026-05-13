import { useState, useMemo, useRef } from 'react';
import { useAuth }  from '../../context/AuthContext';
import JobCard       from '../JobCard/JobCard';
import './JobsTable.css';

const PER_PAGE = 8; // rows per page — matches the vanilla implementation

/**
 * Skeleton row rendered while the API is loading.
 * Shimmer animation is defined in globals.css.
 */
function SkeletonRow() {
  return (
    <tr className="jobs-skeleton">
      <td><div className="sk-cell"><div className="shimmer sk-logo" /><div className="shimmer sk-text" style={{ width: 72 }} /></div></td>
      <td><div className="shimmer sk-text" style={{ width: 110 }} /><div className="shimmer sk-text" style={{ width: 60, marginTop: 5 }} /></td>
      <td><div className="shimmer sk-text" style={{ width: 96 }} /></td>
      <td><div className="shimmer sk-text" style={{ width: 84 }} /></td>
      <td><div className="shimmer sk-badge" /></td>
      <td><div className="shimmer sk-btn" /></td>
    </tr>
  );
}

/**
 * SortIcon
 * Shows an appropriate directional chevron next to a sortable column header.
 * When this column is not the active sort, it shows a neutral "unfold" icon.
 */
function SortIcon({ col, activeSortCol, activeSortDir }) {
  if (col !== activeSortCol) {
    return <span className="material-icons sort-icon">unfold_more</span>;
  }
  return (
    <span className="material-icons sort-icon sort-icon--active">
      {activeSortDir === 1 ? 'arrow_upward' : 'arrow_downward'}
    </span>
  );
}

/**
 * JobsTable
 * ─────────────────────────────────────────────────────────────
 * Props:
 *   jobs       – full array of normalised jobs from useJobs (passed from App)
 *   loading    – true while the API fetch is in progress
 *   error      – error message string or null
 *   onRetry()  – called when the Retry button in the error card is clicked
 *   highlight  – current navbar search query, used to highlight text in rows
 *
 * Internally manages:
 *   filter     – text typed in the toolbar search input
 *   sortCol    – which column key is the sort key ('company' | 'role' | 'salaryN' | null)
 *   sortDir    – 1 for ascending, -1 for descending
 *   page       – current pagination page (1-indexed)
 */
export default function JobsTable({ jobs, loading, error, onRetry, highlight }) {
  const { applications, saveApplication } = useAuth();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [filter,      setFilter]      = useState('');
  const [sortCol,     setSortCol]     = useState(null);   // null = no sort
  const [sortDir,     setSortDir]     = useState(1);      // 1=asc -1=desc
  const [page,        setPage]        = useState(1);

  // Ref to the section heading — used to scroll back to top on page change
  const sectionRef = useRef(null);

  // Set of applied job URLs for O(1) lookup in JobCard
  const appliedUrls = useMemo(
    () => new Set(applications.map((a) => a.url)),
    [applications]
  );

  // ── Derived data: filter → sort → paginate ────────────────────────────────
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Text filter — matches any of these fields (case-insensitive)
    if (filter) {
      const q = filter.toLowerCase();
      result = result.filter((j) =>
        [j.company, j.role, j.dept, j.location, j.type.label]
          .some((field) => field.toLowerCase().includes(q))
      );
    }

    // Column sort — only applied when a sort column is active
    if (sortCol !== null) {
      result.sort((a, b) => {
        let av, bv;
        if (sortCol === 'company')  { av = a.company; bv = b.company; }
        if (sortCol === 'role')     { av = a.role;    bv = b.role;    }
        if (sortCol === 'salaryN')  { av = a.salaryN; bv = b.salaryN; }

        if (typeof av === 'string') return sortDir * av.localeCompare(bv);
        return sortDir * ((av ?? 0) - (bv ?? 0));
      });
    }

    return result;
  }, [jobs, filter, sortCol, sortDir]);

  const totalPages = Math.ceil(filteredJobs.length / PER_PAGE);
  const pagedJobs  = filteredJobs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setPage(1); // reset to page 1 on every filter keystroke
  };

  const handleSort = (col) => {
    // Clicking the active column reverses direction; clicking a new column resets to asc
    setSortDir(sortCol === col ? -sortDir : 1);
    setSortCol(col);
    setPage(1);
  };

  const handlePageChange = (p) => {
    setPage(p);
    // Scroll the table heading into view so the user doesn't have to scroll up
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleApply = (job) => {
    // Open the job's career page in a new tab
    if (job.url && job.url !== '#') window.open(job.url, '_blank', 'noopener,noreferrer');
    // Persist the application to Firestore (no-op in placeholder mode)
    saveApplication({
      company:  job.company,
      role:     job.role,
      location: job.location,
      salary:   job.salary,
      type:     job.type.label,
      url:      job.url,
    });
  };

  // ── Pagination helpers ────────────────────────────────────────────────────

  /**
   * Returns an array of page numbers to render, with null representing "…".
   * Shows at most 5 page numbers in a sliding window around the current page.
   */
  function buildPageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const WINDOW = 3;
    const half   = Math.floor(WINDOW / 2);
    let start    = Math.max(2, current - half);
    let end      = Math.min(total - 1, start + WINDOW - 1);
    if (end === total - 1) start = Math.max(2, end - WINDOW + 1);

    const range  = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const result = [1];
    if (start > 2) result.push(null);       // leading ellipsis
    result.push(...range);
    if (end < total - 1) result.push(null); // trailing ellipsis
    result.push(total);
    return result;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="jobs-section" ref={sectionRef}>
      <div className="card">

        {/* ── Toolbar ─────────────────────────────────────────── */}
        <div className="jobs-toolbar">
          <div className="jobs-toolbar__left">
            <h2 className="jobs-toolbar__title">Available Jobs</h2>
            <span className="jobs-toolbar__count">
              {loading
                ? 'Loading…'
                : filter
                  ? `${filteredJobs.length} result${filteredJobs.length !== 1 ? 's' : ''}`
                  : `${jobs.length} positions`
              }
            </span>
            {/* Live indicator dot — shown once API data is loaded */}
            {!loading && !error && jobs.length > 0 && (
              <span className="api-indicator" title="Live data from Remotive API">
                <span className="api-indicator__dot" />
                Live
              </span>
            )}
          </div>

          <div className="jobs-toolbar__right">
            {/* Toolbar search — filters the full jobs array */}
            <div className="jobs-search">
              <span className="material-icons jobs-search__icon">search</span>
              <input
                type="text"
                className="jobs-search__input"
                placeholder="Filter by company or role…"
                value={filter}
                onChange={handleFilterChange}
                autoComplete="off"
              />
            </div>
            <button className="jobs-filter-btn">
              <span className="material-icons">tune</span>
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────────── */}
        <div className="jobs-table-wrap">
          <table className="jobs-table">
            <thead>
              <tr>
                {/* Clicking a sortable header calls handleSort with the column key */}
                <th onClick={() => handleSort('company')} style={{ cursor: 'pointer' }}>
                  Company <SortIcon col="company" activeSortCol={sortCol} activeSortDir={sortDir} />
                </th>
                <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
                  Role <SortIcon col="role" activeSortCol={sortCol} activeSortDir={sortDir} />
                </th>
                <th>Location</th>
                <th onClick={() => handleSort('salaryN')} style={{ cursor: 'pointer' }}>
                  Salary <SortIcon col="salaryN" activeSortCol={sortCol} activeSortDir={sortDir} />
                </th>
                <th>Type</th>
                <th />
              </tr>
            </thead>

            <tbody id="jobsBody">
              {/* ── Loading skeleton ── */}
              {loading && Array.from({ length: PER_PAGE }, (_, i) => (
                <SkeletonRow key={i} />
              ))}

              {/* ── Error card ── */}
              {!loading && error && (
                <tr>
                  <td colSpan={6}>
                    <div className="fetch-error">
                      <span className="material-icons fetch-error__icon">cloud_off</span>
                      <p className="fetch-error__title">Could not load live jobs</p>
                      <p className="fetch-error__msg">{error}</p>
                      <button className="btn btn--primary btn--sm" onClick={onRetry}>
                        <span className="material-icons">refresh</span>
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* ── Empty filter state ── */}
              {!loading && !error && pagedJobs.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="jobs-table__empty">
                      <span className="material-icons">search_off</span>
                      {filter
                        ? <>No jobs match "<strong>{filter}</strong>"</>
                        : 'No jobs available'
                      }
                    </div>
                  </td>
                </tr>
              )}

              {/* ── Job rows (one JobCard per job) ── */}
              {!loading && !error && pagedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isApplied={appliedUrls.has(job.url)}
                  onApply={handleApply}
                  highlight={filter || highlight}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────────────── */}
        {!loading && !error && totalPages > 1 && (
          <div className="jobs-pagination">
            <span className="jobs-pagination__info">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredJobs.length)} of {filteredJobs.length} positions
            </span>

            <div className="jobs-pagination__pages">
              {/* Previous button */}
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                aria-label="Previous page"
              >
                <span className="material-icons">chevron_left</span>
              </button>

              {/* Page number buttons with ellipsis */}
              {buildPageRange(page, totalPages).map((p, i) =>
                p === null
                  ? <span key={`dot-${i}`} className="page-dots">···</span>
                  : (
                    <button
                      key={p}
                      className={`page-btn ${p === page ? 'page-btn--active' : ''}`}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </button>
                  )
              )}

              {/* Next button */}
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                aria-label="Next page"
              >
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
