/**
 * applyTracking.service.js
 * ─────────────────────────────────────────────────────────────
 * Handles all business logic for the External Apply system:
 *
 *   recordApplyClick  — called when a user clicks "Apply" on a job card.
 *                       Records the click, increments the job counter, and
 *                       upserts an Application document (status: applied).
 *
 *   getApplyHistory   — returns a paginated list of the user's apply-click
 *                       events with per-platform stats.
 */

import mongoose   from 'mongoose';
import Job        from '../models/Job.js';
import Application from '../models/Application.js';
import ApplyClick from '../models/ApplyClick.js';

// Human-readable platform labels used in timeline entries
const PLATFORM_LABEL = {
  linkedin:  'LinkedIn',
  naukri:    'Naukri',
  indeed:    'Indeed',
  remotive:  'Remotive',
  company:   'Company Website',
  custom:    'Company Website',
  manual:    'External Platform',
};

function platformLabel(source) {
  return PLATFORM_LABEL[source] || source || 'External Platform';
}

// ── recordApplyClick ─────────────────────────────────────────────────────────

/**
 * recordApplyClick(userId, jobId, opts)
 *
 * 1. Validates job exists
 * 2. Writes an ApplyClick document (click log)
 * 3. Increments job.clickCount
 * 4. Upserts Application:
 *      - Existing saved/pending → advance to 'applied', set appliedAt
 *      - Already applied/further → add timeline event only (no status regression)
 *      - No application yet → create with status 'applied'
 *
 * Returns { application, applyUrl, clickCount, platform }
 */
export async function recordApplyClick(userId, jobId, { ip = '', userAgent = '' } = {}) {
  const job = await Job.findById(jobId)
    .select('title company location type url applyUrl source external clickCount isActive')
    .lean();

  if (!job) {
    const err = new Error('Job not found');
    err.status = 404;
    throw err;
  }

  const applyUrl = job.applyUrl || job.url;
  const platform = job.source  || 'manual';
  const label    = platformLabel(platform);

  // ── 1. Log the click ─────────────────────────────────────────────────────
  await ApplyClick.create({
    user:           userId,
    job:            jobId,
    jobTitle:       job.title,
    company:        job.company,
    sourcePlatform: platform,
    applyUrl,
    ip,
    userAgent,
  });

  // ── 2. Increment job counter (fire-and-forget is fine; use $inc for atomicity) ─
  await Job.findByIdAndUpdate(jobId, { $inc: { clickCount: 1 } });

  // ── 3. Upsert Application ────────────────────────────────────────────────
  const ADVANCEABLE = new Set(['saved', 'pending']);

  let application = await Application.findOne({ user: userId, job: jobId });

  if (application) {
    // Advance status only if still in a pre-apply stage
    if (ADVANCEABLE.has(application.status)) {
      application.status    = 'applied';
      application.appliedAt = application.appliedAt || new Date();
      application.statusHistory.push({ status: 'applied', changedAt: new Date() });
    }
    application.externalApply  = true;
    application.sourcePlatform = platform;
    application.applyClickedAt = new Date();
    if (!application.url) application.url = applyUrl;

    application.timeline.push({
      type:        'apply_click',
      title:       `Applied via ${label}`,
      description: `External application opened on ${label}. Tracked automatically.`,
      actor:       'system',
    });

    await application.save();
  } else {
    application = await Application.create({
      user:           userId,
      job:            jobId,
      company:        job.company,
      role:           job.title,
      location:       job.location || '',
      type:           job.type     || 'full-time',
      url:            applyUrl,
      status:         'applied',
      appliedAt:      new Date(),
      externalApply:  true,
      sourcePlatform: platform,
      applyClickedAt: new Date(),
      timeline: [{
        type:        'created',
        title:       `Applied via ${label}`,
        description: 'Application created automatically on external apply click.',
        actor:       'system',
      }],
      statusHistory: [{ status: 'applied', changedAt: new Date() }],
    });
  }

  return {
    application,
    applyUrl,
    platform,
    clickCount: (job.clickCount || 0) + 1,
  };
}

// ── getApplyHistory ──────────────────────────────────────────────────────────

/**
 * getApplyHistory(userId, opts)
 *
 * Returns paginated ApplyClick records (most recent first) with:
 *   - populated job snapshot (title, logo, source …)
 *   - per-platform click counts for the user
 */
export async function getApplyHistory(userId, { page = 1, limit = 20 } = {}) {
  const userOid = new mongoose.Types.ObjectId(String(userId));
  const skip    = (page - 1) * limit;

  const [total, clicks, platformAgg] = await Promise.all([
    ApplyClick.countDocuments({ user: userOid }),

    ApplyClick.find({ user: userOid })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('job', 'title company companyLogo location url applyUrl source type remote isActive')
      .lean(),

    ApplyClick.aggregate([
      { $match: { user: userOid } },
      { $group: { _id: '$sourcePlatform', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]),
  ]);

  return {
    data: clicks,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext:    page * limit < total,
      hasPrev:    page > 1,
    },
    platformStats: platformAgg.map(p => ({ platform: p._id, count: p.count })),
    totalClicks:   total,
  };
}
