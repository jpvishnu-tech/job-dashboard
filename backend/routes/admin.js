/**
 * Admin routes  (all require JWT + role=admin)
 * ─────────────────────────────────────────────────────────────
 * GET    /api/admin/stats
 * GET    /api/admin/users
 * PATCH  /api/admin/users/:id
 * DELETE /api/admin/users/:id
 * GET    /api/admin/jobs              — all jobs incl. inactive
 * PATCH  /api/admin/jobs/:id/toggle
 * GET    /api/admin/analytics
 * GET    /api/admin/analytics/jobs/:id
 */

import express           from 'express';
import { param, body }   from 'express-validator';
import asyncHandler      from '../utils/asyncHandler.js';
import { protect, adminOnly, validate } from '../middleware/auth.js';
import * as ctrl         from '../controllers/admin.controller.js';
import * as jobCtrl      from '../controllers/job.controller.js';

const router = express.Router();
router.use(protect, adminOnly);

// ── Stats ─────────────────────────────────────────────────────
router.get('/stats', asyncHandler(ctrl.getStats));

// ── Users ─────────────────────────────────────────────────────
router.get('/users', asyncHandler(ctrl.listUsers));

router.patch('/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role').isIn(['user', 'recruiter', 'admin']).withMessage('Role must be "user", "recruiter", or "admin"'),
  ],
  validate,
  asyncHandler(ctrl.updateUserRole),
);

router.delete('/users/:id',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  asyncHandler(ctrl.deleteUser),
);

// ── Jobs (admin view — all including inactive) ────────────────
router.get('/jobs', asyncHandler(jobCtrl.adminListJobs));

router.patch('/jobs/:id/toggle',
  [param('id').isMongoId().withMessage('Invalid job ID')],
  validate,
  asyncHandler(jobCtrl.toggleJob),
);

// ── Analytics ─────────────────────────────────────────────────
router.get('/analytics', asyncHandler(ctrl.getAnalyticsOverview));

router.get('/analytics/jobs/:id',
  [param('id').isMongoId().withMessage('Invalid job ID')],
  validate,
  asyncHandler(ctrl.getJobAnalytics),
);

// ── Email ─────────────────────────────────────────────────────
// POST /api/admin/email/test  — verify SMTP config + send a test email
router.post('/email/test',
  [body('to').optional().trim().isEmail().withMessage('Invalid recipient email')],
  validate,
  asyncHandler(ctrl.testEmail),
);

export default router;
