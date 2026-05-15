import mongoose from 'mongoose';

// ── AI analysis sub-schema ────────────────────────────────────

const AiAnalysisSchema = new mongoose.Schema(
  {
    type: {
      type:     String,
      enum:     ['analyze', 'match', 'optimize', 'rewrite'],
      required: true,
    },

    // General analysis fields (type === 'analyze')
    atsScore:        { type: Number, min: 0, max: 100 },
    overallFeedback: { type: String },
    formattingScore: { type: Number, min: 0, max: 100 },
    contentScore:    { type: Number, min: 0, max: 100 },
    strengths:       [String],
    weaknesses:      [String],
    recommendations: [String],
    skillsFound:     [String],
    missingElements: [String],

    // Enhanced ATS fields (type === 'analyze' enhanced)
    keywordRelevanceScore:  { type: Number, min: 0, max: 100 },
    recruiterVisibilityScore: { type: Number, min: 0, max: 100 },
    sectionScores:          { type: mongoose.Schema.Types.Mixed },
    keywordGaps:            { type: mongoose.Schema.Types.Mixed },
    formattingIssues:       [String],
    keywordsPresent:        [String],

    // Job-match fields (type === 'match')
    matchScore:        { type: Number, min: 0, max: 100 },
    matchAssessment:   { type: String },
    matchingKeywords:  [String],
    missingKeywords:   [String],
    recommendedSkills: [String],
    qualificationGaps: [String],
    tailoringTips:     [String],

    // Snapshot of the job description used for the match
    jobDescriptionSnippet: { type: String, maxlength: 500 },

    // Job optimizer fields (type === 'optimize')
    optimizationScore:       { type: Number, min: 0, max: 100 },
    targetRole:              { type: String },
    keywordsToAdd:           { type: mongoose.Schema.Types.Mixed },
    sectionSuggestions:      { type: mongoose.Schema.Types.Mixed },
    missingSkills:           { type: mongoose.Schema.Types.Mixed },
    missingTechnologies:     [String],
    tailoredRecommendations: [String],

    // Rewrite fields (type === 'rewrite')
    targetSection:    { type: String },
    rewrittenSummary: { type: String },
    rewrittenBullets: { type: mongoose.Schema.Types.Mixed },
    improvementNotes: [String],
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

// ── Resume schema ─────────────────────────────────────────────

const ResumeSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,     // one active resume document per user
      index:    true,
    },

    // Firebase Storage / public URL to the uploaded PDF
    url:      { type: String, required: true },
    fileName: { type: String, required: true, trim: true, maxlength: 255 },
    fileSize: { type: Number, min: 0 },       // bytes
    mimeType: { type: String, default: 'application/pdf' },

    // Firebase Storage path — used for deleting the file via Admin SDK
    storagePath: { type: String, default: '' },

    // Cached plain-text extracted from the PDF (used by AI endpoints)
    // Stored here so we don't re-extract on every analysis request.
    // select: false keeps it out of normal GET /resume responses.
    extractedText: { type: String, select: false },

    // AI-extracted structured profile — cached, re-computed only when resume changes.
    resumeProfile: {
      skills:          { type: [String], default: [] },
      technologies:    { type: [String], default: [] },
      yearsExperience: { type: Number,  default: 0   },
      education:       { type: [String], default: [] },
      rolePreferences: { type: [String], default: [] },
      summary:         { type: String,  default: ''  },
      extractedAt:     { type: Date,    default: null },
    },

    // Most-recent ATS score — duplicated here for fast dashboard queries
    lastAtsScore: { type: Number, min: 0, max: 100, default: null },

    // Analysis history — newest first, capped at 50 entries
    analyses: {
      type:    [AiAnalysisSchema],
      default: [],
    },

    uploadedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

// ── Instance methods ─────────────────────────────────────────

/**
 * addAnalysis(result)
 * Pushes a new AI result to the front of the analyses array and
 * caps the history at 50 entries so the document stays lean.
 */
ResumeSchema.methods.addAnalysis = function (result) {
  this.analyses.unshift(result);
  if (this.analyses.length > 50) this.analyses.length = 50;

  if (result.type === 'analyze' && result.atsScore != null) {
    this.lastAtsScore = result.atsScore;
  }
  if (result.type === 'optimize' && result.optimizationScore != null) {
    this.lastAtsScore = result.optimizationScore;
  }
};

export default mongoose.model('Resume', ResumeSchema);
