import asyncHandler from 'express-async-handler';
import * as notificationService from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const page       = Math.max(1, parseInt(req.query.page)  || 1);
  const limit      = Math.min(50, parseInt(req.query.limit) || 20);
  const unreadOnly = req.query.unreadOnly === 'true';

  const result = await notificationService.getUserNotifications(req.user._id, { page, limit, unreadOnly });
  res.json({ success: true, ...result });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  res.json({ success: true, count });
});

export const markRead = asyncHandler(async (req, res) => {
  const doc = await notificationService.markRead(req.user._id, req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, notification: doc });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  res.json({ success: true });
});

export const clearNotifications = asyncHandler(async (req, res) => {
  await notificationService.clearNotifications(req.user._id);
  res.json({ success: true });
});
