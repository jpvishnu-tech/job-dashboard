import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
      index:    true,
    },

    plan: {
      type:    String,
      enum:    ['free', 'premium_user', 'recruiter', 'premium_recruiter'],
      default: 'free',
    },

    status: {
      type:    String,
      enum:    ['active', 'canceled', 'past_due', 'trialing', 'incomplete', 'inactive'],
      default: 'active',
    },

    // Stripe identifiers — null for free plan users
    stripeCustomerId:     { type: String, default: null, index: true, sparse: true },
    stripeSubscriptionId: { type: String, default: null, index: true, sparse: true },
    stripePriceId:        { type: String, default: null },

    // Current billing period
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd:   { type: Date, default: null },

    // Cancellation
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt:        { type: Date, default: null },

    // Trial
    trialEnd: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model('Subscription', SubscriptionSchema);
