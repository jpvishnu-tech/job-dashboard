/**
 * JobMatch — stores AI-computed match scores between a user's resume and a job.
 *
 * Key design choices:
 *  - Unique compound index on { user, job } → one score per user/job pair
 *  - computedAt TTL: matches expire after 7 days and are re-computed on demand
 *  - Staleness check in the service: if resume.uploadedAt > computedAt, recompute
 */

import mongoose from 'mongoose';

const JobMatchSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    job: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Job',
      required: true,
    },

    matchScore:   { type: Number, min: 0, max: 100, required: true },
    rankingScore: { type: Number, min: 0, max: 100, default: 0 },

    matchReason:  { type: String, default: '' },
    missingSkills:{ type: [String], default: [] },
    strengths:    { type: [String], default: [] },

    computedAt:   { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

// One score per user/job pair
JobMatchSchema.index({ user: 1, job: 1 }, { unique: true });

// TTL: auto-expire match scores after 7 days so they are freshly recomputed
JobMatchSchema.index({ computedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export default mongoose.model('JobMatch', JobMatchSchema);
