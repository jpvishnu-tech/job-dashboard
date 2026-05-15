/**
 * plans.js — single source of truth for all subscription plans.
 *
 * features.*  semantics:
 *   -1  = unlimited
 *    0  = not included
 *    n  = monthly hard cap (n > 0)
 */

export const PLANS = {
  free: {
    id:          'free',
    name:        'Free',
    description: 'Get started — no credit card required',
    price:       0,
    interval:    null,
    stripePriceId: null,

    features: {
      aiAnalysesPerMonth:   3,
      aiMatchesPerMonth:    1,
      applicationsPerMonth: 10,
      recruiterPortal:      false,
      advancedAnalytics:    false,
      maxActiveJobs:        0,
      prioritySupport:      false,
    },

    // Human-readable feature list (for Pricing UI)
    highlights: [
      '10 job applications / month',
      '3 AI résumé analyses / month',
      '1 AI job-match / month',
      'Basic dashboard',
    ],
    notIncluded: [
      'Unlimited applications',
      'Unlimited AI analysis',
      'Recruiter portal',
      'Advanced analytics',
    ],
  },

  premium_user: {
    id:          'premium_user',
    name:        'Premium',
    description: 'For serious job seekers who want an edge',
    price:       9.99,
    interval:    'month',
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_USER ?? null,

    features: {
      aiAnalysesPerMonth:   -1,
      aiMatchesPerMonth:    -1,
      applicationsPerMonth: -1,
      recruiterPortal:      false,
      advancedAnalytics:    false,
      maxActiveJobs:        0,
      prioritySupport:      true,
    },

    highlights: [
      'Unlimited job applications',
      'Unlimited AI résumé analyses',
      'Unlimited AI job-match scoring',
      'Priority email support',
      'Advanced personal analytics',
    ],
    notIncluded: [
      'Recruiter portal',
      'Job posting & ATS',
    ],
  },

  recruiter: {
    id:          'recruiter',
    name:        'Recruiter',
    description: 'Post jobs and manage applicants at scale',
    price:       29.99,
    interval:    'month',
    stripePriceId: process.env.STRIPE_PRICE_RECRUITER ?? null,

    features: {
      aiAnalysesPerMonth:   -1,
      aiMatchesPerMonth:    -1,
      applicationsPerMonth: -1,
      recruiterPortal:      true,
      advancedAnalytics:    false,
      maxActiveJobs:        10,
      prioritySupport:      true,
    },

    highlights: [
      'Everything in Premium',
      'Full recruiter portal',
      'Up to 10 active job postings',
      'Applicant tracking (ATS)',
      'Interview scheduling',
      'Candidate AI score display',
    ],
    notIncluded: [
      'Unlimited job postings',
      'Advanced recruiter analytics',
    ],
  },

  premium_recruiter: {
    id:          'premium_recruiter',
    name:        'Premium Recruiter',
    description: 'Unlimited everything for high-volume hiring',
    price:       79.99,
    interval:    'month',
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_RECRUITER ?? null,

    features: {
      aiAnalysesPerMonth:   -1,
      aiMatchesPerMonth:    -1,
      applicationsPerMonth: -1,
      recruiterPortal:      true,
      advancedAnalytics:    true,
      maxActiveJobs:        -1,
      prioritySupport:      true,
    },

    highlights: [
      'Everything in Recruiter',
      'Unlimited job postings',
      'Advanced hiring analytics',
      'Pipeline funnel reporting',
      'Dedicated support',
    ],
    notIncluded: [],
  },
};

/** Returns the plan object (falls back to free if unknown planId). */
export function getPlan(planId) {
  return PLANS[planId] ?? PLANS.free;
}

/** Returns true if the plan includes a given feature key. */
export function planHasFeature(planId, featureKey) {
  const plan = getPlan(planId);
  const val  = plan.features[featureKey];
  return val !== false && val !== 0 && val !== null;
}

/** Returns the monthly limit for a feature (-1 = unlimited, 0 = blocked). */
export function planFeatureLimit(planId, featureKey) {
  return getPlan(planId).features[featureKey] ?? 0;
}
