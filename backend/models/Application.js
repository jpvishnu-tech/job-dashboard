import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    company:   { type: String, required: true, trim: true },
    role:      { type: String, required: true, trim: true },
    location:  { type: String, default: '', trim: true },
    salary:    { type: String, default: '' },
    type:      { type: String, default: '' },
    url:       { type: String, required: true },
    status: {
      type:    String,
      enum:    ['pending', 'interview', 'offer', 'rejected'],
      default: 'pending',
    },
    notes:     { type: String, default: '', maxlength: 2000 },
    appliedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

// Prevent a user from saving the same job URL twice
ApplicationSchema.index({ user: 1, url: 1 }, { unique: true });

export default mongoose.model('Application', ApplicationSchema);
