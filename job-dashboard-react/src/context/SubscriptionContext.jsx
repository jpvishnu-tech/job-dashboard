import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSubscription } from '../services/billing';

const SubscriptionContext = createContext(null);

const FREE_FEATURES = {
  aiAnalysesPerMonth:   3,
  aiMatchesPerMonth:    1,
  applicationsPerMonth: 10,
  recruiterPortal:      false,
  advancedAnalytics:    false,
  maxActiveJobs:        0,
  prioritySupport:      false,
};

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [plan,       setPlan]       = useState('free');
  const [planName,   setPlanName]   = useState('Free');
  const [status,     setStatus]     = useState('active');
  const [features,   setFeatures]   = useState(FREE_FEATURES);
  const [periodEnd,  setPeriodEnd]  = useState(null);
  const [cancelAtEnd,setCancelAtEnd]= useState(false);
  const [loading,    setLoading]    = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan('free');
      setPlanName('Free');
      setStatus('active');
      setFeatures(FREE_FEATURES);
      setLoading(false);
      return;
    }
    try {
      const data = await getSubscription(() => user.getIdToken());
      const sub  = data.subscription;
      setPlan(sub.plan);
      setPlanName(sub.planName);
      setStatus(sub.status);
      setFeatures(sub.features ?? FREE_FEATURES);
      setPeriodEnd(sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null);
      setCancelAtEnd(sub.cancelAtPeriodEnd ?? false);
    } catch {
      // If the call fails, default to free
      setPlan('free');
      setPlanName('Free');
      setStatus('active');
      setFeatures(FREE_FEATURES);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const isActive    = ['active', 'trialing'].includes(status);
  const isPremium   = isActive && plan !== 'free';
  const isRecruiterPlan = isActive && (plan === 'recruiter' || plan === 'premium_recruiter');

  return (
    <SubscriptionContext.Provider value={{
      plan, planName, status, features, periodEnd, cancelAtEnd,
      loading, refresh,
      isActive, isPremium, isRecruiterPlan,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be inside SubscriptionProvider');
  return ctx;
}
