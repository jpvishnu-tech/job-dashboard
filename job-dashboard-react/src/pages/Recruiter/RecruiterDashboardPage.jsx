import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAnalytics } from '../../services/recruiter';
import './RecruiterPage.css';

function StatCard({ icon, label, value, iconClass }) {
  return (
    <div className="recruiter-stat-card">
      <div className={`stat-icon ${iconClass}`}>
        <span className="material-icons">{icon}</span>
      </div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{status}</span>;
}

export default function RecruiterDashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    getAnalytics(() => user.getIdToken())
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="recruiter-page"><div className="card"><div className="spinner" /></div></div>;
  if (error)   return <div className="recruiter-page"><div className="card" style={{ color: 'var(--color-red)' }}>{error}</div></div>;

  const { overview, pipeline, recentApplicants, topJobs } = data;

  return (
    <div className="recruiter-page">
      {/* Overview stats */}
      <div className="recruiter-stats">
        <StatCard icon="work"        label="Total Jobs"       value={overview.totalJobs}       iconClass="stat-icon--indigo" />
        <StatCard icon="circle"      label="Active Jobs"      value={overview.activeJobs}      iconClass="stat-icon--green"  />
        <StatCard icon="people"      label="Total Applicants" value={overview.totalApplicants} iconClass="stat-icon--blue"   />
        <StatCard icon="check_circle"label="Hired"            value={pipeline.hired}           iconClass="stat-icon--green"  />
        <StatCard icon="schedule"    label="In Interview"     value={pipeline.interview}       iconClass="stat-icon--purple" />
        <StatCard icon="star"        label="Shortlisted"      value={pipeline.shortlisted}     iconClass="stat-icon--amber"  />
      </div>

      {/* Pipeline funnel */}
      <div className="card">
        <div className="recruiter-section-header" style={{ marginBottom: 16 }}>
          <h2>Applicant Pipeline</h2>
        </div>
        <div className="pipeline-grid">
          {[
            { key: 'pending',     label: 'Pending',     color: '#f59e0b' },
            { key: 'shortlisted', label: 'Shortlisted', color: '#3b82f6' },
            { key: 'interview',   label: 'Interview',   color: '#8b5cf6' },
            { key: 'offer',       label: 'Offer',       color: '#22c55e' },
            { key: 'hired',       label: 'Hired',       color: '#059669' },
            { key: 'rejected',    label: 'Rejected',    color: '#ef4444' },
          ].map(({ key, label, color }) => (
            <div key={key} className="pipeline-item" style={{ borderTop: `3px solid ${color}` }}>
              <div className="pipeline-count" style={{ color }}>{pipeline[key] ?? 0}</div>
              <div className="pipeline-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent applicants */}
        <div className="card">
          <div className="recruiter-section-header" style={{ marginBottom: 16 }}>
            <h2>Recent Applicants</h2>
            <button className="btn btn--secondary btn--sm" onClick={() => navigate('/recruiter/applicants')}>
              View All
            </button>
          </div>
          {recentApplicants.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No applicants yet.</p>
          ) : (
            <div className="recruiter-table-wrap">
              <table className="recruiter-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplicants.map(app => (
                    <tr key={app._id}>
                      <td>
                        <div className="applicant-info">
                          <div className="applicant-avatar">
                            {app.user?.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div className="applicant-name">{app.user?.name ?? '—'}</div>
                            <div className="applicant-email">{app.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{app.job?.title ?? '—'}</td>
                      <td><StatusBadge status={app.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top jobs */}
        <div className="card">
          <div className="recruiter-section-header" style={{ marginBottom: 16 }}>
            <h2>Most Applied Jobs</h2>
            <button className="btn btn--secondary btn--sm" onClick={() => navigate('/recruiter/jobs')}>
              Manage Jobs
            </button>
          </div>
          {topJobs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No jobs posted yet.</p>
          ) : (
            <div className="recruiter-table-wrap">
              <table className="recruiter-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Applicants</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topJobs.map(item => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600 }}>{item.job?.title ?? '—'}</td>
                      <td>{item.count}</td>
                      <td>
                        <span className={`badge badge--${item.job?.isActive ? 'active' : 'closed'}`}>
                          {item.job?.isActive ? 'Active' : 'Closed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
