/**
 * analytics.service.js
 * ─────────────────────────────────────────────────────────────
 * Business logic for analytics tracking and reporting.
 * Uses the Analytics model's static helpers where possible.
 */

import mongoose from 'mongoose';
import Analytics, { EVENT_TYPES } from '../models/Analytics.js';

export { EVENT_TYPES };

// ── Write ─────────────────────────────────────────────────────

/**
 * track(event, opts)
 * Fire-and-forget wrapper.  Safe to call without awaiting.
 *
 * @param {string} event   — one of EVENT_TYPES values
 * @param {object} opts    — { user, metadata, ip, userAgent }
 */
export const track = (event, opts = {}) => Analytics.track(event, opts);

// ── Read ──────────────────────────────────────────────────────

/**
 * getUserFunnel(userId, days)
 * Event counts per type for a single user over the last N days.
 */
export async function getUserFunnel(userId, days = 30) {
  return Analytics.funnel(new mongoose.Types.ObjectId(userId), days);
}

/**
 * getAdminOverview(days)
 * Aggregate stats used on the admin analytics dashboard.
 * Returns:
 *   - eventCounts:   { 'user.login': 42, … }
 *   - dailyActives:  [ { date: '2025-01-01', users: 5 } ]
 *   - topEvents:     top 10 events by volume
 *   - newUsersToday: count
 */
export async function getAdminOverview(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const [eventCounts, dailyActives, topEvents, newUsersToday] = await Promise.all([
    // Counts per event type
    Analytics.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]),

    // Unique active users per day
    Analytics.aggregate([
      { $match: { createdAt: { $gte: since }, user: { $ne: null } } },
      {
        $group: {
          _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          users: { $addToSet: '$user' },
        },
      },
      { $project: { date: '$_id', users: { $size: '$users' }, _id: 0 } },
      { $sort:    { date: 1 } },
    ]),

    // Top 10 events
    Analytics.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $limit: 10 },
    ]),

    // Registrations today
    Analytics.countDocuments({
      event:     EVENT_TYPES.USER_REGISTER,
      createdAt: { $gte: today },
    }),
  ]);

  const countMap = {};
  eventCounts.forEach(({ _id, count }) => { countMap[_id] = count; });

  return { eventCounts: countMap, dailyActives, topEvents, newUsersToday };
}

/**
 * getJobAnalytics(jobId, days)
 * View and apply counts for a specific job listing.
 */
export async function getJobAnalytics(jobId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const id    = new mongoose.Types.ObjectId(jobId);

  const result = await Analytics.aggregate([
    {
      $match: {
        event:     { $in: [EVENT_TYPES.JOB_VIEW, EVENT_TYPES.APP_CREATED] },
        'metadata.jobId': id.toString(),
        createdAt: { $gte: since },
      },
    },
    { $group: { _id: '$event', count: { $sum: 1 } } },
  ]);

  const views  = result.find(r => r._id === EVENT_TYPES.JOB_VIEW)?.count   ?? 0;
  const applies = result.find(r => r._id === EVENT_TYPES.APP_CREATED)?.count ?? 0;

  return { views, applies, conversionRate: views > 0 ? Math.round(applies / views * 100) : 0 };
}
