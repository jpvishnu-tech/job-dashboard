import asyncHandler from 'express-async-handler';
import * as paymentService from '../services/payment.service.js';
import { PLANS, getPlan } from '../config/plans.js';

const FRONTEND_URL = () => process.env.FRONTEND_URL || 'http://localhost:5173';

// ── GET /api/stripe/plans ─────────────────────────────────────────────────
// Public — returns plan metadata (prices, features) for the pricing page.

export const getPlans = asyncHandler(async (_req, res) => {
  const plans = Object.values(PLANS).map(({ id, name, description, price, interval, highlights, notIncluded }) => ({
    id, name, description, price, interval, highlights, notIncluded,
  }));
  res.json({ success: true, plans });
});

// ── GET /api/stripe/subscription ─────────────────────────────────────────
// Returns the current user's subscription + plan features.

export const getSubscription = asyncHandler(async (req, res) => {
  const sub  = await paymentService.getSubscription(req.user._id);
  const plan = getPlan(sub.plan);

  res.json({
    success: true,
    subscription: {
      plan:               sub.plan,
      status:             sub.status,
      planName:           plan.name,
      price:              plan.price,
      features:           plan.features,
      currentPeriodEnd:   sub.currentPeriodEnd,
      cancelAtPeriodEnd:  sub.cancelAtPeriodEnd,
      canceledAt:         sub.canceledAt,
      trialEnd:           sub.trialEnd,
    },
  });
});

// ── GET /api/stripe/payments ──────────────────────────────────────────────
// Returns the last 20 payment records for the current user.

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await paymentService.getPaymentHistory(req.user._id, 20);
  res.json({ success: true, payments });
});

// ── POST /api/stripe/checkout ─────────────────────────────────────────────
// Creates a Stripe Checkout session and returns its URL.

export const createCheckout = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  if (!planId || !PLANS[planId] || planId === 'free') {
    return res.status(400).json({ success: false, message: 'Invalid plan selected' });
  }

  const successUrl = `${FRONTEND_URL()}/billing?upgraded=true`;
  const cancelUrl  = `${FRONTEND_URL()}/billing`;

  const session = await paymentService.createCheckoutSession(
    req.user, planId, successUrl, cancelUrl
  );

  res.json({ success: true, url: session.url, sessionId: session.id });
});

// ── POST /api/stripe/billing-portal ──────────────────────────────────────
// Creates a Stripe Billing Portal session and returns its URL.
// The portal lets users cancel, change plan, update payment method, view invoices.

export const createBillingPortal = asyncHandler(async (req, res) => {
  const returnUrl = `${FRONTEND_URL()}/billing`;
  const session   = await paymentService.createBillingPortalSession(req.user, returnUrl);
  res.json({ success: true, url: session.url });
});

// ── POST /api/stripe/webhook ──────────────────────────────────────────────
// Stripe webhook receiver. Must receive the raw request body (not JSON-parsed).
// Signature verification happens inside paymentService.constructWebhookEvent.

export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing stripe-signature header' });
  }

  let event;
  try {
    event = paymentService.constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error('[stripe] Webhook signature verification failed:', err.message);
    return res.status(400).json({ success: false, message: `Webhook error: ${err.message}` });
  }

  await paymentService.handleWebhookEvent(event);

  res.json({ received: true });
});
