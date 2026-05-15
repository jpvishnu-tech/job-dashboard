/**
 * user.controller.js
 * ─────────────────────────────────────────────────────────────
 * HTTP handlers for user profile and application tracker routes.
 *
 * Email notifications fired here (all fire-and-forget):
 *   createApplication  → applicationConfirmation to user
 *                      → adminNewApplication to all admins
 *   updateApplication  → interviewUpdate to user  (status → 'interview')
 *                      → offerReceived   to user  (status → 'offer')
 */

import * as userService      from '../services/user.service.js';
import * as appService       from '../services/application.service.js';
import * as analyticsService from '../services/analytics.service.js';
import Application           from '../models/Application.js';
import Job                   from '../models/Job.js';
import { sendMail, sendMailToAdmins } from '../services/email.js';
import {
  applicationConfirmation,
  interviewUpdate,
  offerReceived,
  adminNewApplication,
} from '../emails/templates.js';
import { createNotification } from '../services/notification.service.js';

const FRONTEND_URL   = () => process.env.FRONTEND_URL || 'http://localhost:5173';
const DASHBOARD_URL  = () => `${FRONTEND_URL()}/applications`;
const ADMIN_DASH_URL = () => `${FRONTEND_URL()}/admin`;

// ── Profile ───────────────────────────────────────────────────

export async function getProfile(req, res) {
  res.json({ success: true, user: req.user });
}

export async function updateProfile(req, res) {
  const user = await userService.updateProfile(req.user._id, req.body);

  analyticsService.track(analyticsService.EVENT_TYPES.PROFILE_UPDATED, {
    user: req.user._id,
    ip:   req.ip,
  });

  res.json({ success: true, user });
}

// ── Applications ──────────────────────────────────────────────

export async function listApplications(req, res) {
  const result = await appService.listApplications(req.user._id, req.query);
  res.json({ success: true, ...result });
}

export async function getApplicationStats(req, res) {
  const stats = await appService.getApplicationStats(req.user._id);
  res.json({ success: true, data: stats });
}

export async function createApplication(req, res) {
  const application = await appService.createApplication(req.user._id, req.body);

  // Send HTTP response immediately — emails are fire-and-forget below
  res.status(201).json({ success: true, data: application });

  // ── Confirmation to the user ─────────────────────────────
  sendMail({
    to: req.user.email,
    ...applicationConfirmation({
      userName:     req.user.name,
      company:      application.company,
      role:         application.role,
      location:     application.location || '',
      appliedAt:    application.appliedAt,
      dashboardUrl: DASHBOARD_URL(),
    }),
  }).catch((err) => console.error('[email] app-confirmation failed:', err.message));

  // ── Admin notification ────────────────────────────────────
  Application.countDocuments({ user: req.user._id }).then((totalApps) => {
    sendMailToAdmins({
      ...adminNewApplication({
        userName:         req.user.name,
        userEmail:        req.user.email,
        company:          application.company,
        role:             application.role,
        totalApps,
        adminDashboardUrl: ADMIN_DASH_URL(),
      }),
    }).catch((err) => console.error('[email] admin-new-app failed:', err.message));
  }).catch(() => {});

  // ── Notify recruiter of new applicant ────────────────────
  if (req.body.job) {
    Job.findById(req.body.job).select('recruiterOwner title').then((jobDoc) => {
      if (jobDoc?.recruiterOwner) {
        createNotification(jobDoc.recruiterOwner, {
          type:    'application_new',
          title:   'New Application Received',
          message: `${req.user.name} applied for ${jobDoc.title || application.role} at ${application.company}`,
          data:    { applicationId: String(application._id), jobId: String(jobDoc._id) },
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  // ── Analytics ─────────────────────────────────────────────
  analyticsService.track(analyticsService.EVENT_TYPES.APP_CREATED, {
    user:     req.user._id,
    metadata: {
      applicationId: String(application._id),
      company:       application.company,
      role:          application.role,
      jobId:         String(req.body.job ?? ''),
    },
    ip: req.ip,
  });
}

export async function updateApplication(req, res) {
  const { application, prevStatus } = await appService.updateApplication(
    req.user._id,
    req.params.id,
    req.body
  );

  res.json({ success: true, data: application });

  const newStatus = req.body.status;

  // ── Interview notification ─────────────────────────────────
  if (newStatus === 'interview' && prevStatus !== 'interview') {
    sendMail({
      to: req.user.email,
      ...interviewUpdate({
        userName:    req.user.name,
        company:     application.company,
        role:        application.role,
        dashboardUrl: DASHBOARD_URL(),
      }),
    }).catch((err) => console.error('[email] interview-update failed:', err.message));
  }

  // ── Offer notification ─────────────────────────────────────
  if (newStatus === 'offer' && prevStatus !== 'offer') {
    sendMail({
      to: req.user.email,
      ...offerReceived({
        userName:    req.user.name,
        company:     application.company,
        role:        application.role,
        dashboardUrl: DASHBOARD_URL(),
      }),
    }).catch((err) => console.error('[email] offer-received failed:', err.message));
  }

  // ── Real-time notifications for status changes ─────────────
  if (newStatus && newStatus !== prevStatus) {
    const statusMessages = {
      shortlisted: { title: 'Application Shortlisted', message: `Your application for ${application.role} at ${application.company} has been shortlisted!` },
      interview:   { title: 'Interview Scheduled',     message: `You've been invited to interview for ${application.role} at ${application.company}.` },
      offer:       { title: 'Offer Received!',         message: `Congratulations! You received an offer for ${application.role} at ${application.company}.` },
      hired:       { title: 'You\'re Hired!',          message: `Congratulations! You've been hired for ${application.role} at ${application.company}!` },
      rejected:    { title: 'Application Update',      message: `Your application for ${application.role} at ${application.company} was not selected.` },
    };

    const notifType = newStatus === 'offer' ? 'offer_received'
                    : newStatus === 'hired'  ? 'hired'
                    : 'application_status';

    const msgTemplate = statusMessages[newStatus];
    if (msgTemplate) {
      createNotification(req.user._id, {
        type:    notifType,
        title:   msgTemplate.title,
        message: msgTemplate.message,
        data:    { applicationId: req.params.id, company: application.company, role: application.role, status: newStatus },
      }).catch(() => {});
    }

    // ── Analytics ───────────────────────────────────────────
    analyticsService.track(analyticsService.EVENT_TYPES.APP_STATUS_CHANGED, {
      user:     req.user._id,
      metadata: {
        applicationId: req.params.id,
        from:          prevStatus,
        to:            newStatus,
      },
      ip: req.ip,
    });
  }
}

export async function deleteApplication(req, res) {
  await appService.deleteApplication(req.user._id, req.params.id);

  analyticsService.track(analyticsService.EVENT_TYPES.APP_DELETED, {
    user:     req.user._id,
    metadata: { applicationId: req.params.id },
    ip:       req.ip,
  });

  res.json({ success: true, message: 'Application deleted' });
}

// ── Personal analytics ─────────────────────────────────────────

export async function getUserActivity(req, res) {
  const days   = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  const funnel = await analyticsService.getUserFunnel(req.user._id, days);
  res.json({ success: true, data: { funnel, days } });
}
