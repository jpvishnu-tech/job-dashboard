import mongoose from 'mongoose';

/**
 * Analytics
 * ─────────────────────────────────────────────────────────────
 * Append-only event log.  Every significant action in the app
 * writes one document here.  Designed for SaaS reporting:
 *   - funnel analysis (search → view → apply → interview → offer)
 *   - per-user engagement scores
 *   - admin aggregations (daily actives, popular jobs, etc.)
 *
 * Documents are never updated — only inserted and queried.
 * MongoDB's TTL index automatically expires raw events after 90 days
 * while the admin dashboard can store pre-aggregated summaries
 * in the 'summary' type indefinitely.
 */

// ── Event type catalogue ──────────────────────────────────────

export const EVENT_TYPES = Object.freeze({
  // Auth
  USER_REGISTER:        'user.register',
  USER_LOGIN:           'user.login',
  USER_LOGOUT:          'user.logout',
  USER_PASSWORD_RESET:  'user.password_reset',

  // Jobs
  JOB_VIEW:             'job.view',
  JOB_SEARCH:           'job.search',
  JOB_APPLY_CLICK:      'job.apply_click',   // external apply button clicked
  JOB_CREATED:          'job.created',       // admin action
  JOB_UPDATED:          'job.updated',
  JOB_DELETED:          'job.deleted',

  // Applications
  APP_CREATED:          'application.created',
  APP_STATUS_CHANGED:   'application.status_changed',
  APP_DELETED:          'application.deleted',

  // Resume
  RESUME_UPLOADED:      'resume.uploaded',
  RESUME_DELETED:       'resume.deleted',
  AI_ANALYZE:           'ai.analyze',
  AI_MATCH:             'ai.match',
  RESUME_OPTIMIZE:      'resume.optimize',
  RESUME_REWRITE:       'resume.rewrite',

  // Profile
  PROFILE_UPDATED:      'profile.updated',

  // Auto-Apply
  APP_DRAFT_CREATED:    'app_draft.created',
  APP_DRAFT_SUBMITTED:  'app_draft.submitted',
  COVER_LETTER_GEN:     'cover_letter.generated',
  APPLY_QUEUE_VIEWED:   'apply_queue.viewed',

  // Resume Tailoring
  RESUME_TAILOR:        'resume.tailor',

  // Workflow System
  WORKFLOW_WORKSPACE_CREATED: 'workflow.workspace_created',
  WORKFLOW_PREPARED:          'workflow.prepared',
  WORKFLOW_STATE_CHANGED:     'workflow.state_changed',
  WORKFLOW_COVER_LETTER:      'workflow.cover_letter',
  WORKFLOW_QUEUE_VIEWED:      'workflow.queue_viewed',
});

// ── Schema ────────────────────────────────────────────────────

const AnalyticsSchema = new mongoose.Schema(
  {
    // Who triggered the event (null = unauthenticated)
    user: {
      type:  mongoose.Schema.Types.ObjectId,
      ref:   'User',
      index: true,
      default: null,
    },

    event: {
      type:     String,
      required: true,
      index:    true,
      enum:     Object.values(EVENT_TYPES),
    },

    // Flexible payload — keep shallow and JSON-serialisable
    metadata: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Request context — useful for geo / bot filtering
    ip:        { type: String, default: '' },
    userAgent: { type: String, default: '' },

    // createdAt doubles as the event timestamp
  },
  {
    // Use { versionKey: false } — we never update analytics documents
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,

    // Partial filter index so compound queries are fast
  }
);

// ── Indexes ───────────────────────────────────────────────────

// Admin dashboard: events over time
AnalyticsSchema.index({ createdAt: -1 });

// Per-user timeline
AnalyticsSchema.index({ user: 1, createdAt: -1 });

// Event funnel queries
AnalyticsSchema.index({ event: 1, createdAt: -1 });

// TTL: auto-delete raw events after 90 days.
// Summary/aggregate documents should use a different collection.
AnalyticsSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, name: 'ttl_90d' }
);

// ── Static helpers ────────────────────────────────────────────

/**
 * Analytics.track(event, { user, metadata, ip, userAgent })
 * Fire-and-forget safe — never throws so it can't crash a request.
 */
AnalyticsSchema.statics.track = async function (event, opts = {}) {
  try {
    await this.create({
      event,
      user:      opts.user      ?? null,
      metadata:  opts.metadata  ?? {},
      ip:        opts.ip        ?? '',
      userAgent: opts.userAgent ?? '',
    });
  } catch (err) {
    // Log but don't propagate — analytics must never block the response
    console.warn('[analytics] track failed:', err.message);
  }
};

/**
 * Analytics.funnel(userId, days)
 * Returns event counts grouped by type for the given user
 * over the last N days.  Used on the user dashboard.
 */
AnalyticsSchema.statics.funnel = async function (userId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.aggregate([
    { $match: { user: userId, createdAt: { $gte: since } } },
    { $group: { _id: '$event', count: { $sum: 1 } } },
    { $sort:  { count: -1 } },
  ]);
};

export default mongoose.model('Analytics', AnalyticsSchema);
