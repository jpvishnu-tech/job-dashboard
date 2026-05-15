/**
 * Analytics routes
 * ─────────────────────────────────────────────────────────────
 * POST /api/analytics/track          — client-side event ingestion (public)
 * GET  /api/analytics/me             — current user's activity funnel (auth)
 * GET  /api/analytics/admin          — platform overview (admin only)
 * GET  /api/analytics/jobs/:id       — per-job stats (admin only)
 */

import express           from 'express';
import { body, param }   from 'express-validator';
import asyncHandler      from '../utils/asyncHandler.js';
import { protect, adminOnly, validate } from '../middleware/auth.js';
import * as ctrl         from '../controllers/analytics.controller.js';

const router = express.Router();

// ── Client-side event ingestion ───────────────────────────────
// Accepts anonymous requests; event type is validated server-side.
router.post('/track',
  [
    body('event').trim().notEmpty().withMessage('Event type is required'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  ],
  validate,
  asyncHandler(ctrl.trackEvent),
);

// ── Authenticated user funnel ─────────────────────────────────
router.get('/me', protect, asyncHandler(ctrl.getMyActivity));

// ── Admin overview ────────────────────────────────────────────
router.get('/admin', protect, adminOnly, asyncHandler(ctrl.getAdminOverview));

// ── Per-job analytics (admin) ─────────────────────────────────
router.get('/jobs/:id',
  protect, adminOnly,
  [param('id').isMongoId().withMessage('Invalid job ID')],
  validate,
  asyncHandler(ctrl.getJobStats),
);

export default router;
