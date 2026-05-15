import mongoose from 'mongoose';

export const TASK_TYPES = [
  'apply_to_job',
  'follow_up_application',
  'prepare_interview',
  'research_company',
  'update_resume',
  'reach_out_recruiter',
  'review_offer',
  'improve_profile',
  'add_skills',
  'practice_interview',
  'custom',
];

const AutomationTaskSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    type: {
      type:    String,
      enum:    TASK_TYPES,
      default: 'custom',
    },

    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },

    priority: {
      type:    String,
      enum:    ['high', 'medium', 'low'],
      default: 'medium',
    },

    status: {
      type:    String,
      enum:    ['pending', 'in_progress', 'completed', 'dismissed', 'snoozed'],
      default: 'pending',
      index:   true,
    },

    aiGenerated: { type: Boolean, default: false },

    relatedApplication: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Application',
      default: null,
    },
    relatedJob: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Job',
      default: null,
    },

    dueDate:      { type: Date, default: null },
    completedAt:  { type: Date, default: null },
    dismissedAt:  { type: Date, default: null },
    snoozedUntil: { type: Date, default: null },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  },
);

AutomationTaskSchema.index({ user: 1, status: 1, createdAt: -1 });
AutomationTaskSchema.index({ user: 1, priority: 1, status: 1 });

export default mongoose.model('AutomationTask', AutomationTaskSchema);
