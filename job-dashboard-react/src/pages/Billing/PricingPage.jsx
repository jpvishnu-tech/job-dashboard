import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../../context/AuthContext';
import { useSubscription }     from '../../context/SubscriptionContext';
import { getPlans, createCheckoutSession } from '../../services/billing';
import './PricingPage.css';

const POPULAR_PLAN = 'premium_user';

export default function PricingPage() {
  const { user }                       = useAuth();
  const { plan: currentPlan, refresh } = useSubscription();
  const navigate                       = useNavigate();

  const [plans,     setPlans]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState(null); // planId being upgraded to

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(planId) {
    if (!user) { navigate('/login'); return; }
    if (planId === 'free') return;

    setUpgrading(planId);
    try {
      const data = await createCheckoutSession(() => user.getIdToken(), planId);
      window.location.href = data.url;
    } catch (err) {
      if (err.code === 'EXISTING_SUBSCRIPTION') {
        // Redirect to billing portal for plan changes
        navigate('/billing');
      } else {
        alert(err.message || 'Failed to start checkout. Please try again.');
      }
    } finally {
      setUpgrading(null);
    }
  }

  if (loading) {
    return (
      <div className="pricing-page">
        <div className="pricing-header">
          <h1 className="pricing-header__title">Choose Your Plan</h1>
        </div>
        <div className="pricing-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="plan-card" style={{ minHeight: 420, background: 'var(--border-color)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1 className="pricing-header__title">Choose Your Plan</h1>
        <p className="pricing-header__sub">
          Upgrade to unlock unlimited AI analysis, advanced recruiting tools, and more.
        </p>
      </div>

      <div className="pricing-grid">
        {plans.map(plan => {
          const isCurrent = plan.id === currentPlan;
          const isPopular = plan.id === POPULAR_PLAN;

          return (
            <div
              key={plan.id}
              className={`plan-card${isPopular ? ' plan-card--popular' : ''}${isCurrent ? ' plan-card--current' : ''}`}
            >
              {isCurrent && (
                <span className="plan-card__badge plan-card__badge--current">Current Plan</span>
              )}
              {!isCurrent && isPopular && (
                <span className="plan-card__badge">Most Popular</span>
              )}

              <div className="plan-card__header">
                <h2 className="plan-card__name">{plan.name}</h2>
                <p className="plan-card__desc">{plan.description}</p>
              </div>

              <div className="plan-card__price">
                {plan.price === 0 ? (
                  <>
                    <span className="plan-card__amount">Free</span>
                  </>
                ) : (
                  <>
                    <span className="plan-card__currency">$</span>
                    <span className="plan-card__amount">{plan.price.toFixed(2)}</span>
                    <span className="plan-card__interval">/ {plan.interval}</span>
                  </>
                )}
              </div>

              <ul className="plan-card__features">
                {plan.highlights?.map((feat, i) => (
                  <li key={i} className="plan-feature plan-feature--included">
                    <span className="material-icons">check_circle</span>
                    {feat}
                  </li>
                ))}
                {plan.notIncluded?.map((feat, i) => (
                  <li key={i} className="plan-feature plan-feature--excluded">
                    <span className="material-icons">remove_circle_outline</span>
                    {feat}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button className="plan-card__cta plan-card__cta--current" disabled>
                  Current Plan
                </button>
              ) : plan.id === 'free' ? (
                <button className="plan-card__cta plan-card__cta--outline" disabled>
                  Free Forever
                </button>
              ) : (
                <button
                  className={`plan-card__cta${isPopular ? ' plan-card__cta--primary' : ' plan-card__cta--outline'}`}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading === plan.id}
                >
                  {upgrading === plan.id
                    ? 'Redirecting…'
                    : currentPlan !== 'free'
                      ? 'Switch to This Plan'
                      : `Get ${plan.name}`
                  }
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="pricing-cancel-notice">
        Cancel anytime. No lock-in contracts. Billed securely via Stripe.
      </p>
    </div>
  );
}
