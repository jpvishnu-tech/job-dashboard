import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema(
  {
    // Links
    application: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Application',
      required: true,
      index:    true,
    },
    job: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Job',
      required: true,
    },
    applicant: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    recruiter: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    company: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Company',
      default:  null,
    },

    // Schedule
    scheduledAt: {
      type:     Date,
      required: [true, 'Interview date/time is required'],
    },
    durationMinutes: {
      type:    Number,
      default: 60,
      min:     15,
      max:     480,
    },

    // Format
    type: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'panel'],
      default: 'video',
    },
    meetingLink: { type: String, default: '' },
    location:    { type: String, default: '' },

    // Content
    notes:    { type: String, default: '', maxlength: 2000 },
    feedback: { type: String, default: '', maxlength: 2000 }, // filled after interview

    // Lifecycle
    status: {
      type:    String,
      enum:    ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
      index:   true,
    },
    emailSent:  { type: Boolean, default: false },
    cancelledAt:{ type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

export default mongoose.model('Interview', InterviewSchema);
