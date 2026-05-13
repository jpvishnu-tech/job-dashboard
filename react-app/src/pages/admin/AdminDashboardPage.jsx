import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend,
} from 'recharts';
import { api }      from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import './admin.css';

// ── Palette ────────────────────────────────────────────────────
const C = {
  primary:   '#6366f1',
  green:     '#22c55e',
  amber:     '#f59e0b',
  blue:      '#3b82f6',
  red:       '#ef4444',
  purple:    '#8b5cf6',
};

const STATUS_COLORS = {
  pending:   C.amber,
  interview: C.blue,
  offer:     C.green,
  rejected:  C.red,
};

const TYPE_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#06b6d4'];

// ── Helpers ────────────────────────────────────────────────────

function fillTimeline(raw = []) {
  const map = {};
  raw.forEach(({ _id, total, interviews }) => { map[_id] = { total, interviews }; });

  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key   = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date:       key,
      label,
      applications: map[key]?.total      ?? 0,
      interviews:   map[key]?.interviews ?? 0,
    };
  });
}

function pct(n, total) {
  return total === 0 ? 0 : Math.round((n / total) * 100 * 10) / 10;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Custom tooltip ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  const bg     = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,.15)',
      fontSize: '0.8rem',
    }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: isDark ? '#f1f5f9' : '#1e293b' }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color, margin: '2px 0' }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Rate donut ─────────────────────────────────────────────────
function RateDonut({ rate, color, label, sub, isDark }) {
  const track = isDark ? '#334155' : '#e2e8f0';
  const data  = [
    { value: Math.max(0, Math.min(100, rate)) },
    { value: Math.max(0, 100 - rate) },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: '100%', height: 180 }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius="55%"
              outerRadius="72%"
              paddingAngle={rate > 0 && rate < 100 ? 3 : 0}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill={track} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: '1.6rem', fontWeight: 800,
            color: isDark ? '#f1f5f9' : '#1e293b',
            lineHeight: 1,
          }}>{rate.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isDark ? '#f1f5f9' : '#1e293b' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { isDark } = useTheme();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch((err)    => setError(err.message))
      .finally(()     => setLoading(false));
  }, []);

  if (loading) return (
    <div className="admin-loading">
      <div className="admin-loading__spinner" />
      Loading analytics…
    </div>
  );

  if (error) return (
    <div className="admin-empty">
      <span className="material-icons">error_outline</span>
      <span className="admin-empty__text">{error}</span>
    </div>
  );

  // Derived values
  const bs           = stats.applications.byStatus;
  const appTotal     = stats.applications.total || 1;
  const interviewRate = pct(bs.interview + bs.offer, appTotal);
  const rejectionRate = pct(bs.rejected, appTotal);
  const offerRate     = pct(bs.offer, appTotal);

  const timeline = fillTimeline(stats.timeline ?? []);

  const pipelineData = [
    { name: 'Pending',   count: bs.pending,   fill: C.amber  },
    { name: 'Interview', count: bs.interview, fill: C.blue   },
    { name: 'Offer',     count: bs.offer,     fill: C.green  },
    { name: 'Rejected',  count: bs.rejected,  fill: C.red    },
  ];

  const typeEntries = Object.entries(stats.jobsByType ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({ name, count, fill: TYPE_COLORS[i % TYPE_COLORS.length] }));

  // Chart theme tokens
  const axisColor    = isDark ? '#94a3b8' : '#64748b';
  const gridColor    = isDark ? '#334155' : '#e2e8f0';

  return (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="content__header">
        <div>
          <h1 className="content__title">Admin Overview</h1>
          <p className="content__subtitle">Platform health and activity at a glance</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/users" className="btn btn--ghost btn--sm">
            <span className="material-icons">people</span> Users
          </Link>
          <Link to="/admin/jobs" className="btn btn--primary btn--sm">
            <span className="material-icons">work</span> Manage Jobs
          </Link>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat__icon admin-stat__icon--blue">
            <span className="material-icons">people</span>
          </div>
          <div className="admin-stat__value">{stats.users.total}</div>
          <div className="admin-stat__label">Total Users</div>
          <div className="admin-stat__sub">{stats.users.admins} admin{stats.users.admins !== 1 ? 's' : ''} · {stats.users.regular} regular</div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat__icon admin-stat__icon--green">
            <span className="material-icons">work</span>
          </div>
          <div className="admin-stat__value">{stats.jobs.active}</div>
          <div className="admin-stat__label">Active Jobs</div>
          <div className="admin-stat__sub">{stats.jobs.inactive} inactive · {stats.jobs.total} total</div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat__icon admin-stat__icon--purple">
            <span className="material-icons">assignment</span>
          </div>
          <div className="admin-stat__value">{stats.applications.total}</div>
          <div className="admin-stat__label">Applications</div>
          <div className="admin-stat__sub">{bs.offer} offer{bs.offer !== 1 ? 's' : ''} · {bs.interview} interview{bs.interview !== 1 ? 's' : ''}</div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat__icon admin-stat__icon--amber">
            <span className="material-icons">trending_up</span>
          </div>
          <div className="admin-stat__value">{offerRate}%</div>
          <div className="admin-stat__label">Offer Rate</div>
          <div className="admin-stat__sub">{bs.offer} offer{bs.offer !== 1 ? 's' : ''} from {appTotal - 1} applications</div>
        </div>
      </div>

      {/* ── Applications over time ──────────────────────────── */}
      <div className="admin-panel">
        <div className="admin-panel__header">
          <div className="admin-panel__title">
            <span className="material-icons">show_chart</span>
            Applications Over Time
            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: axisColor, marginLeft: 4 }}>
              last 30 days
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: C.primary, display: 'inline-block' }} />
              Applications
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: C.green, display: 'inline-block' }} />
              Reached Interview
            </span>
          </div>
        </div>
        <div style={{ padding: '8px 20px 20px' }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeline} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="gradApp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.primary} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradInt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.green} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: axisColor }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: axisColor }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<ChartTooltip isDark={isDark} />}
                cursor={{ stroke: gridColor, strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="applications"
                name="Applications"
                stroke={C.primary}
                strokeWidth={2}
                fill="url(#gradApp)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="interviews"
                name="Reached Interview"
                stroke={C.green}
                strokeWidth={2}
                fill="url(#gradInt)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Pipeline + Rate donuts ──────────────────────────── */}
      <div className="admin-chart-row">
        {/* Application Pipeline */}
        <div className="admin-panel admin-chart-row__main">
          <div className="admin-panel__header">
            <div className="admin-panel__title">
              <span className="material-icons">filter_list</span>
              Application Pipeline
            </div>
          </div>
          <div style={{ padding: '8px 20px 20px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipelineData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltip isDark={isDark} />}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' }}
                />
                <Bar dataKey="count" name="Applications" radius={[5, 5, 0, 0]}>
                  {pipelineData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interview Rate */}
        <div className="admin-panel admin-chart-row__donut">
          <div className="admin-panel__header">
            <div className="admin-panel__title">
              <span className="material-icons">record_voice_over</span>
              Interview Rate
            </div>
          </div>
          <div style={{ padding: '8px 20px 20px' }}>
            <RateDonut
              rate={interviewRate}
              color={C.blue}
              label="Reached Interview"
              sub={`${bs.interview + bs.offer} of ${appTotal - 1} applicants`}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Rejection Rate */}
        <div className="admin-panel admin-chart-row__donut">
          <div className="admin-panel__header">
            <div className="admin-panel__title">
              <span className="material-icons">do_not_disturb</span>
              Rejection Rate
            </div>
          </div>
          <div style={{ padding: '8px 20px 20px' }}>
            <RateDonut
              rate={rejectionRate}
              color={C.red}
              label="Rejected"
              sub={`${bs.rejected} of ${appTotal - 1} applicants`}
              isDark={isDark}
            />
          </div>
        </div>
      </div>

      {/* ── Jobs by type + Recent applications ─────────────── */}
      <div className="admin-analytics">
        <div className="admin-panel">
          <div className="admin-panel__header">
            <div className="admin-panel__title">
              <span className="material-icons">pie_chart</span>
              Jobs by Type
            </div>
          </div>
          <div style={{ padding: '8px 20px 20px' }}>
            {typeEntries.length === 0
              ? <div className="admin-empty" style={{ padding: '24px 0' }}>
                  <span className="material-icons">work_off</span>
                  <span className="admin-empty__text">No job data yet</span>
                </div>
              : <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={typeEntries}
                    layout="vertical"
                    margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: axisColor }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: axisColor }}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                    />
                    <Tooltip
                      content={<ChartTooltip isDark={isDark} />}
                      cursor={{ fill: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' }}
                    />
                    <Bar dataKey="count" name="Active jobs" radius={[0, 5, 5, 0]}>
                      {typeEntries.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

        {/* Recent applications */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <div className="admin-panel__title">
              <span className="material-icons">assignment_turned_in</span>
              Recent Applications
            </div>
          </div>
          <div className="admin-panel__body" style={{ padding: '0 20px' }}>
            {stats.recentApps.length === 0
              ? <div className="admin-empty" style={{ padding: '24px 0' }}>
                  <span className="material-icons">assignment_late</span>
                  <span className="admin-empty__text">No applications yet</span>
                </div>
              : <div className="recent-list">
                  {stats.recentApps.map((a) => (
                    <div key={a._id} className="recent-list__item">
                      <div className="recent-list__left">
                        <div>
                          <div className="recent-list__name">{a.role}</div>
                          <div className="recent-list__sub">{a.company} · {formatDate(a.appliedAt)}</div>
                        </div>
                      </div>
                      <div className="recent-list__right">
                        <span className={`status-badge status-badge--${a.status}`}>{a.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      </div>

      {/* ── Recent users ───────────────────────────────────── */}
      <div className="admin-panel">
        <div className="admin-panel__header">
          <div className="admin-panel__title">
            <span className="material-icons">person_add</span>
            Recent Sign-ups
          </div>
          <Link to="/admin/users" className="btn btn--ghost btn--sm">View all</Link>
        </div>
        <div className="admin-panel__body" style={{ padding: '0 20px' }}>
          {stats.recentUsers.length === 0
            ? <div className="admin-empty" style={{ padding: '24px 0' }}>
                <span className="material-icons">people_outline</span>
                <span className="admin-empty__text">No users yet</span>
              </div>
            : <div className="recent-list">
                {stats.recentUsers.map((u) => {
                  const name = u.name || u.email?.split('@')[0] || 'User';
                  const src  = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=30&bold=true`;
                  return (
                    <div key={u._id} className="recent-list__item">
                      <div className="recent-list__left">
                        <img src={src} alt={name} className="recent-list__avatar" />
                        <div>
                          <div className="recent-list__name">{name}</div>
                          <div className="recent-list__sub">{u.email}</div>
                        </div>
                      </div>
                      <div className="recent-list__right">
                        <span className={`role-badge role-badge--${u.role}`}>
                          <span className="material-icons">{u.role === 'admin' ? 'shield' : 'person'}</span>
                          {u.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      </div>
    </>
  );
}
