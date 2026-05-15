import mongoose from 'mongoose';

export const WORKFLOW_EVENTS = Object.freeze([
  'workspace_created',
  'state_changed',
  'prepared',
  'cover_letter_generated',
  'ats_scored',
  'checklist_updated',
  'checklist_completed',
  'recruiter_linked',
  'note_added',
  'queue_ranked',
  'next_actions_generated',
  'applied',
  'interview_scheduled',
]);

const WorkflowHistorySchema = new mongoose.Schema({
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  },
  workspace: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'ApplicationWorkspace',
    default: null,
  },
  application: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'Application',
    default: null,
    index:   true,
  },
  event: {
    type:     String,
    enum:     WORKFLOW_EVENTS,
    required: true,
  },
  from:     { type: String, default: '' },
  to:       { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  actor:    { type: String, enum: ['user', 'ai', 'system'], default: 'user' },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
});

WorkflowHistorySchema.index({ user: 1, createdAt: -1 });
WorkflowHistorySchema.index({ application: 1, createdAt: -1 });

export default mongoose.model('WorkflowHistory', WorkflowHistorySchema);
