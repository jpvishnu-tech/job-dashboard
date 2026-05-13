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
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

// Full-text search across title, company, and description
JobSchema.index({ title: 'text', company: 'text', description: 'text' });

// Compound indexes for the common filter + sort patterns in GET /api/jobs
JobSchema.index({ isActive: 1, postedAt: -1 });
JobSchema.index({ isActive: 1, type: 1 });
JobSchema.index({ isActive: 1, salaryMin: 1 });

export default mongoose.model('Job', JobSchema);
