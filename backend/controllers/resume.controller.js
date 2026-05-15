/**
 * resume.controller.js
 * ─────────────────────────────────────────────────────────────
 * HTTP handlers for resume upload metadata and AI analysis history.
 *
 * NOTE: The actual PDF file upload goes directly from the client to
 * Firebase Storage (the React app uses the Firebase Storage SDK).
 * This controller stores / retrieves metadata in MongoDB and records
 * AI analysis results returned by the Vercel /api/analyze-resume
 * function.
 */

import * as resumeService    from '../services/resume.service.js';
import * as analyticsService from '../services/analytics.service.js';

// ── GET /api/resume ───────────────────────────────────────────
export async function getResume(req, res) {
  const resume = await resumeService.getResume(req.user._id);
  res.json({ success: true, data: resume });
}

// ── POST /api/resume ──────────────────────────────────────────
// Called after the client has successfully uploaded the PDF to Firebase Storage.
// Body: { url, fileName, fileSize, storagePath?, mimeType? }
export async function upsertResume(req, res) {
  const { url, fileName, fileSize, storagePath, mimeType } = req.body;

  const resume = await resumeService.upsertResume(req.user._id, {
    url, fileName, fileSize, storagePath, mimeType,
  });

  analyticsService.track(analyticsService.EVENT_TYPES.RESUME_UPLOADED, {
    user:     req.user._id,
    metadata: { fileName, fileSize },
    ip:       req.ip,
  });

  res.status(200).json({ success: true, data: resume });
}

// ── DELETE /api/resume ────────────────────────────────────────
export async function deleteResume(req, res) {
  const doc = await resumeService.deleteResume(req.user._id);

  analyticsService.track(analyticsService.EVENT_TYPES.RESUME_DELETED, {
    user:     req.user._id,
    metadata: { fileName: doc.fileName },
    ip:       req.ip,
  });

  res.json({ success: true, message: 'Resume deleted' });
}

// ── POST /api/resume/analysis ─────────────────────────────────
// Called by the client after it receives an AI result from the Vercel
// function.  Persists the result to MongoDB history.
// Body: { type: 'analyze'|'match', ...analysisFields }
export async function saveAnalysis(req, res) {
  const resume = await resumeService.saveAnalysis(req.user._id, req.body);

  const eventType = req.body.type === 'match'
    ? analyticsService.EVENT_TYPES.AI_MATCH
    : analyticsService.EVENT_TYPES.AI_ANALYZE;

  analyticsService.track(eventType, {
    user:     req.user._id,
    metadata: {
      atsScore:   req.body.atsScore   ?? null,
      matchScore: req.body.matchScore ?? null,
    },
    ip: req.ip,
  });

  res.status(201).json({ success: true, data: resume });
}

// ── GET /api/resume/analysis ──────────────────────────────────
// Paginated analysis history.
// ?page=1&limit=10
export async function getAnalysisHistory(req, res) {
  const result = await resumeService.getAnalysisHistory(req.user._id, req.query);
  res.json({ success: true, ...result });
}
