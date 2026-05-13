import './JobCard.css';

/**
 * JobCard
 * ─────────────────────────────────────────────────────────────
 * Renders a single job listing as a <tr> inside the jobs table.
 *
 * Props:
 *   job        – normalised job object from useJobs (company, role, etc.)
 *   isApplied  – true when this job URL exists in the user's Firestore applications
 *   onApply()  – called when the Apply button is clicked; the parent (JobsTable)
 *                opens the career page and calls saveApplication
 *   highlight  – optional query string used to wrap matching text in <mark>
 *
 * The component is pure (no internal state) — all state lives in JobsTable
 * or AuthContext, making it trivial to test in isolation.
 */
export default function JobCard({ job, isApplied, onApply, highlight }) {
  // Choose the location icon: globe for remote, pin for on-site.
  const locIcon = /remote|worldwide|anywhere/i.test(job.location)
    ? 'public'
    : 'location_on';

  // Fallback logo URL — generated initials avatar in brand colour.
  const fallbackLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=6366f1&color=fff&size=36&bold=true`;

  return (
    <tr className="jobs-row">

      {/* ── Company column ──────────────────────────────────── */}
      <td data-label="Company">
        <div className="co-cell">
          <img
            src={job.logoUrl}
            alt={job.company}
            className="co-cell__logo"
            // If the company logo fails to load, replace it with the initials avatar.
            // onerror is set once; the null assignment prevents infinite loops
            // if the fallback URL itself fails.
            onError={(e) => { e.target.onerror = null; e.target.src = fallbackLogo; }}
          />
          <span className="co-cell__name">{hl(job.company, highlight)}</span>
        </div>
      </td>

      {/* ── Role column ─────────────────────────────────────── */}
      <td data-label="Role">
        <div className="role-cell">
          <span className="role-cell__title">{hl(job.role, highlight)}</span>
          <span className="role-cell__dept">{hl(job.dept, highlight)}</span>
        </div>
      </td>

      {/* ── Location column ─────────────────────────────────── */}
      <td data-label="Location">
        <div className="loc-cell">
          <span className="material-icons">{locIcon}</span>
          {job.location}
        </div>
      </td>

      {/* ── Salary column ───────────────────────────────────── */}
      {/* data-value carries the numeric salary for column sorting */}
      <td data-label="Salary" data-value={job.salaryN}>
        {job.salary
          ? <span className="salary">{job.salary}</span>
          : <span className="salary--na">—</span>
        }
      </td>

      {/* ── Type column ─────────────────────────────────────── */}
      <td data-label="Type">
        <span className={`type-badge ${job.type.cls}`}>{job.type.label}</span>
      </td>

      {/* ── Apply column ────────────────────────────────────── */}
      <td>
        {isApplied ? (
          // Applied state — green, disabled so it can't be clicked again
          <button className="apply-btn apply-btn--applied" disabled>
            <span className="material-icons">check_circle</span>
            Applied
          </button>
        ) : (
          <button className="apply-btn" onClick={() => onApply(job)}>
            <span className="material-icons">open_in_new</span>
            Apply
          </button>
        )}
      </td>

    </tr>
  );
}

/**
 * hl (highlight helper)
 * Splits `text` on `query` (case-insensitive) and wraps each match in a
 * <mark> element.  Returns the original string as a plain React node when
 * there is no query or no match, avoiding unnecessary DOM nodes.
 */
function hl(text, query) {
  if (!query || !text) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts   = text.split(new RegExp(`(${escaped})`, 'gi'));

  // If there's only one part the query didn't match — return plain text.
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="search-mark">{part}</mark>
      : part
  );
}
