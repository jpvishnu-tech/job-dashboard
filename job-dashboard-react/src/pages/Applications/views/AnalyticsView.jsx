import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getAnalytics } from '../../../services/applications';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="analytics-stat-card card">
      <div className="analytics-stat-card__icon" style={{ background: `${color}20`, color }}>
        <span className="material-icons">{icon}</span>
      </div>
      <div>
        <div className="analytics-stat-card__value">{value}</div>
        <div className="analytics-stat-card__label">{label}</div>
        {sub && <div className="analytics-stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}

function FunnelBar({ label, count, max, color }) {
  const pct = max > 0 ? Math.round(count / max * 100) : 0;
  return (
    <div className="funnel-row">
      <span className="funnel-row__label">{label}</span>
      <div className="funnel-row__bar-wrap">
        <div className="funnel-row__bar" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="funnel-row__count">{count}</span>
      <span className="funnel-row__pct">{pct}%</span>
    </div>
  );
}

function MonthlyChart({ monthly }) {
  if (!monthly?.length) return (
    <div className="analytics-empty">
      <span className="material-icons">bar_chart</span>
      <p>No activity data yet</p>
    </div>
  );

  const max = Math.max(...monthly.map(m => m.count), 1);
  return (
    <div className="monthly-chart">
      {monthly.map(m => {
        const pct = Math.round(m.count / max * 100);
        const label = `${MONTH_NAMES[(m._id.month || 1) - 1]} ${m._id.year}`;
        return (
          <div key={label} className="monthly-chart__bar-wrap" title={`${label}: ${m.count}`}>
            <div className="monthly-chart__bar" style={{ height: `${Math.max(pct, 4)}%` }} />
            <span className="monthly-chart__label">{MONTH_NAMES[(m._id.month || 1) - 1]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsView() {
  const { user }      = useAuth();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalytics(() => user.getIdToken());
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="analytics-view">
        <div className="analytics-stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="analytics-stat-card card analytics-skeleton" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-view">
        <div className="card analytics-error">
          <span className="material-icons">error_outline</span>
          <p>{error}</p>
          <button className="btn btn--secondary btn--sm" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="analytics-view">
        <div className="card analytics-empty-state">
          <span className="material-icons">analytics</span>
          <h3>No analytics yet</h3>
          <p>Add applications to your pipeline to see insights here.</p>
        </div>
      </div>
    );
  }

  const funnelMax = data.funnel.applied || data.total;

  return (
    <div className="analytics-view">
      {/* Stat cards */}
      <div className="analytics-stats-grid">
        <StatCard icon="assignment"     label="Total Applications" value={data.total}               color="#6366f1" />
        <StatCard icon="groups"         label="Interviews"         value={data.funnel.interviewed}  color="#f59e0b"
          sub={`${data.rates.interviewRate}% interview rate`} />
        <StatCard icon="celebration"    label="Offers Received"    value={data.funnel.offered}      color="#10b981"
          sub={`${data.rates.offerRate}% offer rate`} />
        <StatCard icon="workspace_premium" label="Hired"           value={data.funnel.hired}        color="#059669"
          sub={`${data.rates.successRate}% success rate`} />
      </div>

      <div className="analytics-grid">
        {/* Hiring funnel */}
        <div className="card analytics-panel">
          <h3 className="analytics-panel__title">
            <span className="material-icons">filter_list</span>
            Hiring Funnel
          </h3>
          <div className="funnel-chart">
            <FunnelBar label="Saved"        count={data.funnel.saved        || 0} max={data.total}  color="#64748b" />
            <FunnelBar label="Applied"      count={data.funnel.applied      || 0} max={data.total}  color="#3b82f6" />
            <FunnelBar label="Under Review" count={data.funnel.reviewed     || 0} max={data.total}  color="#8b5cf6" />
            <FunnelBar label="Interviewed"  count={data.funnel.interviewed  || 0} max={data.total}  color="#f59e0b" />
            <FunnelBar label="Offered"      count={data.funnel.offered      || 0} max={data.total}  color="#10b981" />
            <FunnelBar label="Hired"        count={data.funnel.hired        || 0} max={data.total}  color="#059669" />
          </div>
        </div>

        {/* Monthly activity */}
        <div className="card analytics-panel">
          <h3 className="analytics-panel__title">
            <span className="material-icons">bar_chart</span>
            Monthly Activity
          </h3>
          <MonthlyChart monthly={data.monthly} />
        </div>
      </div>

      {/* Conversion rates */}
      <div className="card analytics-panel">
        <h3 className="analytics-panel__title">
          <span className="material-icons">trending_up</span>
          Conversion Rates
        </h3>
        <div className="rates-grid">
          <RateCard label="Applied → Interview" value={data.rates.interviewRate} color="#f59e0b" icon="groups" />
          <RateCard label="Applied → Offer"     value={data.rates.offerRate}     color="#10b981" icon="celebration" />
          <RateCard label="Applied → Hired"     value={data.rates.successRate}   color="#059669" icon="workspace_premium" />
          <RateCard label="Rejection Rate"      value={data.rates.rejectionRate} color="#ef4444" icon="cancel" />
        </div>
      </div>
    </div>
  );
}

function RateCard({ label, value, color, icon }) {
  const cls = value >= 20 ? 'rate--high' : value >= 10 ? 'rate--mid' : 'rate--low';
  return (
    <div className="rate-card">
      <div className="rate-card__ring-wrap">
        <svg viewBox="0 0 36 36" className="rate-card__ring">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border-color)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${value} ${100 - value}`}
            strokeDashoffset="25"
            strokeLinecap="round"
          />
        </svg>
        <span className="rate-card__value" style={{ color }}>{value}%</span>
      </div>
      <span className="material-icons rate-card__icon" style={{ color }}>{icon}</span>
      <span className="rate-card__label">{label}</span>
    </div>
  );
}
