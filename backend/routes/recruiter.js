/**
 * Recruiter Portal routes  (require JWT or Firebase token + recruiter/admin role)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Company
 *   GET    /api/recruiter/company
 *   POST   /api/recruiter/company
 *   PATCH  /api/recruiter/company
 *
 * Jobs
 *   GET    /api/recruiter/jobs
 *   POST   /api/recruiter/jobs
 *   GET    /api/recruiter/jobs/:id
 *   PATCH  /api/recruiter/jobs/:id
 *   PATCH  /api/recruiter/jobs/:id/status
 *   DELETE /api/recruiter/jobs/:id
 *
 * Applicants
 *   GET    /api/recruiter/jobs/:jobId/applicants
 *   GET    /api/recruiter/applicants/:appId
 *   PATCH  /api/recruiter/applicants/:appId/status
 *
 * Interviews
 *   GET    /api/recruiter/interviews
 *   POST   /api/recruiter/interviews
 *   GET    /api/recruiter/interviews/:id
 *   PATCH  /api/recruiter/interviews/:id
 *   DELETE /api/recruiter/interviews/:id
 *
 * Analytics
 *   GET    /api/recruiter/analytics
 */

import express        from 'express';
import { body, param } from 'express-validator';
import asyncHandler   from '../utils/asyncHandler.js';
import { protectAny, recruiterOnly, validate } from '../middleware/auth.js';
import * as ctrl      from '../controllers/recruiter.controller.js';

const router = express.Router();
router.use(protectAny, recruiterOnly);

// ── Validation chains ─────────────────────────────────────────────────────

const vJob = [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('company').trim().notEmpty().withMessage('Company name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('url').trim().isURL({ require_protocol: true }).withMessage('Valid application URL required'),
  body('type')
    .isIn(['full-time', 'part-time', 'contract', 'internship'])
    .withMessage('Invalid job type'),
];

const vStatus = [
  param('appId').isMongoId().withMessage('Invalid application ID'),
  body('status')
    .isIn(['pending', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'])
    .withMessage('Invalid status'),
];

const vInterview = [
  body('applicationId').isMongoId().withMessage('Invalid application ID'),
  body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid ISO date'),
  body('type')
    .optional()
    .isIn(['phone', 'video', 'onsite', 'technical', 'panel'])
    .withMessage('Invalid interview type'),
  body('durationMinutes').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be 15–480 minutes'),
];

// ── Company ───────────────────────────────────────────────────────────────

router.get('/company', asyncHandler(ctrl.getCompany));

router.post('/company',
  [body('name').trim().notEmpty().withMessage('Company name is required')],
  validate,
  asyncHandler(ctrl.createCompany),
);

router.patch('/company', asyncHandler(ctrl.updateCompany));

// ── Jobs ──────────────────────────────────────────────────────────────────

router.get('/jobs', asyncHandler(ctrl.listJobs));

router.post('/jobs', vJob, validate, asyncHandler(ctrl.createJob));

router.get('/jobs/:id',
  [param('id').isMongoId().withMessage('Invalid job ID')],
  validate,
  asyncHandler(ctrl.getJob),
);

router.patch('/jobs/:id',
  [param('id').isMongoId().withMessage('Invalid job ID')],
  validate,
  asyncHandler(ctrl.updateJob),
);

router.patch('/jobs/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid job ID'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  validate,
  asyncHandler(ctrl.setJobStatus),
);

router.delete('/jobs/:id',
  [param('id').isMongoId().withMessage('Invalid job ID')],
  validate,
  asyncHandler(ctrl.deleteJob),
);

// ── Applicants ────────────────────────────────────────────────────────────

router.get('/jobs/:jobId/applicants',
  [param('jobId').isMongoId().withMessage('Invalid job ID')],
  validate,
  asyncHandler(ctrl.listApplicants),
);

router.get('/applicants/:appId',
  [param('appId').isMongoId().withMessage('Invalid application ID')],
  validate,
  asyncHandler(ctrl.getApplicantDetail),
);

router.patch('/applicants/:appId/status', vStatus, validate, asyncHandler(ctrl.updateApplicantStatus));

// ── Interviews ────────────────────────────────────────────────────────────

router.get('/interviews', asyncHandler(ctrl.listInterviews));

router.post('/interviews', vInterview, validate, asyncHandler(ctrl.scheduleInterview));

router.get('/interviews/:id',
  [param('id').isMongoId().withMessage('Invalid interview ID')],
  validate,
  asyncHandler(ctrl.getInterview),
);

router.patch('/interviews/:id',
  [param('id').isMongoId().withMessage('Invalid interview ID')],
  validate,
  asyncHandler(ctrl.updateInterview),
);

router.delete('/interviews/:id',
  [param('id').isMongoId().withMessage('Invalid interview ID')],
  validate,
  asyncHandler(ctrl.cancelInterview),
);

// ── Analytics ─────────────────────────────────────────────────────────────

router.get('/analytics', asyncHandler(ctrl.getAnalytics));

export default router;
