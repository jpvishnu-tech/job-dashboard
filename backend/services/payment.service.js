/**
 * payment.service.js
 * ─────────────────────────────────────────────────────────────
 * All Stripe interactions live here. Nothing in this file does
 * HTTP (no req/res) — pure business logic.
 *
 * Stripe events handled by handleWebhookEvent():
 *   checkout.session.completed       → provision subscription
 *   customer.subscription.updated    → sync plan / status changes
 *   customer.subscription.deleted    → cancel & downgrade to free
 *   invoice.payment_succeeded        → record payment
 *   invoice.payment_failed           → mark subscription past_due
 */

import Stripe       from 'stripe';
import User         from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Payment      from '../models/Payment.js';
import { PLANS, getPlan } from '../config/plans.js';

// ── Lazy singleton ────────────────────────────────────────────

let _stripe = null;

function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  }
  return _stripe;
}

// ── Customer management ───────────────────────────────────────

/**
 * getOrCreateCustomer(user)
 * Finds existing Stripe customer or creates one, caches customerId on User doc.
 */
export async function getOrCreateCustomer(user) {
  if (user.stripeCustomerId) {
    // Verify it still exists in Stripe
    try {
      const existing = await getStripe().customers.retrieve(user.stripeCustomerId);
      if (!existing.deleted) return existing;
    } catch {
      // Customer deleted in Stripe — recreate below
    }
  }

  const customer = await getStripe().customers.create({
    email:    user.email,
    name:     user.name,
    metadata: { userId: String(user._id) },
  });

  await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id });
  return customer;
}

// ── Checkout ─────────────────────────────────────────────────

/**
 * createCheckoutSession(user, planId, successUrl, cancelUrl)
 * Returns a Stripe checkout session. The caller redirects the user to session.url.
 */
export async function createCheckoutSession(user, planId, successUrl, cancelUrl) {
  const plan = PLANS[planId];
  if (!plan || !plan.stripePriceId) {
    throw Object.assign(new Error(`Plan "${planId}" not available for checkout`), { status: 400 });
  }

  const customer = await getOrCreateCustomer(user);

  // If the user has an active subscription, use subscription update flow instead
  const existingSub = await Subscription.findOne({ user: user._id });
  if (existingSub?.stripeSubscriptionId && existingSub.status === 'active') {
    // Use billing portal for plan changes — don't create a new checkout
    throw Object.assign(
      new Error('You already have an active subscription. Use the billing portal to change plans.'),
      { status: 409, code: 'EXISTING_SUBSCRIPTION' }
    );
  }

  const session = await getStripe().checkout.sessions.create({
    customer:     customer.id,
    mode:         'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url:  `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:   cancelUrl,
    metadata: {
      userId: String(user._id),
      planId,
    },
    subscription_data: {
      metadata: { userId: String(user._id), planId },
    },
    allow_promotion_codes: true,
  });

  return session;
}

// ── Billing portal ────────────────────────────────────────────

/**
 * createBillingPortalSession(user, returnUrl)
 * Returns a Stripe billing portal session. The caller redirects the user to session.url.
 * The portal lets users change plan, update payment method, cancel, view invoices.
 */
export async function createBillingPortalSession(user, returnUrl) {
  const customer = await getOrCreateCustomer(user);

  const session = await getStripe().billingPortal.sessions.create({
    customer:   customer.id,
    return_url: returnUrl,
  });

  return session;
}

// ── Subscription queries ──────────────────────────────────────

/**
 * getSubscription(userId)
 * Returns the user's Subscription doc (creates a free one if none exists).
 */
export async function getSubscription(userId) {
  let sub = await Subscription.findOne({ user: userId });
  if (!sub) {
    sub = await Subscription.create({ user: userId, plan: 'free', status: 'active' });
  }
  return sub;
}

/**
 * getPaymentHistory(userId, limit)
 * Returns the last N payments for a user, newest first.
 */
export async function getPaymentHistory(userId, limit = 10) {
  return Payment.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean();
}

// ── Webhook handling ──────────────────────────────────────────

/**
 * constructWebhookEvent(rawBody, signature)
 * Verifies the Stripe signature and returns the event object.
 * Throws if signature is invalid.
 */
export function constructWebhookEvent(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not set');
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

/**
 * handleWebhookEvent(event)
 * Processes a verified Stripe webhook event.
 * All DB writes; no HTTP.
 */
export async function handleWebhookEvent(event) {
  switch (event.type) {

    case 'checkout.session.completed':
      await onCheckoutCompleted(event.data.object);
      break;

    case 'customer.subscription.updated':
      await onSubscriptionUpdated(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await onSubscriptionDeleted(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await onInvoicePaid(event.data.object);
      break;

    case 'invoice.payment_failed':
      await onInvoiceFailed(event.data.object);
      break;

    default:
      // Unhandled event — ignore
      break;
  }
}

// ── Webhook helpers ───────────────────────────────────────────

async function onCheckoutCompleted(session) {
  if (session.mode !== 'subscription') return;

  const userId = session.metadata?.userId;
  if (!userId) return;

  const stripeSubscription = await getStripe().subscriptions.retrieve(session.subscription);
  const planId = stripeSubscription.metadata?.planId ?? session.metadata?.planId ?? 'free';

  await upsertSubscription(userId, stripeSubscription, planId);
}

async function onSubscriptionUpdated(stripeSub) {
  const userId = stripeSub.metadata?.userId;
  if (!userId) {
    // Look up by stripeSubscriptionId instead
    const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
    if (!sub) return;
    const planId = resolvePlanFromPriceId(stripeSub.items.data[0]?.price?.id);
    await upsertSubscription(String(sub.user), stripeSub, planId);
    return;
  }
  const planId = resolvePlanFromPriceId(stripeSub.items.data[0]?.price?.id);
  await upsertSubscription(userId, stripeSub, planId);
}

async function onSubscriptionDeleted(stripeSub) {
  const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSub.id });
  if (!sub) return;

  sub.plan              = 'free';
  sub.status            = 'canceled';
  sub.cancelAtPeriodEnd = false;
  sub.canceledAt        = new Date();
  sub.stripeSubscriptionId = null;
  sub.stripePriceId     = null;
  sub.currentPeriodEnd  = null;
  await sub.save();
}

async function onInvoicePaid(invoice) {
  const customerId = invoice.customer;
  if (!customerId) return;

  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;

  await Payment.create({
    user:                  user._id,
    stripeInvoiceId:       invoice.id,
    stripePaymentIntentId: invoice.payment_intent ?? null,
    stripeChargeId:        invoice.charge ?? null,
    amount:                invoice.amount_paid,
    currency:              invoice.currency,
    status:                'succeeded',
    description:           invoice.description ?? 'Subscription payment',
    periodStart:           invoice.period_start ? new Date(invoice.period_start * 1000) : null,
    periodEnd:             invoice.period_end   ? new Date(invoice.period_end   * 1000) : null,
    invoiceUrl:            invoice.hosted_invoice_url ?? null,
    receiptUrl:            invoice.invoice_pdf        ?? null,
  });
}

async function onInvoiceFailed(invoice) {
  const sub = await Subscription.findOne({ stripeCustomerId: invoice.customer });
  if (sub) {
    sub.status = 'past_due';
    await sub.save();
  }
}

// ── Internal helpers ──────────────────────────────────────────

async function upsertSubscription(userId, stripeSub, planId) {
  const status = mapStripeStatus(stripeSub.status);

  await Subscription.findOneAndUpdate(
    { user: userId },
    {
      user:                 userId,
      plan:                 planId,
      status,
      stripeCustomerId:     stripeSub.customer,
      stripeSubscriptionId: stripeSub.id,
      stripePriceId:        stripeSub.items.data[0]?.price?.id ?? null,
      currentPeriodStart:   new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd:     new Date(stripeSub.current_period_end   * 1000),
      cancelAtPeriodEnd:    stripeSub.cancel_at_period_end ?? false,
      trialEnd:             stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
    },
    { upsert: true, new: true },
  );
}

function mapStripeStatus(stripeStatus) {
  const map = {
    active:            'active',
    trialing:          'trialing',
    past_due:          'past_due',
    canceled:          'canceled',
    unpaid:            'past_due',
    incomplete:        'incomplete',
    incomplete_expired:'inactive',
    paused:            'inactive',
  };
  return map[stripeStatus] ?? 'inactive';
}

function resolvePlanFromPriceId(priceId) {
  if (!priceId) return 'free';
  for (const [id, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId && plan.stripePriceId === priceId) return id;
  }
  return 'free';
}
