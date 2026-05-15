/**
 * Stripe routes — mounted at /api/stripe
 *
 * IMPORTANT: The webhook route at POST /webhook uses express.raw() middleware
 * so Stripe's signature verification receives the raw body (not parsed JSON).
 * This MUST be declared before the express.json() call in server.js — see the
 * comment there for the ordering requirement.
 */

import { Router }   from 'express';
import express      from 'express';
import { protectAny } from '../middleware/auth.js';
import * as ctrl    from '../controllers/payment.controller.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────
// GET /api/stripe/plans  — no auth required (pricing page can be public)
router.get('/plans', ctrl.getPlans);

// ── Webhook (raw body REQUIRED — no auth middleware) ──────────
// Stripe sends a POST with Content-Type: application/json but we MUST NOT
// parse it with express.json() — raw body is needed for signature verification.
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  ctrl.handleWebhook,
);

// ── Protected ─────────────────────────────────────────────────
router.use(protectAny);

router.get('/subscription',    ctrl.getSubscription);
router.get('/payments',        ctrl.getPaymentHistory);
router.post('/checkout',       ctrl.createCheckout);
router.post('/billing-portal', ctrl.createBillingPortal);

export default router;
