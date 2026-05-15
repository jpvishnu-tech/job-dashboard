import express   from 'express';
import rateLimit from 'express-rate-limit';
import { param, body } from 'express-validator';
import asyncHandler    from '../utils/asyncHandler.js';
import { protectAny, validate } from '../middleware/auth.js';
import * as ctrl       from '../controllers/application.controller.js';
import * as autoApplyCtrl from '../controllers/autoApply.controller.js';

const router = express.Router();

const aiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      20,
  message:  { success: false, message: 'AI rate limit reached. Try again later.' },
});

const VALID_STAGES = [
  'saved', 'applied', 'under_review', 'interview_scheduled',
  'interview_completed', 'offer_received', 'hired', 'rejected',
  'pending', 'shortlisted', 'interview', 'offer',
];

const vId     = [param('id').isMongoId().withMessage('Invalid application ID')];
const vStatus = [body('status').isIn(VALID_STAGES).withMessage('Invalid status value')];

router.use(protectAny);

// ── Smart Auto-Apply routes (named BEFORE /:id) ───────────────
router.get ('/queue',                    asyncHandler(autoApplyCtrl.getApplyQueue));
router.post('/prepare',
  [body('jobId').notEmpty().withMessage('jobId is required'),
   body('tone').optional().isIn(['professional','enthusiastic','technical','concise'])],
  validate,
  asyncHandler(autoApplyCtrl.prepareApplication),
);
router.post('/generate-cover-letter',
  [body('jobId').notEmpty().withMessage('jobId is required'),
   body('tone').optional().isIn(['professional','enthusiastic','technical','concise'])],
  validate,
  asyncHandler(autoApplyCtrl.generateCoverLetter),
);
router.get   ('/drafts',         asyncHandler(autoApplyCtrl.getDrafts));
router.patch ('/drafts/:id',     asyncHandler(autoApplyCtrl.updateDraft));
router.post  ('/drafts/:id/submit', asyncHandler(autoApplyCtrl.submitDraft));
router.delete('/drafts/:id',     asyncHandler(autoApplyCtrl.deleteDraft));

// Named sub-routes MUST precede /:id to avoid Express treating the name as an ObjectId
router.get('/analytics', asyncHandler(ctrl.getAnalytics));
router.get('/history',   asyncHandler(ctrl.getApplicationHistory));

// CRUD
router.get   ('/',     asyncHandler(ctrl.listApplications));
router.post  ('/',     asyncHandler(ctrl.createApplication));
router.get   ('/:id',  vId, validate, asyncHandler(ctrl.getApplication));
router.patch ('/:id',  vId, validate, asyncHandler(ctrl.updateApplication));
router.delete('/:id',  vId, validate, asyncHandler(ctrl.deleteApplication));

// Status transition
router.patch('/:id/status', vId, vStatus, validate, asyncHandler(ctrl.updateStatus));

// Note
router.patch('/:id/note', vId, validate, asyncHandler(ctrl.addNote));

// Timeline
router.get('/:id/timeline', vId, validate, asyncHandler(ctrl.getTimeline));

// Interviews
router.post ('/:id/interviews',       vId, validate, asyncHandler(ctrl.addInterview));
router.patch('/:id/interviews/:iid',  vId, validate, asyncHandler(ctrl.updateInterview));

// AI Insights (rate-limited)
router.post('/:id/insights', aiLimit, vId, validate, asyncHandler(ctrl.generateInsights));

export default router;
