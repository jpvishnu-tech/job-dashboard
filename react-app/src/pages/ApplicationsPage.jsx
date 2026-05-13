import { useAuth } from '../context/AuthContext';
import './ApplicationsPage.css';

// Demo data shown in placeholder / empty state
const DEMO_APPLICATIONS = [
  { company: 'Stripe',  role: 'Frontend Engineer',  location: 'Remote',            salary: '$140k–$170k', type: 'Full-time',  url: '#', status: 'interview', appliedAt: '2026-01-15' },
  { company: 'Vercel',  role: 'React Developer',    location: 'Remote',            salary: '$130k–$160k', type: 'Full-time',  url: '#', status: 'pending',   appliedAt: '2026-01-18' },
  { company: 'Figma',   role: 'UI Engineer',        location: 'San Francisco, CA', salary: '$150k–$180k', type: 'Full-time',  url: '#', status: 'offer',     appliedAt: '2026-01-20' },
  { company: 'Linear',  role: 'Product Engineer',   location: 'Remote',            salary: '$120k–$145k', type: 'Full-time',  url: '#', status: 'rejected',  appliedAt: '2026-01-22' },
  { company: 'Loom',    role: 'Software Engineer',  location: 'Remote',            salary: '$115k–$140k', type: 'Contract',   url: '#', status: 'pending',   appliedAt: '2026-01-25' },
];

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   cls: 'apps-status--pending'   },
  interview: { label: 'Interview', cls: 'apps-status--interview' },
  offer:     { label: 'Offer',     cls: 'apps-status--offer'     },
  rejected:  { label: 'Rejected',  cls: 'apps-status--rejected'  },
};

const STATUS_OPTIONS = ['pending', 'interview', 'offer', 'rejected'];

/**
 * ApplicationsPage
 * ─────────────────────────────────────────────────────────────
 * Lists all jobs the user has applied to, pulled from AuthContext.
 * Falls back to demo data in placeholder mode so the UI is never empty.
 * Each row has a status selector so the user can track their progress.
 */
export default function ApplicationsPage() {
  const { applications, updateApplicationStatus } = useAuth();

  // Use demo data when there are no real applications (placeholder mode)
  const rows = applications.length > 0 ? applications : DEMO_APPLICATIONS;
  const isDemo = applications.length === 0;

  const formatDate = (raw) => {
    if (!raw) return '—';
    try {
      const d = raw.toDate ? raw.toDate() : new Date(raw);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  return (
    <>
      <div className="content__header">
        <div>
          <h1 className="content__title">Applications</h1>
          <p className="content__subtitle">
            {isDemo
              ? 'Demo data — apply to jobs on the Dashboard to track real applications.'
              : `${applications.length} application${applications.length !== 1 ? 's' : ''} tracked.`
            }
          </p>
        </div>
        {isDemo && (
          <span className="apps-demo-badge">
            <span className="material-icons">info_outline</span>
            Demo
          </span>
        )}
      </div>

      <div className="card">
        {/* ── Stat strip ─────────────────────────────────────────── */}
        <div className="apps-stats">
          {STATUS_OPTIONS.map((s) => {
            const count = rows.filter((r) => r.status === s).length;
            const cfg   = STATUS_CONFIG[s];
            return (
              <div key={s} className={`apps-stat apps-stat--${s}`}>
                <span className="apps-stat__count">{count}</span>
                <span className="apps-stat__label">{cfg.label}</span>
              </div>
            );
          })}
        </div>

        {/* ── Table ──────────────────────────────────────────────── */}
        <div className="apps-table-wrap">
          <table className="apps-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Location</th>
                <th>Salary</th>
                <th>Type</th>
                <th>Applied</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((app, i) => {
                const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={app.url + i} className="apps-row">
                    <td>
                      <div className="apps-company">
                        <img
                          src={`https://logo.clearbit.com/${app.company.toLowerCase().replace(/\s+/g, '')}.com`}
                          alt={app.company}
                          className="apps-company__logo"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&background=6366f1&color=fff&size=32`;
                          }}
                        />
                        <span className="apps-company__name">{app.company}</span>
                      </div>
                    </td>
                    <td className="apps-role">{app.role}</td>
                    <td className="apps-location">
                      <span className="material-icons" style={{ fontSize: 14, marginRight: 3, verticalAlign: 'middle', opacity: 0.6 }}>
                        location_on
                      </span>
                      {app.location}
                    </td>
                    <td className="apps-salary">{app.salary || '—'}</td>
                    <td>
                      <span className="type-badge type-badge--full-time">{app.type}</span>
                    </td>
                    <td className="apps-date">{formatDate(app.appliedAt)}</td>
                    <td>
                      {/* Status selector — updates Firestore optimistically */}
                      <select
                        className={`apps-status ${cfg.cls}`}
                        value={app.status || 'pending'}
                        onChange={(e) => updateApplicationStatus(app.url, e.target.value)}
                        disabled={isDemo}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {app.url && app.url !== '#' && (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="apps-link"
                          title="View job posting"
                        >
                          <span className="material-icons">open_in_new</span>
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="content__placeholder" style={{ minHeight: 240 }}>
            <span className="material-icons">assignment_late</span>
            <h2>No applications yet</h2>
            <p>Click Apply on any job in the Dashboard or Jobs page to start tracking.</p>
          </div>
        )}
      </div>
    </>
  );
}
