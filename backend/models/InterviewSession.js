import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  type:       { type: String, enum: ['technical', 'behavioral', 'system_design'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },

  question:            { type: String, required: true },
  context:             { type: String, default: '' },
  hints:               { type: [String], default: [] },
  sampleAnswer:        { type: String, default: '' },
  evaluationCriteria:  { type: [String], default: [] },

  // User's practice answer + AI feedback
  userAnswer:   { type: String, default: '' },
  aiFeedback:   { type: String, default: '' },
  aiScore:      { type: Number, min: 0, max: 10, default: null },
  aiStrengths:      { type: [String], default: [] },
  aiImprovements:   { type: [String], default: [] },
  aiIdealPoints:    { type: [String], default: [] },
  practisedAt:  { type: Date, default: null },
}, { _id: true });

const InterviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    company:    { type: String, default: '', trim: true },
    role:       { type: String, required: true, trim: true },
    type:       { type: String, enum: ['technical', 'behavioral', 'system_design', 'mixed'], default: 'mixed' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },

    // AI-generated session meta
    sessionOverview:   { type: String, default: '' },
    preparationTips:   { type: [String], default: [] },
    companyCulture:    { type: String, default: '' },

    questions: { type: [QuestionSchema], default: [] },

    // Session stats
    readinessScore: { type: Number, min: 0, max: 10, default: null },
    completedAt:    { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  },
);

InterviewSessionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('InterviewSession', InterviewSessionSchema);
