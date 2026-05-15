/**
 * auth.service.js
 * ─────────────────────────────────────────────────────────────
 * Pure business logic for authentication flows.
 * No Express objects (req/res) — only domain data in, domain data out.
 * All HTTP concerns live in auth.controller.js.
 */

import crypto from 'crypto';
import jwt    from 'jsonwebtoken';
import User   from '../models/User.js';
import ApiError from '../utils/ApiError.js';

// ── Token helpers ─────────────────────────────────────────────

export function signJwt(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// ── Firebase ID-token verification (REST, no Admin SDK) ───────

export async function verifyFirebaseToken(idToken) {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) throw ApiError.internal('FIREBASE_API_KEY not configured');

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
    throw ApiError.unauthorized('Invalid or expired Firebase token');
  }
  return data.users[0]; // { localId, email, displayName, photoUrl, … }
}

// ── Core auth operations ──────────────────────────────────────

/**
 * registerUser({ name, email, password })
 * Creates a new User document.
 * Throws 409 if the email already exists.
 */
export async function registerUser({ name, email, password }) {
  if (await User.findOne({ email })) {
    throw ApiError.conflict('Email already registered');
  }
  return User.create({ name, email, password });
}

/**
 * loginUser({ email, password })
 * Returns the user document on success.
 * Throws 401 on bad credentials.
 */
export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  return user;
}

/**
 * userExistsByFirebaseUid(localId, email)
 * Returns true if an account already exists for the given Firebase UID or email.
 * Used in the controller to decide whether to send a welcome email.
 */
export async function userExistsByFirebaseUid(localId, email) {
  const count = await User.countDocuments({
    $or: [
      { firebaseUid: localId },
      { email: email?.toLowerCase() },
    ],
  });
  return count > 0;
}

/**
 * loginOrCreateFirebaseUser(fbUser)
 * Looks up a User by Firebase UID or email, creates one if not found,
 * and links the Firebase UID to existing records.
 */
export async function loginOrCreateFirebaseUser(fbUser) {
  let user = await User.findOne({
    $or: [
      { firebaseUid: fbUser.localId },
      { email: fbUser.email?.toLowerCase() },
    ],
  }).select('+firebaseUid');

  if (!user) {
    user = await User.create({
      firebaseUid: fbUser.localId,
      name:        fbUser.displayName?.trim() || fbUser.email.split('@')[0],
      email:       fbUser.email.toLowerCase(),
      avatar:      fbUser.photoUrl || '',
    });
  } else if (!user.firebaseUid) {
    // Link an existing JWT-only account to Firebase
    user.firebaseUid = fbUser.localId;
    await user.save({ validateBeforeSave: false });
  }

  return user;
}

/**
 * forgotPassword(email)
 * Generates a reset token, stores its hash on the user, and
 * returns the plain token so the caller can email it.
 * Returns null if the email does not exist (to prevent enumeration).
 */
export async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) return null;

  const plain      = crypto.randomBytes(32).toString('hex');
  const hashed     = crypto.createHash('sha256').update(plain).digest('hex');
  const expiresAt  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.resetPasswordToken   = hashed;
  user.resetPasswordExpires = expiresAt;
  await user.save({ validateBeforeSave: false });

  return { user, plainToken: plain };
}

// ── Supabase JWT verification ──────────────────────────────────

/**
 * verifySupabaseToken(accessToken)
 * Verifies a Supabase access token using the project JWT secret.
 * Returns { sub, email, name } on success; throws 401 on failure.
 *
 * SUPABASE_JWT_SECRET: Project Settings → API → JWT Settings → JWT Secret
 */
export async function verifySupabaseToken(accessToken) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) throw ApiError.internal('SUPABASE_JWT_SECRET not configured');
  try {
    const decoded = jwt.verify(accessToken, jwtSecret);
    if (!decoded.sub) throw new Error('Missing sub in token payload');
    return {
      sub:   decoded.sub,
      email: decoded.email || '',
      name:  decoded.user_metadata?.full_name || decoded.user_metadata?.name || '',
    };
  } catch {
    throw ApiError.unauthorized('Invalid or expired Supabase token');
  }
}

export async function userExistsBySupabaseUid(supabaseUid, email) {
  return Boolean(await User.countDocuments({
    $or: [{ supabaseUid }, { email: email?.toLowerCase() }],
  }));
}

/**
 * loginOrCreateSupabaseUser(supabaseUser)
 * Looks up a User by Supabase UID or email, creates one if not found,
 * and links the Supabase UID to existing records.
 */
export async function loginOrCreateSupabaseUser(supabaseUser) {
  let user = await User.findOne({
    $or: [
      { supabaseUid: supabaseUser.sub },
      { email: supabaseUser.email?.toLowerCase() },
    ],
  }).select('+supabaseUid');

  if (!user) {
    user = await User.create({
      supabaseUid: supabaseUser.sub,
      name:        supabaseUser.name || supabaseUser.email.split('@')[0],
      email:       supabaseUser.email.toLowerCase(),
    });
  } else if (!user.supabaseUid) {
    user.supabaseUid = supabaseUser.sub;
    await user.save({ validateBeforeSave: false });
  }

  return user;
}

/**
 * resetPassword({ token, newPassword })
 * Validates the plain token, hashes the new password, clears the
 * reset fields, and saves the user.
 * Throws 400 if the token is invalid or expired.
 */
export async function resetPassword({ token, newPassword }) {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user   = await User.findOne({
    resetPasswordToken:   hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) throw ApiError.badRequest('Reset token is invalid or has expired');

  user.password             = newPassword;
  user.resetPasswordToken   = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return user;
}
