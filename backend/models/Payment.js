import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    stripePaymentIntentId: { type: String, default: null },
    stripeInvoiceId:       { type: String, default: null },
    stripeChargeId:        { type: String, default: null },

    amount:   { type: Number, required: true },   // in cents
    currency: { type: String, default: 'usd' },

    status: {
      type: String,
      enum: ['succeeded', 'failed', 'pending', 'refunded'],
      default: 'pending',
    },

    plan:        { type: String, default: null },
    description: { type: String, default: '' },

    // Stripe billing period this invoice covered
    periodStart: { type: Date, default: null },
    periodEnd:   { type: Date, default: null },

    invoiceUrl:  { type: String, default: null },
    receiptUrl:  { type: String, default: null },
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

export default mongoose.model('Payment', PaymentSchema);
