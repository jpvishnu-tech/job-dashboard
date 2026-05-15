/**
 * Shortlist — stores AI-computed multi-dimensional priority scores for a
 * user/job pair. One document per pair, TTL-indexed for auto-expiry.
 *
 * Lifecycle:
 *   1. aiShortlistEngine.generateShortlist() computes and upserts these docs.
 *   2. GET /api/ai/shortlisted-jobs reads them (fast, no AI calls).
 *   3. After 7 days the TTL index deletes stale entries automatically.
 *   4. Next call to recommendations triggers a fresh generation.
 */

import mongoose from 'mongoose';

const ShortlistSchema = new mongoose.Schema(
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

    // ── Multi-dimensional AI scores (0–100) ───────────────────────────────

    overallScore:             { type: Number, min: 0, max: 100, required: true },
    matchScore:               { type: Number, min: 0, max: 100, default: 0 },
    careerRelevanceScore:     { type: Number, min: 0, max: 100, default: 0 },
    salaryRelevanceScore:     { type: Number, min: 0, max: 100, default: 0 },
    experienceAlignmentScore: { type: Number, min: 0, max: 100, default: 0 },
    recencyScore:             { type: Number, min: 0, max: 100, default: 0 },

    // ── Priority classification ───────────────────────────────────────────

    priorityLevel: {
      type:    String,
      enum:    ['apply_now', 'strong_fit', 'good_match', 'consider', 'stretch'],
      required: true,
      index:   true,
    },

    // ── AI-generated recommendation narrative ─────────────────────────────

    recommendationReason:  { type: String, default: '' },
    careerGrowthPotential: { type: String, default: '' },
    missingSkills:         { type: [String], default: [] },
    strengths:             { type: [String], default: [] },

    // ── Metadata ──────────────────────────────────────────────────────────

    // Snapshot of the resume version used to generate this shortlist entry.
    // If resume.uploadedAt > resumeVersionAt, this entry is stale.
    resumeVersionAt: { type: Date, default: null },

    computedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  },
);

// One priority record per user/job pair
ShortlistSchema.index({ user: 1, job: 1 }, { unique: true });

// Efficient read: all shortlist entries for a user, sorted by priority
ShortlistSchema.index({ user: 1, priorityLevel: 1, overallScore: -1 });

// TTL: auto-expire after 7 days so stale scores don't accumulate
ShortlistSchema.index({ computedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export default mongoose.model('Shortlist', ShortlistSchema);
