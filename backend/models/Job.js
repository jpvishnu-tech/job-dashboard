import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    company:     { type: String, required: true, trim: true },
    companyLogo: { type: String, default: '' },
    location:    { type: String, required: true, trim: true },
    salary:      { type: String, default: '' },
    salaryMin:   { type: Number, default: 0, min: 0 },
    salaryMax:   { type: Number, default: 0, min: 0 },
    type: {
      type:     String,
      enum:     ['full-time', 'part-time', 'contract', 'internship'],
      required: true,
    },
    department:   { type: String, default: '', trim: true },
    description:  { type: String, default: '' },
    requirements: [{ type: String, trim: true }],
    url:          { type: String, required: true },
    isActive:     { type: Boolean, default: true, index: true },
    source:       { type: String, default: 'manual' },
    externalId:   { type: String, default: '' },
    postedAt:     { type: Date, default: Date.now },

    // ── Aggregation fields ────────────────────────────────────────────────
    // Skills extracted/tagged from the job (used by AI matching + filter)
    skills:          { type: [String], default: [] },

    // True when the role is fully or primarily remote
    remote:          { type: Boolean, default: false, index: true },

    // Seniority level derived from the job description or provider metadata
    experienceLevel: {
      type:    String,
      enum:    ['entry', 'mid', 'senior', 'lead', 'any'],
      default: 'any',
      index:   true,
    },

    // Free-form tags (e.g. "React", "fintech", "startup")
    tags: { type: [String], default: [] },

    // MD5 hash of (title + company + source) — used as dedup fallback
    // when externalId is absent (sparse index: only set for aggregated jobs)
    _dedupeHash: { type: String, sparse: true },

    // Recruiter Portal — set when a recruiter creates this job
    recruiterOwner: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
      index:   true,
    },
    companyRef: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Company',
      default: null,
    },

    // Applicant count cache — incremented on each application
    applicationCount: { type: Number, default: 0, min: 0 },

    // ── External Apply ────────────────────────────────────────────────────
    // Direct application URL (e.g. LinkedIn Easy Apply, Naukri apply page).
    // Falls back to `url` when absent — stored separately so "View Job" and
    // "Apply" can open different pages (listing vs. application form).
    applyUrl: { type: String, default: '' },

    // True when the job originates from an external platform (linkedin, naukri …)
    // Set automatically by the aggregation import pipeline.
    external: { type: Boolean, default: false, index: true },

    // Running total of apply-button clicks across all users (denormalised counter)
    clickCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

// Full-text search across title, company, description, and tags
JobSchema.index({ title: 'text', company: 'text', description: 'text', tags: 'text' });

// Compound indexes for the common filter + sort patterns in GET /api/jobs
JobSchema.index({ isActive: 1, postedAt: -1 });
JobSchema.index({ isActive: 1, type: 1 });
JobSchema.index({ isActive: 1, salaryMin: 1 });
JobSchema.index({ isActive: 1, source: 1 });
JobSchema.index({ isActive: 1, remote: 1 });
JobSchema.index({ isActive: 1, experienceLevel: 1 });
// Dedup: unique compound index for external jobs (sparse — manual jobs have no externalId)
JobSchema.index({ externalId: 1, source: 1 }, { unique: true, sparse: true });

export default mongoose.model('Job', JobSchema);
