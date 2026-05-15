/**
 * job.controller.js
 * ─────────────────────────────────────────────────────────────
 * HTTP handlers for the public job board and admin job management.
 */

import * as jobService           from '../services/job.service.js';
import * as analyticsService     from '../services/analytics.service.js';
import * as applyTrackingService from '../services/applyTracking.service.js';
import {
  normalizeAndImport,
  syncProvider,
  syncAll,
  getProviderStatus,
} from '../services/jobAggregation.service.js';
import JobMatch                  from '../models/JobMatch.js';

// ── Public ────────────────────────────────────────────────────

export async function listJobs(req, res) {
  const result = await jobService.listJobs(req.query);
  res.json({ success: true, ...result });
}

export async function getJob(req, res) {
  const job = await jobService.getJob(req.params.id);

  // Track view — fire and forget, don't block response
  analyticsService.track(analyticsService.EVENT_TYPES.JOB_VIEW, {
    user:     req.user?._id ?? null,
    metadata: { jobId: String(job._id), title: job.title, company: job.company },
    ip:       req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ success: true, data: job });
}

// ── POST /api/jobs/import ─────────────────────────────────────────────────
// Admin: bulk-import jobs from a provider sync or a raw JSON array.

export async function importJobs(req, res) {
  const { jobs, source, params } = req.body;

  // Option A: trigger a named provider sync
  if (source && !jobs) {
    const result = await syncProvider(source, params ?? {});
    return res.json({ success: true, data: result });
  }

  // Option B: direct job array import
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return res.status(400).json({ success: false, message: 'Provide "jobs" array or "source" name' });
  }

  const result = await normalizeAndImport(jobs, source ?? 'custom');
  res.status(201).json({ success: true, data: result });
}

// ── GET /api/jobs/recommended ─────────────────────────────────────────────
// Returns personalised job recommendations when the user is authenticated
// and has run the AI matcher; falls back to newest active jobs otherwise.

export async function recommendedJobs(req, res) {
  if (req.user) {
    const matches = await JobMatch.find({ user: req.user._id })
      .sort({ rankingScore: -1 })
      .limit(10)
      .populate('job', 'title company companyLogo location type url salary skills remote experienceLevel isActive postedAt')
      .lean();

    const personalised = matches
      .filter(m => m.job && m.job.isActive !== false)
      .map(m => ({ ...m.job, _matchScore: m.matchScore, _matchReason: m.matchReason }));

    if (personalised.length) {
      return res.json({ success: true, data: personalised, mode: 'ai' });
    }
  }

  // Fallback: newest 10 active jobs
  const result = await jobService.listJobs({ sort: 'newest', limit: 10, page: 1 });
  res.json({ success: true, data: result.data, mode: 'featured' });
}

// ── Admin ─────────────────────────────────────────────────────

export async function adminListJobs(req, res) {
  const result = await jobService.listAllJobs(req.query);
  res.json({ success: true, ...result });
}

export async function createJob(req, res) {
  const job = await jobService.createJob(req.body);

  analyticsService.track(analyticsService.EVENT_TYPES.JOB_CREATED, {
    user:     req.user._id,
    metadata: { jobId: String(job._id), title: job.title, company: job.company },
    ip:       req.ip,
  });

  res.status(201).json({ success: true, data: job });
}

export async function updateJob(req, res) {
  const job = await jobService.updateJob(req.params.id, req.body);

  analyticsService.track(analyticsService.EVENT_TYPES.JOB_UPDATED, {
    user:     req.user._id,
    metadata: { jobId: req.params.id },
    ip:       req.ip,
  });

  res.json({ success: true, data: job });
}

export async function toggleJob(req, res) {
  const job = await jobService.toggleJobActive(req.params.id);
  res.json({ success: true, data: job });
}

export async function deleteJob(req, res) {
  const job = await jobService.softDeleteJob(req.params.id);

  analyticsService.track(analyticsService.EVENT_TYPES.JOB_DELETED, {
    user:     req.user._id,
    metadata: { jobId: req.params.id },
    ip:       req.ip,
  });

  res.json({ success: true, message: 'Job removed', data: job });
}

// ── POST /api/jobs/sync ───────────────────────────────────────────────────────
// Admin: manually trigger a sync for one or all providers.
// Body: { provider? } — if omitted, all enabled providers run.

export async function syncJobs(req, res) {
  const { provider } = req.body ?? {};

  const result = provider
    ? await syncProvider(provider)
    : await syncAll();

  res.json({ success: true, data: result });
}

// ── GET /api/jobs/providers ───────────────────────────────────────────────────
// Admin: returns enabled/disabled status for every registered provider.

export async function listProviders(req, res) {
  const status = getProviderStatus();
  res.json({ success: true, data: status });
}

// ── GET /api/jobs/source/:platform ───────────────────────────────────────────
// Public: list jobs from a specific source/platform with optional filters.

export async function getBySource(req, res) {
  const { platform } = req.params;
  const result = await jobService.listJobs({ ...req.query, source: platform });
  res.json({ success: true, ...result });
}

// ── POST /api/jobs/:id/apply-click ────────────────────────────────────────────
// Authenticated: open the external apply URL in the browser (client-side),
// then call this endpoint to track the click and upsert the Application.

export async function trackApplyClick(req, res) {
  const result = await applyTrackingService.recordApplyClick(
    req.user._id,
    req.params.id,
    { ip: req.ip, userAgent: req.get('user-agent') || '' },
  );

  // Fire-and-forget — never block the response for analytics
  analyticsService.track(analyticsService.EVENT_TYPES.JOB_APPLY_CLICK, {
    user:      req.user._id,
    metadata:  { jobId: req.params.id, platform: result.platform },
    ip:        req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.json({ success: true, data: result });
}
