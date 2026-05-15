import mongoose from 'mongoose';

const CommLogSchema = new mongoose.Schema({
  type:      { type: String, enum: ['email', 'call', 'linkedin', 'meeting', 'message', 'other'], default: 'email' },
  direction: { type: String, enum: ['sent', 'received'], default: 'sent' },
  subject:   { type: String, default: '', trim: true },
  notes:     { type: String, default: '', trim: true, maxlength: 2000 },
  date:      { type: Date, default: Date.now },
  outcome:   { type: String, default: '', trim: true },
}, { _id: true, timestamps: { createdAt: true, updatedAt: false } });

const FollowUpSchema = new mongoose.Schema({
  dueDate:     { type: Date, required: true },
  note:        { type: String, default: '' },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
}, { _id: true });

const RecruiterContactSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',        required: true, index: true },
  company:  { type: String, default: '', trim: true },
  name:     { type: String, required: true, trim: true },
  title:    { type: String, default: '', trim: true },
  email:    { type: String, default: '', trim: true, lowercase: true },
  phone:    { type: String, default: '' },
  linkedIn: { type: String, default: '' },

  applications:     { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }], default: [] },
  communicationLog: { type: [CommLogSchema],  default: [] },
  followUps:        { type: [FollowUpSchema], default: [] },

  status: {
    type:    String,
    enum:    ['active', 'responded', 'unresponsive', 'archived'],
    default: 'active',
    index:   true,
  },

  notes:           { type: String, default: '', maxlength: 3000 },
  tags:            { type: [String], default: [] },
  lastContactedAt: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
});

RecruiterContactSchema.index({ user: 1, createdAt: -1 });
RecruiterContactSchema.index({ user: 1, status: 1 });

export default mongoose.model('RecruiterContact', RecruiterContactSchema);
