import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getSalary } from '../../../services/career';

const LOCATIONS = [
  { value: 'us_national', label: 'US National (avg)'     },
  { value: 'sf_nyc',      label: 'San Francisco / NYC'   },
  { value: 'remote_us',   label: 'Remote (US)'           },
  { value: 'tier2_us',    label: 'Tier 2 US City'        },
  { value: 'europe',      label: 'Europe'                },
  { value: 'india',       label: 'India'                 },
];

const EXPERIENCES = [
  { value: 'entry',  label: 'Entry Level (0-2 yrs)'  },
  { value: 'mid',    label: 'Mid Level (2-5 yrs)'    },
  { value: 'senior', label: 'Senior Level (5-8 yrs)' },
  { value: 'lead',   label: 'Lead / Staff (8+ yrs)'  },
];

const BAND_LABELS = {
  entry:  { label: 'Entry',   color: '#64748b' },
  mid:    { label: 'Mid',     color: '#3b82f6' },
  senior: { label: 'Senior',  color: '#6366f1' },
  lead:   { label: 'Lead',    color: '#8b5cf6' },
};

const TREND_META = {
  up:     { icon: 'trending_up',   color: '#10b981', label: 'Trending Up'    },
  stable: { icon: 'trending_flat', color: '#64748b', label: 'Stable'         },
  down:   { icon: 'trending_down', color: '#ef4444', label: 'Declining'      },
};

function fmt(val) {
  if (!val) return 'N/A';
  return `$${(val * 1000).toLocaleString()}`;
}

function SalaryBandRow({ bandKey, band, overallMin, overallMax, multiplier }) {
  if (!band?.min) return null;
  const meta    = BAND_LABELS[bandKey];
  const adjMin  = Math.round(band.min  * (multiplier || 1));
  const adjMed  = Math.round(band.median * (multiplier || 1));
  const adjMax  = Math.round(band.max  * (multiplier || 1));
  const range   = overallMax - overallMin || 1;
  const leftPct = Math.max(0, ((adjMin - overallMin) / range) * 100);
  const widPct  = Math.min(100, ((adjMax - adjMin) / range) * 100);
  const medPct  = Math.min(100, ((adjMed - overallMin) / range) * 100);

  return (
    <div className="salary-band-row">
      <span className="salary-band-label" style={{ color: meta.color }}>{meta.label}</span>
      <div className="salary-band-track">
        <div
          className="salary-band-bar"
          style={{ left: `${leftPct}%`, width: `${widPct}%`, background: `${meta.color}33`, borderColor: meta.color }}
        />
        <div className="salary-band-median" style={{ left: `${medPct}%`, background: meta.color }} title={`Median: ${fmt(adjMed)}`} />
      </div>
      <div className="salary-band-values">
        <span className="salary-val salary-val--min">{fmt(adjMin)}</span>
        <span className="salary-val salary-val--med" style={{ color: meta.color }}>{fmt(adjMed)}</span>
        <span className="salary-val salary-val--max">{fmt(adjMax)}</span>
      </div>
    </div>
  );
}

export default function SalaryPanel() {
  const { user } = useAuth();
  const [form, setForm]         = useState({ role: '', location: 'us_national', experience: 'mid' });
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.role.trim()) { setError('Role is required.'); return; }
    setLoading(true);
    try {
      const res = await getSalary(() => user.getIdToken(), form);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const bands       = data?.salaryBands ?? {};
  const multiplier  = data?.locationMultipliers?.[form.location] ?? 1;
  const allVals     = Object.values(bands).flatMap(b => b ? [b.min * multiplier, b.max * multiplier] : []);
  const overallMin  = allVals.length ? Math.min(...allVals) : 0;
  const overallMax  = allVals.length ? Math.max(...allVals) : 200;
  const trendMeta   = TREND_META[data?.trendDirection] || TREND_META.stable;
  const locLabel    = LOCATIONS.find(l => l.value === form.location)?.label || form.location;

  return (
    <div className="salary-panel">
      {/* Search form */}
      <div className="card salary-form">
        <div className="salary-form__header">
          <span className="material-icons" style={{ color: '#10b981', fontSize: 28 }}>payments</span>
          <div>
            <h3 className="salary-form__title">Salary Intelligence</h3>
            <p className="salary-form__sub">AI-powered compensation data — helps you negotiate with confidence</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="salary-form__fields">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Job Title / Role *</label>
              <input className="form-control" placeholder="e.g. Senior Frontend Engineer"
                value={form.role} onChange={e => set('role', e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Location Market</label>
              <select className="form-control" value={form.location} onChange={e => set('location', e.target.value)}>
                {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Experience Level</label>
              <select className="form-control" value={form.experience} onChange={e => set('experience', e.target.value)}>
                {EXPERIENCES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>
          {error && <div className="modal-error"><span className="material-icons">error_outline</span>{error}</div>}
          <button type="submit" className="btn btn--primary" disabled={loading} style={{ marginTop: 12 }}>
            <span className="material-icons">{loading ? 'hourglass_top' : 'search'}</span>
            {loading ? 'Fetching Data…' : 'Get Salary Data'}
          </button>
        </form>
      </div>

      {/* Results */}
      {data && (
        <>
          {/* Summary + trend */}
          <div className="card salary-summary">
            <div className="salary-summary__left">
              <h4 className="salary-summary__title">{data.role}</h4>
              <p className="salary-summary__overview">{data.roleSummary}</p>
            </div>
            <div className="salary-summary__right">
              <div className="salary-trend-badge" style={{ background: `${trendMeta.color}15`, border: `1px solid ${trendMeta.color}40` }}>
                <span className="material-icons" style={{ color: trendMeta.color }}>{trendMeta.icon}</span>
                <div>
                  <strong style={{ color: trendMeta.color }}>{trendMeta.label}</strong>
                  <p>{data.trendNote}</p>
                </div>
              </div>
              {multiplier !== 1 && (
                <div className="salary-location-badge">
                  <span className="material-icons">location_on</span>
                  <div>
                    <strong>{locLabel}</strong>
                    <p>{multiplier > 1 ? '+' : ''}{Math.round((multiplier - 1) * 100)}% vs US national</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Salary bands chart */}
          <div className="card salary-chart-card">
            <h4 className="salary-chart-title">
              <span className="material-icons">bar_chart</span>
              Compensation Bands
              {multiplier !== 1 && <span className="salary-location-note">Adjusted for {locLabel}</span>}
            </h4>
            <div className="salary-chart-legend">
              <span>Min</span><span>Median ●</span><span>Max</span>
            </div>
            <div className="salary-bands">
              {['entry', 'mid', 'senior', 'lead'].map(k => (
                bands[k]?.min ? (
                  <SalaryBandRow
                    key={k} bandKey={k} band={bands[k]}
                    overallMin={overallMin} overallMax={overallMax}
                    multiplier={multiplier}
                  />
                ) : null
              ))}
            </div>
            {data.totalCompensationNote && (
              <p className="salary-tc-note">
                <span className="material-icons">info_outline</span>
                {data.totalCompensationNote}
              </p>
            )}
          </div>

          {/* Location multipliers */}
          <div className="card salary-loc-card">
            <h4 className="salary-chart-title">
              <span className="material-icons">public</span>
              Location Salary Multipliers
            </h4>
            <div className="loc-grid">
              {Object.entries(data.locationMultipliers || {}).map(([key, mult]) => {
                const loc = LOCATIONS.find(l => l.value === key) || { label: key };
                const pct = Math.round((mult - 1) * 100);
                const color = mult >= 1.2 ? '#6366f1' : mult >= 1 ? '#3b82f6' : mult >= 0.5 ? '#f59e0b' : '#94a3b8';
                return (
                  <div key={key} className="loc-item">
                    <span className="loc-item__name">{loc.label}</span>
                    <div className="loc-item__bar-wrap">
                      <div className="loc-item__bar"
                        style={{ width: `${Math.min(100, mult * 70)}%`, background: color }} />
                    </div>
                    <span className="loc-item__mult" style={{ color }}>
                      {pct > 0 ? '+' : ''}{pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top paying companies */}
          {data.topPayingCompanies?.length > 0 && (
            <div className="card salary-companies-card">
              <h4 className="salary-chart-title">
                <span className="material-icons">business</span>
                Top-Paying Companies for this Role
              </h4>
              <div className="top-companies-chips">
                {data.topPayingCompanies.map((c, i) => (
                  <span key={i} className="top-company-chip">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Negotiation tips */}
          {data.negotiationTips?.length > 0 && (
            <div className="card salary-tips-card">
              <h4 className="salary-chart-title">
                <span className="material-icons">handshake</span>
                Negotiation Tips
              </h4>
              <ul className="negotiation-tips">
                {data.negotiationTips.map((tip, i) => (
                  <li key={i}>
                    <span className="negotiation-tip-num">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.dataNote && (
            <p className="salary-data-note">
              <span className="material-icons">info</span>{data.dataNote}
            </p>
          )}
        </>
      )}
    </div>
  );
}
