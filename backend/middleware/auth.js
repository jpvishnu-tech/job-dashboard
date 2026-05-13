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
 * adminOnly — must be used after `protect`.
 * Blocks non-admin users with 403.
 */
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

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
