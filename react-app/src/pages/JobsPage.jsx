import { useOutletContext } from 'react-router-dom';
import JobsTable from '../components/JobsTable/JobsTable';

/**
 * JobsPage
 * ─────────────────────────────────────────────────────────────
 * Dedicated page for browsing all available remote positions.
 * Shows the same JobsTable as the Dashboard but without the
 * stat cards, so the full viewport is used for job browsing.
 */
export default function JobsPage() {
  const { jobs, loading, error, refetch, selectedJob } = useOutletContext();

  return (
    <>
      <div className="content__header">
        <div>
          <h1 className="content__title">Browse Jobs</h1>
          <p className="content__subtitle">
            {loading
              ? 'Loading live positions…'
              : `${jobs.length} remote positions available right now.`
            }
          </p>
        </div>
      </div>

      <JobsTable
        jobs={jobs}
        loading={loading}
        error={error}
        onRetry={refetch}
        highlight={selectedJob?.company || ''}
      />
    </>
  );
}
