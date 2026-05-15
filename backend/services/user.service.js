/**
 * user.service.js
 * ─────────────────────────────────────────────────────────────
 * Business logic for user profile management.
 */

import User     from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';

// ── Profile ───────────────────────────────────────────────────

/**
 * updateProfile(userId, { name, avatar })
 * Updates mutable profile fields and returns the updated user.
 */
export async function updateProfile(userId, updates) {
  const ALLOWED = ['name', 'avatar'];
  const safe    = Object.fromEntries(
    Object.entries(updates).filter(([k, v]) => ALLOWED.includes(k) && v !== undefined)
  );

  if (Object.keys(safe).length === 0) {
    throw ApiError.badRequest('No valid fields provided');
  }

  const user = await User.findByIdAndUpdate(userId, safe, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

// ── Admin user management ──────────────────────────────────────

/**
 * listUsers({ search, role, page, limit })
 * Admin: paginated user listing with optional search and role filter.
 */
export async function listUsers({ search, role, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) filter.role = role;

  const base = User.find(filter).sort({ createdAt: -1 });
  return paginate(base, User.countDocuments(filter), { page, limit: Math.min(100, Number(limit) || 20) });
}

/**
 * setUserRole(adminId, targetId, role)
 * Admin: change a user's role.
 * Prevents an admin from changing their own role.
 */
export async function setUserRole(adminId, targetId, role) {
  if (String(adminId) === String(targetId)) {
    throw ApiError.badRequest('Cannot change your own role');
  }
  const user = await User.findByIdAndUpdate(
    targetId,
    { role },
    { new: true, runValidators: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

/**
 * deleteUser(adminId, targetId)
 * Admin: hard-delete a user.
 * Prevents self-deletion.
 */
export async function deleteUser(adminId, targetId) {
  if (String(adminId) === String(targetId)) {
    throw ApiError.badRequest('Cannot delete your own account');
  }
  const user = await User.findByIdAndDelete(targetId);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}
