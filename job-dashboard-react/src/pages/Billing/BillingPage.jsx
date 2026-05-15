import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth }               from '../../context/AuthContext';
import { useSubscription }       from '../../context/SubscriptionContext';
import { getPaymentHistory, createBillingPortal } from '../../services/billing';
import './BillingPage.css';

function fmt(cents, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() })
    .format(cents / 100);
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const FEATURE_LABELS = {
  aiAnalysesPerMonth:   { label: 'AI Résumé Analyses', format: v => v === -1 ? 'Unlimited' : `${v}/month` },
  aiMatchesPerMonth:    { label: 'AI Job Matches',      format: v => v === -1 ? 'Unlimited' : `${v}/month` },
  applicationsPerMonth: { label: 'Applications',        format: v => v === -1 ? 'Unlimited' : `${v}/month` },
  recruiterPortal:      { label: 'Recruiter Portal',    format: v => v ? 'Included' : null },
  advancedAnalytics:    { label: 'Advanced Analytics',  format: v => v ? 'Included' : null },
  prioritySupport:      { label: 'Priority Support',    format: v => v ? 'Included' : null },
};

export default function BillingPage() {
  const { user }                                    = useAuth();
  const { plan, planName, status, features, periodEnd, cancelAtEnd, refresh } = useSubscription();
  const [payments,  setPayments]   = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [portalLoading, setPortalLoading]     = useState(false);
  const [searchParams]             = useSearchParams();

  // If user was redirected back from a successful Stripe checkout
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      refresh();
    }
  }, [searchParams, refresh]);

  useEffect(() => {
    if (!user) return;
    getPaymentHistory(() => user.getIdToken())
      .then(data => setPayments(data.payments ?? []))
      .catch(() => {})
      .finally(() => setPaymentsLoading(false));
  }, [user]);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const data = await createBillingPortal(() => user.getIdToken());
      window.location.href = data.url;
    } catch (err) {
      alert(err.message || 'Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  }

  const statusLabel = {
    active:    'Active',
    trialing:  'Trial',
    past_due:  'Past Due',
    canceled:  'Canceled',
    inactive:  'Inactive',
  }[status] ?? status;

  return (
    <div className="billing-page">

      {/* ── Current plan ── */}
      <div className="billing-card">
        <div className="billing-plan">
          <div className="billing-plan__left">
            <p className="billing-plan__label">Current Plan</p>
            <h2 className="billing-plan__name">
              {planName}
              <span className={`billing-plan__badge billing-plan__badge--${status}`}>
                {statusLabel}
              </span>
            </h2>
            {plan !== 'free' && periodEnd && (
              <p className="billing-plan__meta">
                {cancelAtEnd
                  ? `Cancels on ${fmtDate(periodEnd)}`
                  : `Renews on ${fmtDate(periodEnd)}`
                }
              </p>
            )}
            {plan === 'free' && (
              <p className="billing-plan__meta">No payment required</p>
            )}
          </div>
          <div className="billing-plan__actions">
            {plan === 'free' ? (
              <Link to="/pricing" className="billing-btn billing-btn--primary">
                <span className="material-icons" style={{ fontSize: 16 }}>rocket_launch</span>
                Upgrade Now
              </Link>
            ) : (
              <>
                <button
                  className="billing-btn billing-btn--outline"
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                >
                  <span className="material-icons" style={{ fontSize: 16 }}>manage_accounts</span>
                  {portalLoading ? 'Loading…' : 'Manage Billing'}
                </button>
                <Link to="/pricing" className="billing-btn billing-btn--outline">
                  <span className="material-icons" style={{ fontSize: 16 }}>swap_horiz</span>
                  Change Plan
                </Link>
              </>
            )}
          </div>
        </div>

        {cancelAtEnd && (
          <div className="billing-cancel-note" style={{ marginTop: 16 }}>
            <span className="material-icons">warning</span>
            Your subscription will cancel at the end of the current period ({fmtDate(periodEnd)}).
            Manage billing to resume.
          </div>
        )}
      </div>

      {/* ── Plan features ── */}
      <div className="billing-card">
        <p className="billing-features__title">What's included</p>
        <div className="billing-features__grid">
          {Object.entries(FEATURE_LABELS).map(([key, { label, format }]) => {
            const val      = features?.[key];
            const formatted = format(val);
            const isOn     = formatted !== null && val !== false && val !== 0;
            return (
              <div key={key} className={`billing-feature-chip billing-feature-chip--${isOn ? 'on' : 'off'}`}>
                <span className="material-icons">
                  {isOn ? 'check_circle' : 'remove_circle_outline'}
                </span>
                <span>
                  {label}{isOn && formatted !== 'Included' ? ` — ${formatted}` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Payment history ── */}
      <div className="billing-card">
        <h3 className="billing-section-title">Payment History</h3>
        {paymentsLoading ? (
          <p className="billing-empty">Loading…</p>
        ) : payments.length === 0 ? (
          <p className="billing-empty">No payments yet</p>
        ) : (
          <table className="billing-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td>{fmtDate(p.createdAt)}</td>
                  <td>{p.description || 'Subscription'}</td>
                  <td>{fmt(p.amount, p.currency)}</td>
                  <td>
                    <span className={`billing-status billing-status--${p.status}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    {p.invoiceUrl
                      ? <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="billing-invoice-link">View</a>
                      : '—'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
