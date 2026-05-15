import jwt                  from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User                 from '../models/User.js';
import asyncHandler         from '../utils/asyncHandler.js';

/**
 * protect — verifies the JWT in the Authorization header and attaches
 * the decoded user to req.user.
 *
 *   Authorization: Bearer <token>
 */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token — please log in' });
  }

  const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  const user    = await User.findById(decoded.id).select('-password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'User no longer exists' });
  }

  req.user = user;
  next();
});

/**
 * adminOnly — must be used after `protect` or `protectAny`.
 * Blocks non-admin users with 403.
 */
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

/**
 * recruiterOnly — must be used after `protect` or `protectAny`.
 * Allows recruiters AND admins (admins can always act as recruiter).
 */
export function recruiterOnly(req, res, next) {
  if (req.user?.role !== 'recruiter' && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Recruiter access required' });
  }
  next();
}

/**
 * optionalAuth — like protectAny but never rejects.
 * Sets req.user if a valid token is present; otherwise req.user stays null.
 * Use for routes that have richer behaviour when authenticated but are
 * also accessible to unauthenticated users (e.g. GET /api/jobs/recommended).
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  const token = header.slice(7);

  // Try Express JWT first
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (user) { req.user = user; return next(); }
  } catch { /* fall through */ }

  // Try Firebase ID token
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return next();

  try {
    const fbRes  = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) },
    );
    const fbData = await fbRes.json();
    if (fbRes.ok && fbData.users?.[0]) {
      const { localId, email } = fbData.users[0];
      const user = await User.findOne({ $or: [{ firebaseUid: localId }, { email: email?.toLowerCase() }] }).select('-password');
      if (user) req.user = user;
    }
  } catch { /* swallow — proceed unauthenticated */ }

  next();
});

/**
 * validate — reads express-validator's result and returns 422 with structured
 * field errors if any rules failed.  Place this after each validation chain.
 */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors:  result.array().map((e) => ({ field: e.path, message: e.msg })),
  });
}

/**
 * protectAny — accepts EITHER an Express JWT or a Firebase ID token.
 *
 * Try order:
 *   1. JWT (cheap, no network call)
 *   2. Firebase ID token via identitytoolkit REST API
 *
 * On success attaches the MongoDB user document to req.user and calls next().
 */
export const protectAny = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token — please log in' });
  }

  const token = header.slice(7);

  // ── 1. Try Express JWT ────────────────────────────────────────
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user;
      return next();
    }
  } catch {
    // Not a valid JWT — fall through to Firebase
  }

  // ── 2. Try Firebase ID token ──────────────────────────────────
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }

  let firebaseUser;
  try {
    const fbRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken: token }),
      },
    );
    const fbData = await fbRes.json();
    if (!fbRes.ok || !fbData.users?.[0]) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token — please log in again' });
    }
    firebaseUser = fbData.users[0];
  } catch {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }

  const { localId, email } = firebaseUser;
  const user = await User.findOne({
    $or: [{ firebaseUid: localId }, { email: email?.toLowerCase() }],
  }).select('-password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Account not found — please register through the app first',
    });
  }

  req.user = user;
  next();
});
