import mongoose from 'mongoose';

/**
 * Notification types emitted across the platform:
 *
 *  application_new       – a user applied to a recruiter's job  (→ recruiter)
 *  application_status    – recruiter changed an applicant's status (→ user)
 *  interview_scheduled   – recruiter scheduled an interview        (→ user)
 *  interview_updated     – interview was rescheduled / completed   (→ user)
 *  interview_cancelled   – interview was cancelled                 (→ user)
 *  offer_received        – application reached "offer" status      (→ user)
 *  hired                 – application reached "hired" status      (→ user)
 */

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    type: {
      type:     String,
      required: true,
      enum: [
        'application_new',
        'application_status',
        'interview_scheduled',
        'interview_updated',
        'interview_cancelled',
        'offer_received',
        'hired',
        // Automation engine types
        'reminder_due',
        'automation_insight',
      ],
    },

    title:   { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 500 },

    // Extra context — jobId, applicationId, interviewId, etc.
    data: { type: mongoose.Schema.Types.Mixed, default: {} },

    read:   { type: Boolean, default: false, index: true },
    readAt: { type: Date,    default: null  },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

// Compound index for the most common query: user + unread, sorted newest-first
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// TTL: auto-delete notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('Notification', NotificationSchema);
