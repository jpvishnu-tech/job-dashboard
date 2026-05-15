/**
 * User routes  (all protected — require JWT)
 * ─────────────────────────────────────────────────────────────
 * GET    /api/users/profile
 * PUT    /api/users/profile
 * GET    /api/users/applications
 * GET    /api/users/applications/stats
 * POST   /api/users/applications
 * PUT    /api/users/applications/:id
 * DELETE /api/users/applications/:id
 * GET    /api/users/activity
 */

import express           from 'express';
import { body, param }   from 'express-validator';
import asyncHandler      from '../utils/asyncHandler.js';
import { protect, validate } from '../middleware/auth.js';
import * as ctrl         from '../controllers/user.controller.js';

const router = express.Router();
router.use(protect);

// ── Profile ───────────────────────────────────────────────────
router.get('/profile', asyncHandler(ctrl.getProfile));

router.put('/profile',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
                .isLength({ max: 80 }).withMessage('Name cannot exceed 80 characters'),
    body('avatar').optional().trim().isURL().withMessage('Avatar must be a valid URL'),
  ],
  validate,
  asyncHandler(ctrl.updateProfile)
);

// ── Applications ──────────────────────────────────────────────
router.get('/applications/stats', asyncHandler(ctrl.getApplicationStats));

router.get('/applications', asyncHandler(ctrl.listApplications));

router.post('/applications',
  [
    body('company').trim().notEmpty().withMessage('Company is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
    body('url').trim().isURL({ require_protocol: true }).withMessage('Valid URL required'),
    body('status').optional()
                  .isIn(['pending', 'interview', 'offer', 'rejected'])
                  .withMessage('Invalid status'),
    body('notes').optional().trim()
                 .isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters'),
    body('job').optional().isMongoId().withMessage('Invalid job ID'),
  ],
  validate,
  asyncHandler(ctrl.createApplication)
);

router.put('/applications/:id',
  [
    param('id').isMongoId().withMessage('Invalid application ID'),
    body('status').optional()
                  .isIn(['pending', 'interview', 'offer', 'rejected'])
                  .withMessage('Invalid status value'),
    body('notes').optional().trim()
                 .isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters'),
  ],
  validate,
  asyncHandler(ctrl.updateApplication)
);

router.delete('/applications/:id',
  [param('id').isMongoId().withMessage('Invalid application ID')],
  validate,
  asyncHandler(ctrl.deleteApplication)
);

// ── Personal analytics ─────────────────────────────────────────
router.get('/activity', asyncHandler(ctrl.getUserActivity));

export default router;
