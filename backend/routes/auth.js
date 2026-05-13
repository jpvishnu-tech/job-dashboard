import express       from 'express';
import crypto        from 'crypto';
import jwt           from 'jsonwebtoken';
import { body }      from 'express-validator';
import User          from '../models/User.js';
import asyncHandler  from '../utils/asyncHandler.js';
import { protect, validate } from '../middleware/auth.js';
import { sendMail }  from '../services/email.js';
import { passwordReset as passwordResetTemplate } from '../emails/templates.js';

// ── Firebase ID-token verification (REST, no Admin SDK) ───────
async function verifyFirebaseIdToken(idToken) {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) throw Object.assign(new Error('FIREBASE_API_KEY not configured'), { status: 503 });

  const res  = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ idToken }),
    }
  );
  const data = await res.json();
  if (!res.ok || !data.users?.[0]) {
    throw Object.assign(new Error('Invalid or expired Firebase token'), { status: 401 });
  }
  return data.users[0]; // { localId, email, displayName, emailVerified, … }
}

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sendToken(user, statusCode, res) {
  res.status(statusCode).json({ success: true, token: signToken(user._id), user });
}

// ── Validation chains ─────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
              .isLength({ max: 80 }).withMessage('Name cannot exceed 80 characters'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register', registerRules, validate, asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (await User.findOne({ email })) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({ name, email, password });
  sendToken(user, 201, res);
}));

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', loginRules, validate, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  sendToken(user, 200, res);
}));

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
}));

// ── POST /api/auth/logout ─────────────────────────────────────
router.post('/logout', protect, (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ── POST /api/auth/firebase ───────────────────────────────────
// Exchange a Firebase ID token for a backend JWT.
// Creates a MongoDB user on first sign-in; links existing users by email.
router.post('/firebase',
  [body('idToken').notEmpty().withMessage('Firebase ID token is required')],
  validate,
  asyncHandler(async (req, res) => {
    const fbUser = await verifyFirebaseIdToken(req.body.idToken);
    // fbUser.localId  — Firebase UID (stable unique identifier)
    // fbUser.email    — verified email address
    // fbUser.displayName — set by the client via updateProfile()

    // Look up by UID first, fall back to email so legacy JWT users are linked.
    let user = await User.findOne({
      $or: [
        { firebaseUid: fbUser.localId },
        { email: fbUser.email?.toLowerCase() },
      ],
    }).select('+firebaseUid');

    if (!user) {
      const name = fbUser.displayName?.trim() || fbUser.email.split('@')[0];
      user = await User.create({
        firebaseUid: fbUser.localId,
        name,
        email:  fbUser.email.toLowerCase(),
        avatar: fbUser.photoUrl || '',
        // Firebase users have no backend password.
        // The pre-save hook skips hashing when password is undefined.
      });
    } else if (!user.firebaseUid) {
      // Link an existing JWT-only account to Firebase
      user.firebaseUid = fbUser.localId;
      await user.save({ validateBeforeSave: false });
    }

    sendToken(user, 200, res);
  })
);

// ── POST /api/auth/forgot-password ───────────────────────────
// Always returns 200 regardless of whether the email exists to
// prevent user-enumeration attacks.
router.post('/forgot-password',
  [body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail()],
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      // Generate a random token (plain) — store only its SHA-256 hash
      const plainToken  = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

      user.resetPasswordToken   = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + RESET_TTL_MS);
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${FRONTEND_URL}/reset-password?token=${plainToken}`;
      const { subject, html } = passwordResetTemplate({
        userName:        user.name,
        resetUrl,
        expiresInMinutes: 60,
      });

      sendMail({ to: user.email, subject, html })
        .catch((err) => console.error('[email] forgot-password send failed:', err.message));
    }

    // Always return the same response
    res.json({
      success: true,
      message: 'If that email is registered you will receive a reset link shortly.',
    });
  })
);

// ── POST /api/auth/reset-password ────────────────────────────
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.body.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is invalid or has expired.',
      });
    }

    user.password             = req.body.password; // pre-save hook will hash it
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  })
);
