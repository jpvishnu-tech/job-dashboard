import Notification   from '../models/Notification.js';
import { pushNotification } from './socket.service.js';

/**
 * createNotification — persist + push in one call.
 * `data` is optional extra context (jobId, applicationId, etc.).
 */
export async function createNotification(userId, { type, title, message, data = {} }) {
  const doc = await Notification.create({ user: userId, type, title, message, data });
  pushNotification(doc).catch(() => {});   // fire-and-forget; never block the caller
  return doc;
}

/**
 * getUserNotifications — paginated, optionally filtered to unread only.
 * Returns { notifications, total, page, pages }.
 */
export async function getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const filter = { user: userId };
  if (unreadOnly) filter.read = false;

  const skip  = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ user: userId, read: false });
}

export async function markRead(userId, notificationId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true, readAt: new Date() },
    { new: true },
  );
}

export async function markAllRead(userId) {
  return Notification.updateMany(
    { user: userId, read: false },
    { read: true, readAt: new Date() },
  );
}

export async function clearNotifications(userId) {
  return Notification.deleteMany({ user: userId });
}
