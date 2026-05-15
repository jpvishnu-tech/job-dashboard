/**
 * AI routes  (require valid auth — JWT or Firebase ID token)
 * ─────────────────────────────────────────────────────────────────
 * POST  /api/ai/analyze   — ATS analysis of the user's uploaded resume
 * POST  /api/ai/match     — Job-description match score + tailoring tips
 *
 * Hard rate limit: 10 requests per IP per hour to protect OpenAI spend.
 */

import express    from 'express';
import rateLimit  from 'express-rate-limit';
import { body }   from 'express-validator';
import asyncHandler from '../utils/asyncHandler.js';
import { protectAny, validate } from '../middleware/auth.js';
import { requirePlan } from '../middleware/requirePlan.js';
import * as ctrl  from '../controllers/ai.controller.js';

const router = express.Router();

const aiLimit = rateLimit({
  windowMs:       60 * 60 * 1000,   // 1 hour
  max:            10,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { success: false, message: 'AI rate limit reached: 10 requests per hour. Please try again later.' },
});

router.post('/analyze',
  aiLimit,
  protectAny,
  requirePlan('aiAnalysis'),
  asyncHandler(ctrl.analyzeResume),
);

router.post('/match',
  aiLimit,
  protectAny,
  [body('jobDescription').trim().isLength({ min: 50 }).withMessage('Job description must be at least 50 characters')],
  validate,
  requirePlan('aiMatch'),
  asyncHandler(ctrl.matchJob),
);

// ── Job Matching Engine ───────────────────────────────────────────────────

router.post('/analyze-resume',
  aiLimit,
  protectAny,
  asyncHandler(ctrl.analyzeResumeProfile),
);

router.get('/job-matches',
  aiLimit,
  protectAny,
  asyncHandler(ctrl.getJobMatches),
);

router.get('/recommended-jobs',
  protectAny,
  asyncHandler(ctrl.getRecommendedJobs),
);

// ── AI Smart Shortlist Engine ─────────────────────────────────────────────

// Cached shortlist read (no AI calls)
router.get('/shortlisted-jobs',
  protectAny,
  asyncHandler(ctrl.getShortlistedJobs),
);

// Full pipeline — profile + matching + scoring + reasons (cached 24h)
// Accepts ?refresh=true to force recomputation
router.get('/recommendations',
  aiLimit,
  protectAny,
  asyncHandler(ctrl.getRecommendations),
);

// Top apply_now + strong_fit jobs for Dashboard widget
router.get('/priority-jobs',
  protectAny,
  asyncHandler(ctrl.getPriorityJobs),
);

// Recommendation analytics
router.get('/recommendation-analytics',
  protectAny,
  asyncHandler(ctrl.getRecommendationAnalytics),
);

export default router;
