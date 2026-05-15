/**
 * requirePlan middleware
 * ─────────────────────────────────────────────────────────────
 * Usage:
 *   router.post('/analyze', protectAny, requirePlan('aiAnalysis'), ctrl.analyze)
 *   router.post('/match',   protectAny, requirePlan('aiMatch'),    ctrl.match)
 *
 * Feature keys:
 *   aiAnalysis      — monthly AI résumé analysis cap
 *   aiMatch         — monthly AI job-match cap
 *   recruiterPortal — access to recruiter features
 *   advancedAnalytics — recruiter advanced analytics
 *   unlimitedApplications — no monthly application cap
 *
 * On rejection the response includes:
 *   { success: false, code: 'UPGRADE_REQUIRED', feature, currentPlan, upgradeUrl }
 */

import asyncHandler        from '../utils/asyncHandler.js';
import Resume              from '../models/Resume.js';
import Application         from '../models/Application.js';
import { getSubscription } from '../services/payment.service.js';
import { getPlan }         from '../config/plans.js';

const FRONTEND_URL = () => process.env.FRONTEND_URL || 'http://localhost:5173';

function upgradeRequired(res, feature, currentPlan, message) {
  return res.status(402).json({
    success:     false,
    code:        'UPGRADE_REQUIRED',
    feature,
    currentPlan,
    message,
    upgradeUrl:  `${FRONTEND_URL()}/pricing`,
  });
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function requirePlan(...features) {
  return asyncHandler(async (req, res, next) => {
    const sub  = await getSubscription(req.user._id);
    const plan = getPlan(sub?.plan ?? 'free');
    const isActiveOrTrial = ['active', 'trialing'].includes(sub?.status ?? 'active');

    // Treat inactive paid subscriptions as free
    const effectivePlan = (sub?.plan !== 'free' && !isActiveOrTrial) ? 'free' : (sub?.plan ?? 'free');
    const effectivePlanObj = getPlan(effectivePlan);

    for (const feature of features) {

      // ── AI analyse monthly cap ──────────────────────────────
      if (feature === 'aiAnalysis') {
        const limit = effectivePlanObj.features.aiAnalysesPerMonth;
        if (limit !== -1) {
          const resume = await Resume.findOne({ user: req.user._id });
          const since  = startOfMonth();
          const used   = resume?.analyses?.filter(
            a => a.type === 'analyze' && new Date(a.createdAt ?? a._id.getTimestamp()) >= since
          ).length ?? 0;

          if (used >= limit) {
            return upgradeRequired(res, 'aiAnalysis', effectivePlan,
              `Monthly AI analysis limit (${limit}) reached. Upgrade to Premium for unlimited analyses.`
            );
          }
        }
      }

      // ── AI match monthly cap ────────────────────────────────
      if (feature === 'aiMatch') {
        const limit = effectivePlanObj.features.aiMatchesPerMonth;
        if (limit !== -1) {
          const resume = await Resume.findOne({ user: req.user._id });
          const since  = startOfMonth();
          const used   = resume?.analyses?.filter(
            a => a.type === 'match' && new Date(a.createdAt ?? a._id.getTimestamp()) >= since
          ).length ?? 0;

          if (used >= limit) {
            return upgradeRequired(res, 'aiMatch', effectivePlan,
              `Monthly AI job-match limit (${limit}) reached. Upgrade to Premium for unlimited matches.`
            );
          }
        }
      }

      // ── Monthly application cap ─────────────────────────────
      if (feature === 'unlimitedApplications') {
        const limit = effectivePlanObj.features.applicationsPerMonth;
        if (limit !== -1) {
          const since = startOfMonth();
          const used  = await Application.countDocuments({
            user:      req.user._id,
            createdAt: { $gte: since },
          });

          if (used >= limit) {
            return upgradeRequired(res, 'unlimitedApplications', effectivePlan,
              `Monthly application limit (${limit}) reached. Upgrade for unlimited applications.`
            );
          }
        }
      }

      // ── Recruiter portal access ─────────────────────────────
      if (feature === 'recruiterPortal') {
        if (!effectivePlanObj.features.recruiterPortal) {
          return upgradeRequired(res, 'recruiterPortal', effectivePlan,
            'Recruiter Portal requires a Recruiter plan or higher.'
          );
        }
      }

      // ── Advanced analytics ──────────────────────────────────
      if (feature === 'advancedAnalytics') {
        if (!effectivePlanObj.features.advancedAnalytics) {
          return upgradeRequired(res, 'advancedAnalytics', effectivePlan,
            'Advanced analytics requires the Premium Recruiter plan.'
          );
        }
      }
    }

    // Attach subscription to request for downstream use
    req.subscription = { plan: effectivePlan, features: effectivePlanObj.features };
    next();
  });
}
