import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Company name is required'],
      trim:     true,
      maxlength:[120, 'Company name cannot exceed 120 characters'],
    },

    // URL-safe identifier — auto-generated from name, must be unique
    slug: {
      type:   String,
      unique: true,
      index:  true,
      lowercase: true,
      trim:   true,
    },

    logo:        { type: String, default: '' },          // URL
    website:     { type: String, default: '' },
    industry:    { type: String, default: '', trim: true },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', ''],
      default: '',
    },
    description: { type: String, default: '', maxlength: 2000 },
    location:    { type: String, default: '', trim: true },

    // Recruiters that belong to this company (ObjectId refs to User)
    recruiters: [{
      type:  mongoose.Schema.Types.ObjectId,
      ref:   'User',
    }],

    // The recruiter (or admin) who originally created this profile
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

// Auto-generate slug from name before validation
CompanySchema.pre('validate', function (next) {
  if (this.isNew && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80)
      + '-' + Date.now().toString(36);
  }
  next();
});

export default mongoose.model('Company', CompanySchema);
