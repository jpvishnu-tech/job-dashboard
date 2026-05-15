/**
 * Auth routes
 * ─────────────────────────────────────────────────────────────
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 * POST /api/auth/logout
 * POST /api/auth/firebase   — exchange Firebase ID token for backend JWT
 * POST /api/auth/supabase   — exchange Supabase access token for backend JWT
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password
 */

import express      from 'express';
import { body }     from 'express-validator';
import asyncHandler from '../utils/asyncHandler.js';
import { protect, protectAny, validate } from '../middleware/auth.js';
import * as ctrl    from '../controllers/auth.controller.js';

const router = express.Router();

// ── Validation chains ─────────────────────────────────────────

const vRegister = [
  body('name').trim().notEmpty().withMessage('Name is required')
              .isLength({ max: 80 }).withMessage('Name cannot exceed 80 characters'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const vLogin = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const vFirebase = [
  body('idToken').notEmpty().withMessage('Firebase ID token is required'),
];

const vSupabase = [
  body('access_token').notEmpty().withMessage('Supabase access token is required'),
];

const vForgotPw = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
];

const vResetPw = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

// ── Routes ────────────────────────────────────────────────────

router.post('/register',       vRegister, validate, asyncHandler(ctrl.register));
router.post('/login',          vLogin,    validate, asyncHandler(ctrl.login));
router.get ('/me',             protectAny,          asyncHandler(ctrl.me));
router.post('/logout',         protect,             asyncHandler(ctrl.logout));
router.post('/firebase',       vFirebase, validate, asyncHandler(ctrl.firebaseAuth));
router.post('/supabase',       vSupabase, validate, asyncHandler(ctrl.supabaseAuth));
router.post('/forgot-password', vForgotPw, validate, asyncHandler(ctrl.forgotPassword));
router.post('/reset-password',  vResetPw,  validate, asyncHandler(ctrl.resetPassword));

export default router;
