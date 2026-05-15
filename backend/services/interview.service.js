/**
 * interview.service.js
 * Interview scheduling, retrieval, and lifecycle management.
 */

import Interview   from '../models/Interview.js';
import Application from '../models/Application.js';
import Job         from '../models/Job.js';
import User        from '../models/User.js';
import ApiError    from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';

// ── Create ────────────────────────────────────────────────────────────────

/**
 * scheduleInterview(recruiterId, data)
 * Creates an Interview document.
 * Verifies that the recruiter owns the job attached to the application.
 */
export async function scheduleInterview(recruiterId, {
  applicationId, scheduledAt, durationMinutes = 60,
  type = 'video', meetingLink = '', location = '', notes = '',
}) {
  const app = await Application.findById(applicationId).populate('job');
  if (!app) throw ApiError.notFound('Application not found');

  if (app.job && String(app.job.recruiterOwner) !== String(recruiterId)) {
    throw ApiError.forbidden('You do not own this job posting');
  }

  // Ensure no duplicate active interview for this application
  const existing = await Interview.findOne({
    application: applicationId,
    status:      { $in: ['scheduled', 'rescheduled'] },
  });
  if (existing) {
    throw ApiError.conflict('An active interview already exists for this application. Cancel it first.');
  }

  const interview = await Interview.create({
    application:     applicationId,
    job:             app.job?._id ?? null,
    applicant:       app.user,
    recruiter:       recruiterId,
    company:         app.job?.companyRef ?? null,
    scheduledAt,
    durationMinutes,
    type,
    meetingLink,
    location,
    notes,
  });

  // Advance application to interview status
  if (app.status !== 'interview') {
    app.status = 'interview';
    app.statusHistory.push({ status: 'interview', changedAt: new Date(), note: 'Interview scheduled' });
    await app.save();
  }

  return interview;
}

// ── Read ──────────────────────────────────────────────────────────────────

/**
 * listInterviews(recruiterId, { status, page, limit })
 */
export async function listInterviews(recruiterId, { status, page = 1, limit = 20 } = {}) {
  const filter = { recruiter: recruiterId };
  if (status) filter.status = status;

  const base = Interview.find(filter)
    .populate('applicant', 'name email avatar')
    .populate('job',       'title company')
    .sort({ scheduledAt: 1 }); // soonest first

  return paginate(base, Interview.countDocuments(filter), { page, limit });
}

/**
 * getInterview(recruiterId, interviewId)
 */
export async function getInterview(recruiterId, interviewId) {
  const interview = await Interview.findOne({ _id: interviewId, recruiter: recruiterId })
    .populate('applicant', 'name email avatar')
    .populate('job',       'title company location')
    .populate('company',   'name logo');

  if (!interview) throw ApiError.notFound('Interview not found or access denied');
  return interview;
}

// ── Update ────────────────────────────────────────────────────────────────

/**
 * updateInterview(recruiterId, interviewId, fields)
 * Allowed updates: schedule, type, link, notes, feedback, status.
 */
export async function updateInterview(recruiterId, interviewId, fields) {
  const ALLOWED = ['scheduledAt', 'durationMinutes', 'type', 'meetingLink', 'location', 'notes', 'feedback', 'status'];
  const safe = Object.fromEntries(
    Object.entries(fields).filter(([k]) => ALLOWED.includes(k))
  );

  if (safe.status === 'rescheduled' && !safe.scheduledAt) {
    throw ApiError.badRequest('Provide a new scheduledAt when rescheduling');
  }

  const interview = await Interview.findOneAndUpdate(
    { _id: interviewId, recruiter: recruiterId },
    safe,
    { new: true, runValidators: true }
  );
  if (!interview) throw ApiError.notFound('Interview not found or access denied');
  return interview;
}

/**
 * cancelInterview(recruiterId, interviewId)
 */
export async function cancelInterview(recruiterId, interviewId) {
  const interview = await Interview.findOneAndUpdate(
    { _id: interviewId, recruiter: recruiterId },
    { status: 'cancelled', cancelledAt: new Date() },
    { new: true }
  );
  if (!interview) throw ApiError.notFound('Interview not found or access denied');
  return interview;
}

/**
 * markEmailSent(interviewId)
 */
export async function markEmailSent(interviewId) {
  await Interview.findByIdAndUpdate(interviewId, { emailSent: true });
}
