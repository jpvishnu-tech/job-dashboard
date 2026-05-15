import mongoose from 'mongoose';

const BulletRewriteSchema = new mongoose.Schema({
  original:      { type: String, default: '' },
  tailored:      { type: String, default: '' },
  addedKeywords: [String],
  impact:        { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
}, { _id: false });

const SectionImprovementSchema = new mongoose.Schema({
  section:  { type: String, default: '' },
  type:     { type: String, enum: ['rewrite', 'add', 'remove', 'reorder', 'expand'], default: 'rewrite' },
  original: { type: String, default: '' },
  improved: { type: String, default: '' },
  reason:   { type: String, default: '' },
}, { _id: false });

const TailoredResumeSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    jobTitle:              { type: String, default: '', trim: true, maxlength: 200 },
    jobCompany:            { type: String, default: '', trim: true, maxlength: 200 },
    jobDescriptionSnippet: { type: String, maxlength: 600 },

    // Scores
    originalAtsScore:  { type: Number, min: 0, max: 100, default: null },
    projectedAtsScore: { type: Number, min: 0, max: 100, default: null },
    keywordMatchScore: { type: Number, min: 0, max: 100, default: null },
    skillMatchScore:   { type: Number, min: 0, max: 100, default: null },

    // Tailored content
    tailoredSummary:       { type: String, default: '' },
    skillsToHighlight:     [String],
    skillsToAdd:           [String],
    keywordsToIncorporate: [String],

    // Section-level improvements
    sectionImprovements: [SectionImprovementSchema],
    bulletRewrites:      [BulletRewriteSchema],

    // Skill gap analysis
    missingSkills: {
      critical:   [String],
      important:  [String],
      niceToHave: [String],
    },

    // ATS keyword analysis
    atsKeywordsFound:   [String],
    atsCriticalMissing: [String],

    // Top-level recommendations
    topRecommendations: [String],

    // Optional link to a Job document
    jobRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

TailoredResumeSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('TailoredResume', TailoredResumeSchema);
