import mongoose from 'mongoose';

export const WORKFLOW_STATES = Object.freeze([
  'saved',
  'prepared',
  'ready_to_apply',
  'applied',
  'interview',
  'offer',
  'rejected',
]);

const ChecklistItemSchema = new mongoose.Schema({
  item:     { type: String, required: true },
  category: { type: String, default: 'general' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  done:     { type: Boolean, default: false },
}, { _id: true });

const CoverLetterSchema = new mongoose.Schema({
  text:               { type: String, default: '' },
  subjectLine:        { type: String, default: '' },
  tone:               { type: String, enum: ['professional', 'enthusiastic', 'technical', 'concise'], default: 'professional' },
  keyHighlights:      { type: [String], default: [] },
  aiRecommendations:  { type: [String], default: [] },
  version:            { type: Number, default: 0 },
  generatedAt:        { type: Date, default: null },
}, { _id: false });

const ATSDataSchema = new mongoose.Schema({
  score:           { type: Number, min: 0, max: 100, default: null },
  matchedKeywords: { type: [String], default: [] },
  missingKeywords: { type: [String], default: [] },
  skillGaps:       { type: [String], default: [] },
  improvements:    { type: [String], default: [] },
  scoredAt:        { type: Date, default: null },
}, { _id: false });

const PreparationSchema = new mongoose.Schema({
  resumeOptimized:      { type: Boolean, default: false },
  coverLetterGenerated: { type: Boolean, default: false },
  atsValidated:         { type: Boolean, default: false },
  checklistComplete:    { type: Boolean, default: false },
  preparedAt:           { type: Date, default: null },
}, { _id: false });

const ApplicationWorkspaceSchema = new mongoose.Schema({
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },
  application: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Application',
    required: true,
  },

  workflowState: {
    type:    String,
    enum:    WORKFLOW_STATES,
    default: 'saved',
    index:   true,
  },

  ats:         { type: ATSDataSchema,      default: () => ({}) },
  coverLetter: { type: CoverLetterSchema,  default: () => ({}) },
  checklist:   { type: [ChecklistItemSchema], default: [] },
  preparation: { type: PreparationSchema,  default: () => ({}) },

  recruiterContact: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'RecruiterContact',
    default: null,
  },

  aiQueueScore:      { type: Number, default: null },
  aiNextActions:     { type: [String], default: [] },
  aiQueueComputedAt: { type: Date, default: null },

  pinned:         { type: Boolean, default: false },
  archived:       { type: Boolean, default: false },
  workspaceNotes: { type: String, default: '', maxlength: 5000 },
  tags:           { type: [String], default: [] },
}, {
  timestamps: true,
  toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
});

// One workspace per user + application pair
ApplicationWorkspaceSchema.index({ user: 1, application: 1 }, { unique: true });
ApplicationWorkspaceSchema.index({ user: 1, workflowState: 1, createdAt: -1 });
ApplicationWorkspaceSchema.index({ user: 1, aiQueueScore: -1 });
ApplicationWorkspaceSchema.index({ user: 1, pinned: 1 });

export default mongoose.model('ApplicationWorkspace', ApplicationWorkspaceSchema);
