/**
 * Job routes
 * ─────────────────────────────────────────────────────────────────────────
 * GET    /api/jobs                  — public filtered + paginated listing
 * GET    /api/jobs/recommended      — personalised or featured jobs
 * GET    /api/jobs/:id              — public single job
 * POST   /api/jobs/import           — admin: provider sync or bulk import
 * POST   /api/jobs                  — admin: create single job
 * PUT    /api/jobs/:id              — admin: update job
 * PATCH  /api/jobs/:id/toggle       — admin: soft-delete / restore
 * DELETE /api/jobs/:id              — admin: soft-delete
 *
 * GET    /api/jobs/source/:platform  — jobs from a specific provider
 * POST   /api/jobs/sync              — admin: trigger manual provider sync
 * GET    /api/jobs/providers         — admin: list provider enabled status
 *
 * NOTE: All named sub-paths MUST be declared BEFORE /:id to prevent Express
 * matching them as ObjectId params.
 */

import express                  from 'express';
import { body, param, query }   from 'express-validator';
import asyncHandler             from '../utils/asyncHandler.js';
import { optionalAuth, protect, protectAny, adminOnly, validate } from '../middleware/auth.js';
import * as ctrl                from '../controllers/job.controller.js';

const router = express.Router();

// ── Shared validation: create / update ───────────────────────────────────

const vJob = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('type').isIn(['full-time', 'part-time', 'contract', 'internship'])
              .withMessage('Invalid job type'),
  body('url').trim().isURL({ require_protocol: true }).withMessage('Valid URL required'),
  body('companyLogo').optional().trim(),
  body('salary').optional().trim(),
  body('salaryMin').optional().isInt({ min: 0 }),
  body('salaryMax').optional().isInt({ min: 0 }),
  body('department').optional().trim(),
  body('description').optional().trim(),
  body('requirements').optional().isArray(),
  body('skills').optional().isArray(),
  body('tags').optional().isArray(),
  body('remote').optional().isBoolean(),
  body('experienceLevel')
    .optional()
    .isIn(['entry', 'mid', 'senior', 'lead', 'any']),
  body('isActive').optional().isBoolean(),
];

const vListJobs = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('minSalary').optional().isInt({ min: 0 }).toInt(),
  query('maxSalary').optional().isInt({ min: 0 }).toInt(),
  query('remote').optional().isIn(['true', 'false']),
  query('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'lead', 'any']),
  query('sort').optional().isIn(['newest', 'oldest', 'salary_asc', 'salary_desc', 'title']),
];

const vId  = [param('id').isMongoId().withMessage('Invalid job ID')];

// ── Named sub-routes (BEFORE /:id) ────────────────────────────────────────

// GET /api/jobs/recommended — optional auth for personalised results
router.get('/recommended',
  optionalAuth,
  asyncHandler(ctrl.recommendedJobs),
);

// POST /api/jobs/import — admin only (legacy bulk import / provider sync)
router.post('/import',
  protect, adminOnly,
  asyncHandler(ctrl.importJobs),
);

// POST /api/jobs/sync — admin: trigger manual sync (one or all providers)
// Body: { provider?: string } — omit to sync all enabled providers
router.post('/sync',
  protect, adminOnly,
  asyncHandler(ctrl.syncJobs),
);

// GET /api/jobs/providers — admin: check provider configuration status
router.get('/providers',
  protect, adminOnly,
  asyncHandler(ctrl.listProviders),
);

// GET /api/jobs/source/:platform — public: jobs from a specific source
router.get('/source/:platform',
  vListJobs, validate,
  asyncHandler(ctrl.getBySource),
);

// ── Public ────────────────────────────────────────────────────────────────

router.get('/',    vListJobs, validate, asyncHandler(ctrl.listJobs));
router.get('/:id', vId,       validate, asyncHandler(ctrl.getJob));

// ── Authenticated user action ─────────────────────────────────────────────

// POST /api/jobs/:id/apply-click
// Tracks an external apply-button click: logs the event, increments
// job.clickCount, and upserts an Application (status: applied).
// NOTE: named after /:id so Express won't try to parse 'apply-click' as
// an ObjectId. The sub-path makes the method unique even against /:id.
router.post('/:id/apply-click',
  protectAny, vId, validate,
  asyncHandler(ctrl.trackApplyClick),
);

// ── Admin ─────────────────────────────────────────────────────────────────

router.post('/',
  protect, adminOnly, vJob, validate, asyncHandler(ctrl.createJob));

router.put('/:id',
  protect, adminOnly,
  [...vId, ...vJob.map(r => r.optional())], validate,
  asyncHandler(ctrl.updateJob));

router.patch('/:id/toggle',
  protect, adminOnly, vId, validate, asyncHandler(ctrl.toggleJob));

router.delete('/:id',
  protect, adminOnly, vId, validate, asyncHandler(ctrl.deleteJob));

export default router;
