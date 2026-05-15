import mongoose from 'mongoose';

export const PIPELINE_STAGES = [
  'saved', 'applied', 'under_review',
  'interview_scheduled', 'interview_completed',
  'offer_received', 'hired', 'rejected',
  // Legacy recruiter-portal values kept for backward compat
  'pending', 'shortlisted', 'interview', 'offer',
];

const TimelineEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['status_change', 'note_added', 'interview_scheduled', 'interview_completed',
           'offer_received', 'document_added', 'ai_insight', 'manual_event', 'created',
           'apply_click'],
    required: true,
  },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  metadata:    { type: mongoose.Schema.Types.Mixed, default: {} },
  actor:       { type: String, enum: ['user', 'system', 'recruiter'], default: 'user' },
  createdAt:   { type: Date, default: Date.now },
}, { _id: true });

const InterviewSchema = new mongoose.Schema({
  type:        { type: String, enum: ['phone', 'video', 'onsite', 'technical', 'hr', 'panel', 'final'], default: 'video' },
  scheduledAt: { type: Date, required: true },
  duration:    { type: Number, default: 60 },
  location:    { type: String, default: '' },
  meetingLink: { type: String, default: '' },
  interviewer: { type: String, default: '' },
  notes:       { type: String, default: '' },
  status:      { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
  feedback:    { type: String, default: '' },
  outcome:     { type: String, enum: ['positive', 'negative', 'neutral', ''], default: '' },
}, { _id: true, timestamps: { createdAt: true, updatedAt: false } });

const AIInsightSchema = new mongoose.Schema({
  interviewProbability: { type: Number, min: 0, max: 100, default: null },
  successProbability:   { type: Number, min: 0, max: 100, default: null },
  rejectionRisk:        { type: Number, min: 0, max: 100, default: null },
  responseTimeEstimate: { type: Number, default: null },
  strengths:            { type: [String], default: [] },
  concerns:             { type: [String], default: [] },
  recommendations:      { type: [String], default: [] },
  summary:              { type: String, default: '' },
  computedAt:           { type: Date, default: null },
}, { _id: false });

const ApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  job:  { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  default: null },

  company:      { type: String, required: true, trim: true },
  role:         { type: String, required: true, trim: true },
  location:     { type: String, default: '', trim: true },
  salary:       { type: String, default: '' },
  salaryMin:    { type: Number, default: null },
  salaryMax:    { type: Number, default: null },
  type:         { type: String, default: 'full-time' },
  url:          { type: String, default: '' },
  description:  { type: String, default: '' },

  contactName:  { type: String, default: '' },
  contactEmail: { type: String, default: '' },

  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  status: {
    type:    String,
    enum:    PIPELINE_STAGES,
    default: 'saved',
    index:   true,
  },

  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  tags:     { type: [String], default: [] },
  notes:    { type: String, default: '', maxlength: 5000 },

  timeline:   { type: [TimelineEventSchema], default: [] },
  interviews: { type: [InterviewSchema],     default: [] },
  aiInsights: { type: AIInsightSchema,       default: () => ({}) },

  appliedAt:  { type: Date, default: null, index: true },
  matchScore: { type: Number, default: null },

  // ── External Apply Tracking ──────────────────────────────────────────────
  // Set when the application was created via an external apply-click (not manually)
  externalApply:  { type: Boolean, default: false },
  sourcePlatform: { type: String,  default: '' },   // linkedin | naukri | indeed …
  applyClickedAt: { type: Date,    default: null },  // timestamp of the last apply click

  statusHistory: [{
    status:    { type: String, enum: PIPELINE_STAGES },
    changedAt: { type: Date, default: Date.now },
    note:      { type: String, default: '' },
    _id:       false,
  }],
}, {
  timestamps: true,
  toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
});

ApplicationSchema.index({ user: 1, status: 1 });
ApplicationSchema.index({ user: 1, createdAt: -1 });
ApplicationSchema.index({ user: 1, appliedAt: -1 });

export default mongoose.model('Application', ApplicationSchema);
