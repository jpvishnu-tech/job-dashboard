import * as svc              from '../services/application.service.js';
import * as aiSvc            from '../services/applicationAI.service.js';
import * as applyTrackingSvc from '../services/applyTracking.service.js';

export async function listApplications(req, res) {
  const { status, priority, sort, page, limit } = req.query;
  const result = await svc.getApplications(req.user._id, {
    status, priority, sort,
    page:  Number(page)  || 1,
    limit: Number(limit) || 100,
  });
  res.json({ success: true, ...result });
}

export async function createApplication(req, res) {
  const app = await svc.createApplication(req.user._id, req.body);
  res.status(201).json({ success: true, data: app });
}

export async function getApplication(req, res) {
  const app = await svc.getApplicationById(req.user._id, req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
  res.json({ success: true, data: app });
}

export async function updateApplication(req, res) {
  const app = await svc.updateApplication(req.user._id, req.params.id, req.body);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
  res.json({ success: true, data: app });
}

export async function updateStatus(req, res) {
  const { status, note } = req.body;
  if (!status) return res.status(422).json({ success: false, message: 'status is required' });
  const app = await svc.updateStatus(req.user._id, req.params.id, status, note || '');
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
  res.json({ success: true, data: app });
}

export async function addNote(req, res) {
  const { note } = req.body;
  const app = await svc.addNote(req.user._id, req.params.id, note ?? '');
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
  res.json({ success: true, data: app });
}

export async function deleteApplication(req, res) {
  const app = await svc.deleteApplication(req.user._id, req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
  res.json({ success: true, message: 'Deleted' });
}

export async function getTimeline(req, res) {
  const timeline = await svc.getApplicationTimeline(req.user._id, req.params.id);
  res.json({ success: true, data: timeline });
}

export async function addInterview(req, res) {
  if (!req.body.scheduledAt) {
    return res.status(422).json({ success: false, message: 'scheduledAt is required' });
  }
  const app = await svc.addInterview(req.user._id, req.params.id, req.body);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
  res.json({ success: true, data: app });
}

export async function updateInterview(req, res) {
  const app = await svc.updateInterview(req.user._id, req.params.id, req.params.iid, req.body);
  if (!app) return res.status(404).json({ success: false, message: 'Application or interview not found' });
  res.json({ success: true, data: app });
}

export async function getAnalytics(req, res) {
  const data = await svc.getAnalytics(req.user._id);
  res.json({ success: true, data });
}

export async function generateInsights(req, res) {
  const data = await aiSvc.generateInsights(req.user._id, req.params.id);
  res.json({ success: true, data });
}

// ── GET /api/applications/history ────────────────────────────────────────────
// Returns paginated apply-click history + per-platform stats for the user.

export async function getApplicationHistory(req, res) {
  const result = await applyTrackingSvc.getApplyHistory(req.user._id, {
    page:  Number(req.query.page)  || 1,
    limit: Number(req.query.limit) || 20,
  });
  res.json({ success: true, ...result });
}
