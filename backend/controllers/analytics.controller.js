/**
 * analytics.controller.js
 * ─────────────────────────────────────────────────────────────
 * HTTP handlers for the analytics API.
 *
 * POST /api/analytics/track   — client-side event ingestion
 * GET  /api/analytics/me      — current user's activity funnel
 * GET  /api/analytics/admin   — admin overview (admin only)
 * GET  /api/analytics/jobs/:id — per-job view/apply stats (admin)
 */

import Analytics, { EVENT_TYPES } from '../models/Analytics.js';
import * as analyticsService       from '../services/analytics.service.js';
import ApiError                    from '../utils/ApiError.js';

// Allowlist of events the client is permitted to track directly.
// Server-side events (register, status_changed, etc.) are tracked
// in their respective controllers — not via this endpoint.
const CLIENT_EVENTS = new Set([
  EVENT_TYPES.JOB_VIEW,
  EVENT_TYPES.JOB_SEARCH,
]);

// ── POST /api/analytics/track ─────────────────────────────────
export async function trackEvent(req, res) {
  const { event, metadata = {} } = req.body;

  if (!CLIENT_EVENTS.has(event)) {
    throw ApiError.badRequest(`Event "${event}" cannot be tracked from the client`);
  }

  await analyticsService.track(event, {
    user:      req.user?._id ?? null,
    metadata,
    ip:        req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(202).json({ success: true });
}

// ── GET /api/analytics/me ─────────────────────────────────────
export async function getMyActivity(req, res) {
  const days   = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  const funnel = await analyticsService.getUserFunnel(req.user._id, days);
  res.json({ success: true, data: { funnel, days } });
}

// ── GET /api/analytics/admin ──────────────────────────────────
export async function getAdminOverview(req, res) {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  const data = await analyticsService.getAdminOverview(days);
  res.json({ success: true, data });
}

// ── GET /api/analytics/jobs/:id ───────────────────────────────
export async function getJobStats(req, res) {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  const data = await analyticsService.getJobAnalytics(req.params.id, days);
  res.json({ success: true, data });
}
