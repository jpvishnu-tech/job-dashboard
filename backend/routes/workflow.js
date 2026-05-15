/**
 * Workflow routes
 * ─────────────────────────────────────────────────────────────────────────
 * All routes require authentication (protectAny).
 *
 * Workspaces
 *   POST   /api/workflow/workspaces          — create workspace for an application
 *   GET    /api/workflow/workspaces          — list user workspaces
 *   GET    /api/workflow/workspaces/:id      — get workspace detail
 *   PATCH  /api/workflow/workspaces/:id      — update notes / tags / pinned
 *
 * Workflow State
 *   PATCH  /api/workflow/status/:id          — change workflow state
 *
 * AI Preparation
 *   POST   /api/workflow/prepare/:id         — run full AI preparation
 *   POST   /api/workflow/cover-letter/:id    — regenerate cover letter
 *   PATCH  /api/workflow/checklist/:id/item/:itemId — toggle checklist item
 *
 * Smart Queue
 *   GET    /api/workflow/queue               — AI-ranked apply queue
 *   GET    /api/workflow/next-actions/:id    — next-action suggestions
 *
 * History
 *   GET    /api/workflow/history             — full user workflow history
 *   GET    /api/workflow/history/:id         — history for workspace or application
 *
 * Recruiter Contacts
 *   GET    /api/workflow/contacts                              — list contacts
 *   POST   /api/workflow/contacts                              — create contact
 *   GET    /api/workflow/contacts/followups/upcoming           — upcoming follow-ups
 *   GET    /api/workflow/contacts/:id                          — get contact
 *   PATCH  /api/workflow/contacts/:id                          — update contact
 *   DELETE /api/workflow/contacts/:id                          — delete contact
 *   POST   /api/workflow/contacts/:id/comm                     — add comm log
 *   DELETE /api/workflow/contacts/:id/comm/:logId              — delete comm log
 *   POST   /api/workflow/contacts/:id/followup                 — add follow-up
 *   PATCH  /api/workflow/contacts/:id/followup/:fuId/complete  — complete follow-up
 *   POST   /api/workflow/contacts/:id/link                     — link application
 */

import express       from 'express';
import rateLimit     from 'express-rate-limit';
import { body, param, query } from 'express-validator';
import asyncHandler  from '../utils/asyncHandler.js';
import { protectAny, validate } from '../middleware/auth.js';
import * as ctrl     from '../controllers/workflow.controller.js';
import { WORKFLOW_STATES } from '../models/ApplicationWorkspace.js';

const router = express.Router();

// AI endpoints: 20 req / hour per user
const aiLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      20,
  keyGenerator: req => String(req.user?._id ?? req.ip),
  message:  { success: false, message: 'AI rate limit reached. Try again in an hour.' },
});

router.use(protectAny);

const vId = [param('id').isMongoId().withMessage('Invalid ID')];

// ── Named routes BEFORE /:id ──────────────────────────────────────────────

// Smart Queue
router.get('/queue',              aiLimit, asyncHandler(ctrl.getQueue));

// Global history
router.get('/history',            asyncHandler(ctrl.getAllHistory));

// Upcoming follow-ups (must come before /contacts/:id)
router.get('/contacts/followups/upcoming', asyncHandler(ctrl.upcomingFollowUps));

// ── Workspaces ────────────────────────────────────────────────────────────

router.post('/workspaces',
  [body('applicationId').isMongoId().withMessage('Valid applicationId required')],
  validate,
  asyncHandler(ctrl.createWorkspace),
);

router.get('/workspaces',
  [
    query('state').optional().isIn(WORKFLOW_STATES),
    query('archived').optional().isIn(['true', 'false', 'all']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  asyncHandler(ctrl.listWorkspaces),
);

router.get('/workspaces/:id', vId, validate, asyncHandler(ctrl.getWorkspace));

router.patch('/workspaces/:id', vId, validate, asyncHandler(ctrl.updateWorkspace));

// ── Workflow State ────────────────────────────────────────────────────────

router.patch('/status/:id',
  [...vId, body('state').isIn(WORKFLOW_STATES).withMessage('Invalid workflow state')],
  validate,
  asyncHandler(ctrl.updateStatus),
);

// ── AI Preparation (rate-limited) ─────────────────────────────────────────

router.post('/prepare/:id',
  aiLimit, vId,
  [body('tone').optional().isIn(['professional', 'enthusiastic', 'technical', 'concise'])],
  validate,
  asyncHandler(ctrl.prepareApplication),
);

router.post('/cover-letter/:id',
  aiLimit, vId,
  [body('tone').optional().isIn(['professional', 'enthusiastic', 'technical', 'concise'])],
  validate,
  asyncHandler(ctrl.regenerateCoverLetter),
);

router.patch('/checklist/:id/item/:itemId',
  [...vId, param('itemId').isMongoId(), body('done').isBoolean()],
  validate,
  asyncHandler(ctrl.toggleChecklistItem),
);

// ── AI Next Actions (rate-limited) ────────────────────────────────────────

router.get('/next-actions/:id', aiLimit, vId, validate, asyncHandler(ctrl.getNextActions));

// ── Workflow History ──────────────────────────────────────────────────────

router.get('/history/:id', vId, validate, asyncHandler(ctrl.getHistory));

// ── Recruiter Contacts ────────────────────────────────────────────────────

router.get('/contacts',   asyncHandler(ctrl.listContacts));

router.post('/contacts',
  [body('name').trim().notEmpty().withMessage('Contact name is required')],
  validate,
  asyncHandler(ctrl.createContact),
);

const vContactId = [param('id').isMongoId().withMessage('Invalid contact ID')];

router.get   ('/contacts/:id',         vContactId, validate, asyncHandler(ctrl.getContact));
router.patch ('/contacts/:id',         vContactId, validate, asyncHandler(ctrl.updateContact));
router.delete('/contacts/:id',         vContactId, validate, asyncHandler(ctrl.deleteContact));

router.post('/contacts/:id/comm',      vContactId, validate, asyncHandler(ctrl.addCommLog));
router.delete('/contacts/:id/comm/:logId',
  [...vContactId, param('logId').isMongoId()], validate, asyncHandler(ctrl.deleteCommLog));

router.post('/contacts/:id/followup',
  [...vContactId, body('dueDate').isISO8601().withMessage('Valid dueDate required')],
  validate,
  asyncHandler(ctrl.addFollowUp),
);

router.patch('/contacts/:id/followup/:fuId/complete',
  [...vContactId, param('fuId').isMongoId()], validate, asyncHandler(ctrl.completeFollowUp),
);

router.post('/contacts/:id/link',
  [...vContactId, body('applicationId').isMongoId()], validate, asyncHandler(ctrl.linkApplication),
);

export default router;
