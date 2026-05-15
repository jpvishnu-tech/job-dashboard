import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      maxlength:[80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type:      String,
      // Not required for Firebase-auth or Supabase-auth users.
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false,
    },
    avatar: { type: String, default: '' },
    role:   { type: String, enum: ['user', 'recruiter', 'admin'], default: 'user' },

    // Recruiter-specific fields
    company: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Company',
      default: null,
    },

    // Firebase UID — set when the account is created or linked via Firebase auth.
    // sparse:true allows multiple documents without this field (non-Firebase users).
    firebaseUid: { type: String, unique: true, sparse: true, select: false },

    // Supabase UID — set when the account is created or linked via Supabase auth.
    supabaseUid: { type: String, unique: true, sparse: true, select: false },

    // Stripe customer ID — created on first checkout
    stripeCustomerId: { type: String, default: null, sparse: true },

    // Password-reset flow — not returned in normal queries (select: false)
    resetPasswordToken:   { type: String, select: false },
    resetPasswordExpires: { type: Date,   select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', UserSchema);
