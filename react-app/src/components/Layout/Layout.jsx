import { useState, useCallback } from 'react';
import { Outlet, useNavigate }  from 'react-router-dom';

import { useJobs }  from '../../hooks/useJobs';
import Sidebar      from '../Sidebar/Sidebar';
import Navbar       from '../Navbar/Navbar';

// Layout-level styles (app shell, main wrapper, content area)
import '../../App.css';

/**
 * Layout
 * ─────────────────────────────────────────────────────────────
 * The persistent application shell rendered by every route.
 * Manages:
 *   sidebarCollapsed  – desktop icon-strip mode
 *   sidebarMobileOpen – mobile slide-in overlay
 *   selectedJob       – job highlighted after a navbar search pick
 *
 * Jobs are fetched here (not in individual pages) so both Navbar
 * (search overlay) and JobsTable (display) share the same array
 * without a duplicate API call.  Pages access jobs via useOutletContext.
 */
export default function Layout() {
  const { jobs, loading: jobsLoading, error, refetch } = useJobs();
  const navigate = useNavigate();

  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [selectedJob,       setSelectedJob]       = useState(null);

  // Called by the Navbar hamburger — behaviour differs on mobile vs desktop
  const handleSidebarToggle = () => {
    if (window.innerWidth <= 768) {
      setSidebarMobileOpen((o) => !o);
    } else {
      setSidebarCollapsed((c) => !c);
    }
  };

  const handleSidebarClose = () => setSidebarMobileOpen(false);

  // When the user picks a result from the global search overlay, navigate
  // to the dashboard and store the job so JobsTable can flash its row.
  const handleJobSelect = useCallback((job) => {
    setSelectedJob(job);
    navigate('/');
  }, [navigate]);

  return (
    <div className="app-layout">

      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={sidebarMobileOpen}
        onClose={handleSidebarClose}
      />

      <div
        className={[
          'main-wrapper',
          !sidebarCollapsed ? 'main-wrapper--expanded' : '',
        ].join(' ')}
      >
        <Navbar
          onSidebarToggle={handleSidebarToggle}
          jobs={jobs}
          onJobSelect={handleJobSelect}
        />

        {/* Pages receive shared data via Outlet context */}
        <main className="content">
          <Outlet context={{ jobs, loading: jobsLoading, error, refetch, selectedJob }} />
        </main>
      </div>

    </div>
  );
}
