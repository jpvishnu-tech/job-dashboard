/**
 * workflow.controller.js
 * ─────────────────────────────────────────────────────────────────────────
 * HTTP handlers for the Smart Application Workflow System.
 */

import ApplicationWorkspace from '../models/ApplicationWorkspace.js';
import WorkflowHistory      from '../models/WorkflowHistory.js';
import Application          from '../models/Application.js';
import * as workflowEngine  from '../services/workflowEngine.js';
import * as prepService     from '../services/applicationPreparationService.js';
import * as recruiterSvc    from '../services/recruiterTrackingService.js';

// ── Workspace ─────────────────────────────────────────────────────────────

// POST /api/workflow/workspaces — create or return existing workspace for an application
export async function createWorkspace(req, res) {
  const { applicationId } = req.body;
  const userId = req.user._id;

  const application = await Application.findOne({ _id: applicationId, user: userId });
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

  const workspace = await prepService.ensureWorkspace(userId, applicationId);
  res.status(201).json({ success: true, data: workspace });
}

// GET /api/workflow/workspaces — list all workspaces (with populated application)
export async function listWorkspaces(req, res) {
  const { state, archived, page = 1, limit = 20 } = req.query;
  const filter = { user: req.user._id };

  if (state)    filter.workflowState = state;
  if (archived === 'true')  filter.archived = true;
  else if (archived !== 'all') filter.archived = false;

  const skip = (Number(page) - 1) * Number(limit);
  const [workspaces, total] = await Promise.all([
    ApplicationWorkspace.find(filter)
      .sort({ pinned: -1, aiQueueScore: -1, updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('application', 'company role status priority matchScore salary location type appliedAt')
      .populate('recruiterContact', 'name company email')
      .lean(),
    ApplicationWorkspace.countDocuments(filter),
  ]);

  res.json({ success: true, data: workspaces, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
}

// GET /api/workflow/workspaces/:id — full workspace detail
export async function getWorkspace(req, res) {
  const workspace = await ApplicationWorkspace.findOne({ _id: req.params.id, user: req.user._id })
    .populate('application')
    .populate('recruiterContact')
    .lean();

  if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
  res.json({ success: true, data: workspace });
}

// PATCH /api/workflow/workspaces/:id — update workspace metadata (notes, tags, pinned)
export async function updateWorkspace(req, res) {
  const allowed = ['workspaceNotes', 'tags', 'pinned', 'archived'];
  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  const workspace = await ApplicationWorkspace.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: updates },
    { new: true },
  );
  if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
  res.json({ success: true, data: workspace });
}

// ── Workflow State ────────────────────────────────────────────────────────

// PATCH /api/workflow/status/:id
export async function updateStatus(req, res) {
  const { state } = req.body;
  const workspace = await workflowEngine.updateWorkflowState(req.user._id, req.params.id, state);
  res.json({ success: true, data: workspace });
}

// ── AI Preparation ────────────────────────────────────────────────────────

// POST /api/workflow/prepare/:id — run full AI preparation for a workspace
export async function prepareApplication(req, res) {
  const result = await prepService.prepareApplication(
    req.user._id,
    req.params.id,
    { tone: req.body.tone, focusAreas: req.body.focusAreas },
  );
  res.json({ success: true, data: result });
}

// POST /api/workflow/cover-letter/:id — regenerate cover letter with new tone
export async function regenerateCoverLetter(req, res) {
  const clData = await prepService.regenerateCoverLetter(
    req.user._id,
    req.params.id,
    { tone: req.body.tone, focusAreas: req.body.focusAreas },
  );
  res.json({ success: true, data: clData });
}

// PATCH /api/workflow/checklist/:id/item/:itemId — toggle checklist item
export async function toggleChecklistItem(req, res) {
  const { done } = req.body;
  const workspace = await prepService.toggleChecklistItem(
    req.user._id,
    req.params.id,
    req.params.itemId,
    Boolean(done),
  );
  res.json({ success: true, data: workspace });
}

// ── Smart Queue ───────────────────────────────────────────────────────────

// GET /api/workflow/queue — AI-ranked apply queue
export async function getQueue(req, res) {
  const result = await workflowEngine.buildApplyQueue(req.user._id);
  res.json({ success: true, data: result });
}

// GET /api/workflow/next-actions/:id — AI next-action suggestions for a workspace
export async function getNextActions(req, res) {
  const result = await workflowEngine.getNextActions(req.user._id, req.params.id);
  res.json({ success: true, data: result });
}

// ── Workflow History ──────────────────────────────────────────────────────

// GET /api/workflow/history/:id — history for a workspace/application
export async function getHistory(req, res) {
  const { limit = 50 } = req.query;
  const history = await WorkflowHistory.find({
    user:      req.user._id,
    $or: [{ workspace: req.params.id }, { application: req.params.id }],
  })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  res.json({ success: true, data: history });
}

// GET /api/workflow/history — full user history (recent)
export async function getAllHistory(req, res) {
  const { limit = 100 } = req.query;
  const history = await WorkflowHistory.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();
  res.json({ success: true, data: history });
}

// ── Recruiter Contacts ────────────────────────────────────────────────────

// GET /api/workflow/contacts
export async function listContacts(req, res) {
  const result = await recruiterSvc.getContacts(req.user._id, req.query);
  res.json({ success: true, ...result });
}

// POST /api/workflow/contacts
export async function createContact(req, res) {
  const contact = await recruiterSvc.createContact(req.user._id, req.body);
  res.status(201).json({ success: true, data: contact });
}

// GET /api/workflow/contacts/:id
export async function getContact(req, res) {
  const contact = await recruiterSvc.getContactById(req.user._id, req.params.id);
  res.json({ success: true, data: contact });
}

// PATCH /api/workflow/contacts/:id
export async function updateContact(req, res) {
  const contact = await recruiterSvc.updateContact(req.user._id, req.params.id, req.body);
  res.json({ success: true, data: contact });
}

// DELETE /api/workflow/contacts/:id
export async function deleteContact(req, res) {
  await recruiterSvc.deleteContact(req.user._id, req.params.id);
  res.json({ success: true, message: 'Contact deleted' });
}

// POST /api/workflow/contacts/:id/comm — add communication log entry
export async function addCommLog(req, res) {
  const contact = await recruiterSvc.addCommunicationLog(req.user._id, req.params.id, req.body);
  res.status(201).json({ success: true, data: contact });
}

// DELETE /api/workflow/contacts/:id/comm/:logId
export async function deleteCommLog(req, res) {
  const contact = await recruiterSvc.deleteCommunicationLog(req.user._id, req.params.id, req.params.logId);
  res.json({ success: true, data: contact });
}

// POST /api/workflow/contacts/:id/followup
export async function addFollowUp(req, res) {
  const contact = await recruiterSvc.addFollowUp(req.user._id, req.params.id, req.body);
  res.status(201).json({ success: true, data: contact });
}

// PATCH /api/workflow/contacts/:id/followup/:fuId/complete
export async function completeFollowUp(req, res) {
  const contact = await recruiterSvc.completeFollowUp(req.user._id, req.params.id, req.params.fuId);
  res.json({ success: true, data: contact });
}

// GET /api/workflow/contacts/followups/upcoming
export async function upcomingFollowUps(req, res) {
  const followUps = await recruiterSvc.getUpcomingFollowUps(req.user._id);
  res.json({ success: true, data: followUps });
}

// POST /api/workflow/contacts/:id/link — link an application to a contact
export async function linkApplication(req, res) {
  const contact = await recruiterSvc.linkApplication(req.user._id, req.params.id, req.body.applicationId);
  res.json({ success: true, data: contact });
}
