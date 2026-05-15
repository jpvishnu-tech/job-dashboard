import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../hooks/useApplications';
import RecommendedJobs from '../../components/RecommendedJobs';
import './DashboardPage.css';

const STATUS_META = {
  pending:   { label: 'Pending',   badge: 'badge--amber',  icon: 'schedule'      },
  interview: { label: 'Interview', badge: 'badge--blue',   icon: 'groups'        },
  offer:     { label: 'Offer',     badge: 'badge--green',  icon: 'celebration'   },
  rejected:  { label: 'Rejected',  badge: 'badge--red',    icon: 'cancel'        },
};

function formatDate(val) {
  if (!val) return '—';
  const d = val.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const { user }                         = useAuth();
  const { applications, loading }        = useApplications(user?.uid);

  const stats = useMemo(() => {
    const total     = applications.length;
    const interview = applications.filter(a => a.status === 'interview').length;
    const offer     = applications.filter(a => a.status === 'offer').length;
    const pending   = applications.filter(a => a.status === 'pending').length;
    const responseRate = total > 0 ? Math.round((interview + offer) / total * 100) : 0;
    return { total, interview, offer, pending, responseRate };
  }, [applications]);

  const recent = useMemo(() =>
    [...applications]
      .sort((a, b) => (b.appliedAt?.seconds ?? 0) - (a.appliedAt?.seconds ?? 0))
      .slice(0, 5),
    [applications]
  );

  const displayName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h2 className="dashboard-welcome__title">Welcome back, {displayName}! 👋</h2>
          <p className="dashboard-welcome__sub">Here's your job search summary.</p>
        </div>
        <Link to="/jobs" className="btn btn--primary">
          <span className="material-icons">search</span>
          Browse Jobs
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="stat-card stat-card--skeleton" />)}
        </div>
      ) : (
        <div className="stats-grid">
          <StatCard icon="assignment" color="blue"   value={stats.total}        label="Total Applications" />
          <StatCard icon="groups"     color="amber"  value={stats.interview}    label="Interviews"          />
          <StatCard icon="celebration" color="green" value={stats.offer}        label="Offers Received"    />
          <StatCard icon="trending_up" color="purple" value={`${stats.responseRate}%`} label="Response Rate" />
        </div>
      )}

      {/* Status breakdown */}
      {!loading && applications.length > 0 && (
        <div className="dash-row">
          <div className="card dash-breakdown">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Application Breakdown</h3>
            <div className="breakdown-bars">
              {Object.entries(STATUS_META).map(([status, meta]) => {
                const count = applications.filter(a => a.status === status).length;
                const pct   = applications.length ? Math.round(count / applications.length * 100) : 0;
                return (
                  <div key={status} className="breakdown-bar-row">
                    <span className="breakdown-bar-label">{meta.label}</span>
                    <div className="breakdown-bar-wrap">
                      <div className="breakdown-bar" data-status={status} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="breakdown-bar-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent activity */}
          <div className="card dash-recent">
            <div className="section-header">
              <h3 className="section-title">Recent Applications</h3>
              <Link to="/applications" className="btn btn--secondary btn--sm">View all</Link>
            </div>
            {recent.length === 0 ? (
              <div className="empty-state">
                <span className="material-icons">inbox</span>
                <h3>No applications yet</h3>
                <p>Start tracking your job applications.</p>
              </div>
            ) : (
              <ul className="recent-list">
                {recent.map(app => {
                  const meta = STATUS_META[app.status] || STATUS_META.pending;
                  return (
                    <li key={app._id} className="recent-item">
                      <div className="recent-item__info">
                        <span className="recent-item__company">{app.company}</span>
                        <span className="recent-item__role">{app.role}</span>
                      </div>
                      <div className="recent-item__right">
                        <span className={`badge ${meta.badge}`}>{meta.label}</span>
                        <span className="recent-item__date">{formatDate(app.appliedAt)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && applications.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <span className="material-icons">work_outline</span>
            <h3>Start your job search journey</h3>
            <p>Track your applications, land interviews, and get the job you deserve.</p>
            <Link to="/applications" className="btn btn--primary">
              <span className="material-icons">add</span>
              Add Your First Application
            </Link>
          </div>
        </div>
      )}

      {/* AI-Recommended Jobs */}
      <RecommendedJobs />
    </div>
  );
}

function StatCard({ icon, color, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${color}`}>
        <span className="material-icons">{icon}</span>
      </div>
      <div>
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  );
}
