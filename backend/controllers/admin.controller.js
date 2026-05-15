/**
 * admin.controller.js
 * ─────────────────────────────────────────────────────────────
 * HTTP handlers for the admin dashboard.
 */

import User        from '../models/User.js';
import Job         from '../models/Job.js';
import Application from '../models/Application.js';
import Resume      from '../models/Resume.js';
import * as userService      from '../services/user.service.js';
import * as analyticsService from '../services/analytics.service.js';
import { sendMail, verifySmtp } from '../services/email.js';
import { recruiterWelcome }    from '../emails/templates.js';

// ── GET /api/admin/stats ──────────────────────────────────────
export async function getStats(req, res) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    userCount,
    adminCount,
    activeJobCount,
    inactiveJobCount,
    applicationCount,
    resumeCount,
    appsByStatus,
    jobsByType,
    recentUsers,
    recentApps,
    timelineRaw,
    analyticsOverview,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    Job.countDocuments({ isActive: true }),
    Job.countDocuments({ isActive: false }),
    Application.countDocuments(),
    Resume.countDocuments(),
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    User.find().sort({ createdAt: -1 }).limit(5)
        .select('name email role createdAt avatar'),
    Application.find().sort({ appliedAt: -1 }).limit(5)
        .select('company role status appliedAt user')
        .populate('user', 'name email'),
    Application.aggregate([
      { $match: { appliedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id:        { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
          total:      { $sum: 1 },
          interviews: {
            $sum: { $cond: [{ $in: ['$status', ['interview', 'offer']] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    analyticsService.getAdminOverview(30),
  ]);

  const statusMap = { pending: 0, interview: 0, offer: 0, rejected: 0 };
  appsByStatus.forEach(({ _id, count }) => { statusMap[_id] = count; });

  const typeMap = {};
  jobsByType.forEach(({ _id, count }) => { typeMap[_id] = count; });

  res.json({
    success: true,
    data: {
      users:        { total: userCount, admins: adminCount, regular: userCount - adminCount },
      jobs:         { active: activeJobCount, inactive: inactiveJobCount, total: activeJobCount + inactiveJobCount },
      applications: { total: applicationCount, byStatus: statusMap },
      resumes:      { total: resumeCount },
      jobsByType:   typeMap,
      timeline:     timelineRaw,
      recentUsers,
      recentApps,
      analytics:    analyticsOverview,
    },
  });
}

// ── User management ───────────────────────────────────────────

export async function listUsers(req, res) {
  const result = await userService.listUsers(req.query);
  res.json({ success: true, ...result });
}

export async function updateUserRole(req, res) {
  const user = await userService.setUserRole(req.user._id, req.params.id, req.body.role);
  res.json({ success: true, data: user });

  // Fire recruiter welcome email when promoted to recruiter (fire-and-forget)
  if (req.body.role === 'recruiter' && user.email) {
    sendMail({
      to: user.email,
      ...recruiterWelcome({
        recruiterName: user.name || user.email,
        dashboardUrl:  (process.env.FRONTEND_URL || 'http://localhost:5173') + '/recruiter',
      }),
    }).catch(err => console.error('[email] recruiter-welcome failed:', err.message));
  }
}

export async function deleteUser(req, res) {
  await userService.deleteUser(req.user._id, req.params.id);
  // Cascade: remove the user's applications
  await Application.deleteMany({ user: req.params.id });
  // Cascade: remove the user's resume document
  await Resume.findOneAndDelete({ user: req.params.id });
  res.json({ success: true, message: 'User deleted' });
}

// ── Analytics ─────────────────────────────────────────────────

export async function getAnalyticsOverview(req, res) {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  const data = await analyticsService.getAdminOverview(days);
  res.json({ success: true, data });
}

export async function getJobAnalytics(req, res) {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  const data = await analyticsService.getJobAnalytics(req.params.id, days);
  res.json({ success: true, data });
}

// ── Email ──────────────────────────────────────────────────────

/**
 * POST /api/admin/email/test
 * Body: { to?: string }  — defaults to the requesting admin's email
 *
 * 1. Verifies the SMTP connection
 * 2. Sends a test email so the admin can confirm delivery
 */
export async function testEmail(req, res) {
  const smtp = await verifySmtp();
  if (!smtp.ok) {
    return res.status(503).json({
      success: false,
      message: `SMTP connection failed: ${smtp.error}`,
    });
  }

  const to = req.body?.to || req.user.email;
  const sentAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium', timeStyle: 'long',
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:40px 16px;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;
         background:#fff;border-radius:12px;border:1px solid #e2e8f0;
         box-shadow:0 4px 20px rgba(0,0,0,.07);">
    <tr>
      <td style="background:#6366f1;border-radius:12px 12px 0 0;padding:20px 32px;">
        <span style="color:#fff;font-size:17px;font-weight:700;">⚡ JobHub</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;">
          SMTP test successful ✅
        </h1>
        <p style="margin:16px 0 0;color:#64748b;font-size:15px;line-height:1.7;">
          Your JobHub email system is configured correctly and this email was
          delivered at <strong>${sentAt}</strong>.
        </p>
        <table cellpadding="0" cellspacing="0"
               style="margin:20px 0 0;background:#f1f5f9;border-radius:8px;
                      padding:14px 18px;width:100%;border:1px solid #e2e8f0;">
          <tr>
            <td style="color:#64748b;font-size:13px;width:120px;">SMTP host</td>
            <td style="color:#1e293b;font-size:13px;font-weight:600;">${process.env.SMTP_HOST}</td>
          </tr>
          <tr>
            <td style="color:#64748b;font-size:13px;padding-top:7px;">SMTP port</td>
            <td style="color:#1e293b;font-size:13px;font-weight:600;padding-top:7px;">${process.env.SMTP_PORT}</td>
          </tr>
          <tr>
            <td style="color:#64748b;font-size:13px;padding-top:7px;">Sender</td>
            <td style="color:#1e293b;font-size:13px;font-weight:600;padding-top:7px;">${process.env.EMAIL_FROM || process.env.SMTP_USER}</td>
          </tr>
          <tr>
            <td style="color:#64748b;font-size:13px;padding-top:7px;">Recipient</td>
            <td style="color:#1e293b;font-size:13px;font-weight:600;padding-top:7px;">${to}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendMail({ to, subject: '⚡ JobHub — SMTP test email', html });

  res.json({
    success: true,
    message: `Test email sent to ${to}`,
    smtp: { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT },
  });
}
