import { useOutletContext } from 'react-router-dom';
import DashboardCards from '../components/DashboardCards/DashboardCards';
import JobsTable      from '../components/JobsTable/JobsTable';

/**
 * DashboardPage
 * ─────────────────────────────────────────────────────────────
 * The landing page — stat cards above, full jobs table below.
 * Jobs data and the currently selected job (from navbar search)
 * come from Layout via useOutletContext.
 */
export default function DashboardPage() {
  const { jobs, loading, error, refetch, selectedJob } = useOutletContext();

  return (
    <>
      <div className="content__header">
        <div>
          <h1 className="content__title">Dashboard</h1>
          <p className="content__subtitle">Here's your job hunt at a glance.</p>
        </div>
        <button className="btn btn--primary">
          <span className="material-icons">add</span>
          New Application
        </button>
      </div>

      {/* Stat cards read directly from AuthContext — no props needed */}
      <DashboardCards />

      {/*
        highlight passes the company name of the job the user searched for,
        so JobsTable can flash that row after navigation.
      */}
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
