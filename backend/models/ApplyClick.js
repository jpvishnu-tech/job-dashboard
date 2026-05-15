/**
 * ApplyClick
 * ─────────────────────────────────────────────────────────────
 * One document per external-apply button click.
 * Used for:
 *   - per-user apply history  (GET /api/applications/history)
 *   - per-job click analytics (aggregated in job.clickCount)
 *   - platform funnel stats   (LinkedIn vs Naukri vs Indeed …)
 *
 * Documents auto-expire after 180 days via TTL index on createdAt.
 */

import mongoose from 'mongoose';

const ApplyClickSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    job: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Job',
      required: true,
    },

    // Denormalised for fast history queries (job may be deleted later)
    jobTitle: { type: String, required: true },
    company:  { type: String, required: true },

    // Source platform slug  (linkedin | naukri | indeed | remotive | company | manual)
    sourcePlatform: { type: String, default: 'manual' },

    // The URL that was opened in the new tab
    applyUrl: { type: String, default: '' },

    // Request context
    ip:        { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

// Auto-expire after 180 days
ApplyClickSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

// Query patterns
ApplyClickSchema.index({ user: 1, createdAt: -1 });   // user history feed
ApplyClickSchema.index({ job:  1, createdAt: -1 });   // per-job click list

export default mongoose.model('ApplyClick', ApplyClickSchema);
