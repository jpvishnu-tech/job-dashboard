/**
 * Resume routes  (all require JWT)
 * ─────────────────────────────────────────────────────────────
 * GET    /api/resume                — current user's resume metadata
 * POST   /api/resume                — sync metadata after Firebase Storage upload
 * DELETE /api/resume                — remove resume record
 * POST   /api/resume/analysis       — persist AI result received from Vercel fn
 * GET    /api/resume/analysis       — paginated analysis history
 * GET    /api/resume/ats-score      — quick read of last stored ATS score
 * GET    /api/resume/history        — alias for /analysis (paginated)
 * POST   /api/resume/analyze        — enhanced ATS + keyword analysis (AI)
 * POST   /api/resume/optimize       — job-specific optimization plan (AI)
 * POST   /api/resume/rewrite           — AI section rewriter (AI)
 * POST   /api/resume/tailor           — AI tailoring engine (generates tailored version)
 * GET    /api/resume/tailored-versions — list all tailored versions
 * GET    /api/resume/tailored-versions/:id — full tailored version detail
 * DELETE /api/resume/tailored-versions/:id — delete a tailored version
 */

import express           from 'express';
import { body }          from 'express-validator';
import asyncHandler      from '../utils/asyncHandler.js';
import { protect, validate } from '../middleware/auth.js';
import * as ctrl         from '../controllers/resume.controller.js';
import * as optCtrl      from '../controllers/resumeOptimizer.controller.js';
import * as tailorCtrl   from '../controllers/resumeTailor.controller.js';

const router = express.Router();
router.use(protect);

// ── Resume metadata ───────────────────────────────────────────
router.get('/',  asyncHandler(ctrl.getResume));

router.post('/',
  [
    body('url').trim().isURL({ require_protocol: true }).withMessage('Valid URL required'),
    body('fileName').trim().notEmpty().withMessage('File name is required'),
    body('fileSize').isInt({ min: 1 }).withMessage('File size must be a positive integer'),
    body('storagePath').optional().trim(),
    body('mimeType').optional().trim(),
  ],
  validate,
  asyncHandler(ctrl.upsertResume),
);

router.delete('/', asyncHandler(ctrl.deleteResume));

// ── AI analysis history ───────────────────────────────────────
// Note: named sub-routes MUST be defined before /:id to avoid clash
router.get('/analysis',  asyncHandler(ctrl.getAnalysisHistory));
router.get('/history',   asyncHandler(ctrl.getAnalysisHistory));  // alias

router.post('/analysis',
  [
    body('type').isIn(['analyze', 'match']).withMessage('Type must be "analyze" or "match"'),
    body('atsScore').optional().isFloat({ min: 0, max: 100 }).withMessage('ATS score must be 0–100'),
    body('matchScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Match score must be 0–100'),
    body('strengths').optional().isArray().withMessage('strengths must be an array'),
    body('weaknesses').optional().isArray().withMessage('weaknesses must be an array'),
    body('recommendations').optional().isArray().withMessage('recommendations must be an array'),
    body('matchingKeywords').optional().isArray(),
    body('missingKeywords').optional().isArray(),
    body('jobTitle').optional().trim(),
    body('jobCompany').optional().trim(),
  ],
  validate,
  asyncHandler(ctrl.saveAnalysis),
);

// ── AI Resume Optimizer ───────────────────────────────────────
router.get('/ats-score', asyncHandler(optCtrl.getAtsScore));

router.post('/analyze',
  [
    body('resumeText').optional().isString(),
  ],
  validate,
  asyncHandler(optCtrl.analyzeResume),
);

router.post('/optimize',
  [
    body('jobDescription').trim().notEmpty().withMessage('Job description is required'),
    body('resumeText').optional().isString(),
  ],
  validate,
  asyncHandler(optCtrl.optimizeResume),
);

router.post('/rewrite',
  [
    body('section').optional().trim(),
    body('content').trim().notEmpty().withMessage('Content to rewrite is required'),
    body('resumeText').optional().isString(),
  ],
  validate,
  asyncHandler(optCtrl.rewriteSection),
);

// ── AI Resume Tailoring Engine ────────────────────────────────
router.post('/tailor',
  [
    body('jobDescription').trim().isLength({ min: 50 }).withMessage('Job description must be at least 50 characters'),
    body('jobTitle').optional().trim(),
    body('jobCompany').optional().trim(),
    body('jobId').optional().isMongoId(),
  ],
  validate,
  asyncHandler(tailorCtrl.tailorResume),
);

router.get('/tailored-versions',             asyncHandler(tailorCtrl.getTailoredVersions));
router.get('/tailored-versions/:id',         asyncHandler(tailorCtrl.getTailoredVersion));
router.delete('/tailored-versions/:id',      asyncHandler(tailorCtrl.deleteTailoredVersion));

export default router;
