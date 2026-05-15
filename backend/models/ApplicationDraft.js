/**
 * ApplicationDraft
 * ─────────────────────────────────────────────────────────────
 * Stores AI-prepared application data: cover letter, checklist,
 * match analysis, and application notes.
 *
 * One draft per (user, job) pair — upserted when user re-prepares.
 * Status flow: draft → ready → submitted
 */

import mongoose from 'mongoose';

const ChecklistItemSchema = new mongoose.Schema(
  {
    item:     { type: String, required: true, trim: true },
    category: { type: String, default: 'general' },
    done:     { type: Boolean, default: false },
  },
  { _id: true }
);

const JobSnapshotSchema = new mongoose.Schema(
  {
    title:           { type: String },
    company:         { type: String },
    location:        { type: String },
    type:            { type: String },
    remote:          { type: Boolean },
    skills:          [String],
    salaryMin:       { type: Number },
    salaryMax:       { type: Number },
    experienceLevel: { type: String },
    applyUrl:        { type: String },
    source:          { type: String },
    descriptionSnippet: { type: String, maxlength: 600 },
  },
  { _id: false }
);

const ApplicationDraftSchema = new mongoose.Schema(
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

    // Cached snapshot so we can display draft details even if job is removed
    jobSnapshot: { type: JobSnapshotSchema, default: {} },

    // AI match analysis
    matchScore:  { type: Number, min: 0, max: 100, default: null },
    rankScore:   { type: Number, min: 0, max: 100, default: null },
    priority:    { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    matchReason: { type: String, default: '' },
    strengths:   [String],
    skillGaps:   [String],

    // AI-generated cover letter
    coverLetter:        { type: String, default: '' },
    coverLetterTone:    { type: String, default: 'professional' },
    coverLetterVersion: { type: Number, default: 1 },

    // Application workflow
    checklist:          { type: [ChecklistItemSchema], default: [] },
    applicationNotes:   { type: String, default: '', maxlength: 2000 },
    aiRecommendations:  [String],

    // Status
    status: {
      type:    String,
      enum:    ['draft', 'ready', 'submitted'],
      default: 'draft',
      index:   true,
    },
    submittedAt:      { type: Date },

    // Link to created Application record after submission
    applicationRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Application',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

// One draft per user+job pair
ApplicationDraftSchema.index({ user: 1, job: 1 }, { unique: true });
ApplicationDraftSchema.index({ user: 1, status: 1, createdAt: -1 });

export default mongoose.model('ApplicationDraft', ApplicationDraftSchema);
