/**
 * auth.controller.js
 * ─────────────────────────────────────────────────────────────
 * HTTP handlers for authentication routes.
 *
 * Email notifications fired here (all fire-and-forget):
 *   register      → welcomeEmail to user + adminNewUser to all admins
 *   login         → loginAlert to user  (only when SEND_LOGIN_ALERTS=true)
 *   firebaseAuth  → loginAlert to user  (only when SEND_LOGIN_ALERTS=true)
 *   forgotPassword→ passwordReset to user
 */

import * as authService      from '../services/auth.service.js';
import * as analyticsService from '../services/analytics.service.js';
import { sendMail, sendMailToAdmins } from '../services/email.js';
import User from '../models/User.js';
import { getSubscription } from '../services/payment.service.js';
import { getPlan } from '../config/plans.js';
import {
  welcomeEmail,
  loginAlert,
  passwordReset    as passwordResetTpl,
  adminNewUser,
} from '../emails/templates.js';

const FRONTEND_URL   = () => process.env.FRONTEND_URL  || 'http://localhost:5173';
const ADMIN_DASH_URL = () => `${FRONTEND_URL()}/admin`;
const LOGIN_ALERTS   = () => process.env.SEND_LOGIN_ALERTS === 'true';

function sendToken(user, statusCode, res) {
  const token = authService.signJwt(user._id);
  res.status(statusCode).json({ success: true, token, user });
}

// ── POST /api/auth/register ───────────────────────────────────
export async function register(req, res) {
  const { name, email, password } = req.body;
  const user = await authService.registerUser({ name, email, password });

  analyticsService.track(analyticsService.EVENT_TYPES.USER_REGISTER, {
    user:      user._id,
    metadata:  { email },
    ip:        req.ip,
    userAgent: req.get('user-agent'),
  });

  // ── Welcome email to the new user ─────────────────────────
  sendMail({
    to:      user.email,
    ...welcomeEmail({ userName: user.name, loginUrl: `${FRONTEND_URL()}/login` }),
  }).catch((err) => console.error('[email] welcome failed:', err.message));

  // ── Notify all admins of the new signup ───────────────────
  User.countDocuments().then((totalUsers) => {
    sendMailToAdmins({
      ...adminNewUser({
        newUserName:     user.name,
        newUserEmail:    user.email,
        totalUsers,
        adminDashboardUrl: ADMIN_DASH_URL(),
      }),
    }).catch((err) => console.error('[email] admin new-user failed:', err.message));
  }).catch(() => {});

  sendToken(user, 201, res);
}

// ── POST /api/auth/login ──────────────────────────────────────
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await authService.loginUser({ email, password });

  analyticsService.track(analyticsService.EVENT_TYPES.USER_LOGIN, {
    user:      user._id,
    metadata:  { method: 'email' },
    ip:        req.ip,
    userAgent: req.get('user-agent'),
  });

  // ── Login alert (opt-in) ───────────────────────────────────
  if (LOGIN_ALERTS()) {
    sendMail({
      to: user.email,
      ...loginAlert({
        userName:    user.name,
        ip:          req.ip,
        userAgent:   req.get('user-agent') || 'unknown',
        loginTime:   new Date(),
        settingsUrl: `${FRONTEND_URL()}/settings`,
      }),
    }).catch((err) => console.error('[email] login-alert failed:', err.message));
  }

  sendToken(user, 200, res);
}

// ── GET /api/auth/me ──────────────────────────────────────────
export async function me(req, res) {
  // Include subscription plan so the frontend can gate premium features
  const sub  = await getSubscription(req.user._id).catch(() => null);
  const plan = getPlan(sub?.plan ?? 'free');

  res.json({
    success: true,
    user: req.user,
    subscription: {
      plan:              sub?.plan      ?? 'free',
      status:            sub?.status    ?? 'active',
      planName:          plan.name,
      features:          plan.features,
      currentPeriodEnd:  sub?.currentPeriodEnd  ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    },
  });
}

// ── POST /api/auth/logout ─────────────────────────────────────
export async function logout(req, res) {
  analyticsService.track(analyticsService.EVENT_TYPES.USER_LOGOUT, {
    user: req.user._id,
    ip:   req.ip,
  });
  res.json({ success: true, message: 'Logged out successfully' });
}

// ── POST /api/auth/firebase ───────────────────────────────────
export async function firebaseAuth(req, res) {
  const fbUser  = await authService.verifyFirebaseToken(req.body.idToken);
  const isNew   = !(await authService.userExistsByFirebaseUid(fbUser.localId, fbUser.email));
  const user    = await authService.loginOrCreateFirebaseUser(fbUser);

  analyticsService.track(analyticsService.EVENT_TYPES.USER_LOGIN, {
    user:      user._id,
    metadata:  { method: 'firebase' },
    ip:        req.ip,
    userAgent: req.get('user-agent'),
  });

  // Welcome email for brand-new Firebase accounts
  if (isNew) {
    sendMail({
      to: user.email,
      ...welcomeEmail({ userName: user.name, loginUrl: `${FRONTEND_URL()}/dashboard` }),
    }).catch((err) => console.error('[email] firebase welcome failed:', err.message));

    User.countDocuments().then((totalUsers) => {
      sendMailToAdmins({
        ...adminNewUser({
          newUserName:      user.name,
          newUserEmail:     user.email,
          totalUsers,
          adminDashboardUrl: ADMIN_DASH_URL(),
        }),
      }).catch(() => {});
    }).catch(() => {});
  } else if (LOGIN_ALERTS()) {
    sendMail({
      to: user.email,
      ...loginAlert({
        userName:    user.name,
        ip:          req.ip,
        userAgent:   req.get('user-agent') || 'unknown',
        loginTime:   new Date(),
        settingsUrl: `${FRONTEND_URL()}/settings`,
      }),
    }).catch((err) => console.error('[email] firebase login-alert failed:', err.message));
  }

  sendToken(user, 200, res);
}

// ── POST /api/auth/supabase ───────────────────────────────────
export async function supabaseAuth(req, res) {
  const sbUser = await authService.verifySupabaseToken(req.body.access_token);
  const isNew  = !(await authService.userExistsBySupabaseUid(sbUser.sub, sbUser.email));
  const user   = await authService.loginOrCreateSupabaseUser(sbUser);

  analyticsService.track(analyticsService.EVENT_TYPES.USER_LOGIN, {
    user:      user._id,
    metadata:  { method: 'supabase' },
    ip:        req.ip,
    userAgent: req.get('user-agent'),
  });

  if (isNew) {
    sendMail({
      to: user.email,
      ...welcomeEmail({ userName: user.name, loginUrl: `${FRONTEND_URL()}/dashboard` }),
    }).catch((err) => console.error('[email] supabase welcome failed:', err.message));

    User.countDocuments().then((totalUsers) => {
      sendMailToAdmins({
        ...adminNewUser({
          newUserName:       user.name,
          newUserEmail:      user.email,
          totalUsers,
          adminDashboardUrl: ADMIN_DASH_URL(),
        }),
      }).catch(() => {});
    }).catch(() => {});
  } else if (LOGIN_ALERTS()) {
    sendMail({
      to: user.email,
      ...loginAlert({
        userName:    user.name,
        ip:          req.ip,
        userAgent:   req.get('user-agent') || 'unknown',
        loginTime:   new Date(),
        settingsUrl: `${FRONTEND_URL()}/settings`,
      }),
    }).catch((err) => console.error('[email] supabase login-alert failed:', err.message));
  }

  sendToken(user, 200, res);
}

// ── POST /api/auth/forgot-password ────────────────────────────
export async function forgotPassword(req, res) {
  const result = await authService.forgotPassword(req.body.email);

  if (result) {
    const resetUrl = `${FRONTEND_URL()}/reset-password?token=${result.plainToken}`;
    sendMail({
      to:      result.user.email,
      ...passwordResetTpl({ userName: result.user.name, resetUrl, expiresInMinutes: 60 }),
    }).catch((err) => console.error('[email] password-reset failed:', err.message));
  }

  // Always 200 — prevents email enumeration
  res.json({
    success: true,
    message: 'If that email is registered you will receive a reset link shortly.',
  });
}

// ── POST /api/auth/reset-password ─────────────────────────────
export async function resetPassword(req, res) {
  await authService.resetPassword({
    token:       req.body.token,
    newPassword: req.body.password,
  });
  res.json({ success: true, message: 'Password updated successfully.' });
}
