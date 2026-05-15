import mongoose from 'mongoose';

// ── Sub-schemas ───────────────────────────────────────────────────────────

const ResourceSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  type:     { type: String, enum: ['course', 'book', 'project', 'practice', 'article'], default: 'course' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
}, { _id: false });

const PhaseSchema = new mongoose.Schema({
  phase:      { type: Number, required: true },
  title:      { type: String, required: true },
  duration:   { type: String, default: '' },
  focus:      { type: String, default: '' },
  skills:     { type: [String], default: [] },
  milestones: { type: [String], default: [] },
  resources:  { type: [ResourceSchema], default: [] },
}, { _id: true });

const MissingSkillSchema = new mongoose.Schema({
  skill:                  { type: String, required: true },
  priority:               { type: String, enum: ['critical', 'important', 'nice_to_have'], default: 'important' },
  estimatedLearningWeeks: { type: Number, default: 4 },
  demandLevel:            { type: String, enum: ['very_high', 'high', 'medium', 'low'], default: 'medium' },
  trend:                  { type: String, enum: ['growing', 'stable', 'declining'], default: 'stable' },
}, { _id: false });

const TrendingTechSchema = new mongoose.Schema({
  tech:          { type: String, required: true },
  demandLevel:   { type: String, enum: ['very_high', 'high', 'medium'], default: 'high' },
  adoptionStage: { type: String, enum: ['mainstream', 'emerging', 'cutting_edge'], default: 'mainstream' },
}, { _id: false });

const LearningProgressSchema = new mongoose.Schema({
  skill:       { type: String, required: true },
  phase:       { type: Number, default: 1 },
  status:      { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  startedAt:   { type: Date, default: null },
  completedAt: { type: Date, default: null },
  notes:       { type: String, default: '' },
}, { _id: false });

// ── Main schema ───────────────────────────────────────────────────────────

const CareerPlanSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
      index:    true,
    },

    // User inputs
    currentRole:      { type: String, default: '' },
    targetRole:       { type: String, default: '' },
    experienceLevel:  { type: String, enum: ['entry', 'mid', 'senior', 'lead', 'exec'], default: 'mid' },
    goals:            { type: [String], default: [] },
    timelineMonths:   { type: Number, min: 3, max: 36, default: 12 },

    // AI-generated roadmap
    roadmap: {
      summary:         { type: String, default: '' },
      totalDuration:   { type: String, default: '' },
      difficulty:      { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
      phases:          { type: [PhaseSchema], default: [] },
      keyTechnologies: { type: [String], default: [] },
      marketInsight:   { type: String, default: '' },
      quickWins:       { type: [String], default: [] },
      generatedAt:     { type: Date, default: null },
    },

    // AI-generated skills gap
    skillsGap: {
      targetRoleOverview:   { type: String, default: '' },
      matchScore:           { type: Number, min: 0, max: 100, default: null },
      currentStrengths:     { type: [String], default: [] },
      missingSkills:        { type: [MissingSkillSchema], default: [] },
      trendingTechnologies: { type: [TrendingTechSchema], default: [] },
      recruiterExpectations:{ type: [String], default: [] },
      priorityLearningPath: { type: [String], default: [] },
      analysedAt:           { type: Date, default: null },
    },

    // User's learning progress (populated from roadmap phases)
    learningProgress: { type: [LearningProgressSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  },
);

export default mongoose.model('CareerPlan', CareerPlanSchema);
