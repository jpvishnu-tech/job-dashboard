import mongoose from 'mongoose';

export const REMINDER_TYPES = [
  'follow_up',
  'interview',
  'deadline',
  'recruiter_follow_up',
  'task',
  'custom',
];

const ReminderSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    type: {
      type:    String,
      enum:    REMINDER_TYPES,
      default: 'custom',
    },

    title:   { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, trim: true, maxlength: 500, default: '' },

    scheduledAt: { type: Date, required: true },

    status: {
      type:    String,
      enum:    ['pending', 'sent', 'dismissed', 'snoozed'],
      default: 'pending',
      index:   true,
    },

    sentAt:       { type: Date, default: null },
    dismissedAt:  { type: Date, default: null },
    snoozedUntil: { type: Date, default: null },

    relatedApplication: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Application',
      default: null,
    },

    notificationSent: { type: Boolean, default: false },
    emailSent:        { type: Boolean, default: false },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  },
);

ReminderSchema.index({ user: 1, status: 1, scheduledAt: 1 });
// Auto-delete sent/dismissed reminders after 30 days
ReminderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('Reminder', ReminderSchema);
