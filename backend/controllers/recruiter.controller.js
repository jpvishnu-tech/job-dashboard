/**
 * recruiter.controller.js
 * HTTP handlers for the Recruiter Portal.
 */

import * as companyService    from '../services/company.service.js';
import * as recruiterService  from '../services/recruiter.service.js';
import * as interviewService  from '../services/interview.service.js';
import { sendMail }           from '../services/email.js';
import { interviewScheduled } from '../emails/templates.js';
import { createNotification } from '../services/notification.service.js';

const FRONTEND_URL = () => process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Company ───────────────────────────────────────────────────────────────

export async function getCompany(req, res) {
  const company = await companyService.getCompanyByRecruiter(req.user._id);
  res.json({ success: true, data: company });
}

export async function createCompany(req, res) {
  const company = await companyService.createCompany(req.user._id, req.body);
  res.status(201).json({ success: true, data: company });
}

export async function updateCompany(req, res) {
  const company = await companyService.updateCompany(req.user._id, req.body);
  res.json({ success: true, data: company });
}

// ── Jobs ──────────────────────────────────────────────────────────────────

export async function listJobs(req, res) {
  const result = await recruiterService.listRecruiterJobs(req.user._id, req.query);
  res.json({ success: true, ...result });
}

export async function createJob(req, res) {
  const company = await companyService.getCompanyByRecruiter(req.user._id);
  const job = await recruiterService.createRecruiterJob(req.user._id, company?._id ?? null, req.body);
  res.status(201).json({ success: true, data: job });
}

export async function getJob(req, res) {
  const job = await recruiterService.getRecruiterJob(req.user._id, req.params.id);
  res.json({ success: true, data: job });
}

export async function updateJob(req, res) {
  const job = await recruiterService.updateRecruiterJob(req.user._id, req.params.id, req.body);
  res.json({ success: true, data: job });
}

export async function setJobStatus(req, res) {
  const { isActive } = req.body;
  const job = await recruiterService.setJobStatus(req.user._id, req.params.id, Boolean(isActive));
  res.json({ success: true, data: job });
}

export async function deleteJob(req, res) {
  const job = await recruiterService.deleteRecruiterJob(req.user._id, req.params.id);
  res.json({ success: true, message: 'Job removed', data: job });
}

// ── Applicants ────────────────────────────────────────────────────────────

export async function listApplicants(req, res) {
  const result = await recruiterService.listJobApplicants(req.user._id, req.params.jobId, req.query);
  res.json({ success: true, ...result });
}

export async function getApplicantDetail(req, res) {
  const detail = await recruiterService.getApplicantDetail(req.user._id, req.params.appId);
  res.json({ success: true, data: detail });
}

export async function updateApplicantStatus(req, res) {
  const { status, note } = req.body;
  const { application, prevStatus } = await recruiterService.updateApplicantStatus(
    req.user._id,
    req.params.appId,
    status,
    note,
  );
  res.json({ success: true, data: application, prevStatus });

  // Notify the applicant of the status change
  if (status && status !== prevStatus && application.user) {
    const statusMessages = {
      shortlisted: { title: 'Application Shortlisted',  message: `Your application for ${application.role} at ${application.company} has been shortlisted.` },
      interview:   { title: 'Interview Invitation',     message: `You've been selected for an interview for ${application.role} at ${application.company}.` },
      offer:       { title: 'Offer Received!',          message: `Congratulations! You received an offer for ${application.role} at ${application.company}.` },
      hired:       { title: 'You\'re Hired!',           message: `Congratulations! You've been hired for ${application.role} at ${application.company}!` },
      rejected:    { title: 'Application Update',       message: `Your application for ${application.role} at ${application.company} was not selected.` },
    };

    const notifType = status === 'offer' ? 'offer_received'
                    : status === 'hired'  ? 'hired'
                    : 'application_status';

    const msgTemplate = statusMessages[status];
    if (msgTemplate) {
      createNotification(application.user, {
        type:    notifType,
        title:   msgTemplate.title,
        message: msgTemplate.message,
        data:    { applicationId: String(application._id), company: application.company, role: application.role, status },
      }).catch(() => {});
    }
  }
}

// ── Interviews ────────────────────────────────────────────────────────────

export async function listInterviews(req, res) {
  const result = await interviewService.listInterviews(req.user._id, req.query);
  res.json({ success: true, ...result });
}

export async function scheduleInterview(req, res) {
  const interview = await interviewService.scheduleInterview(req.user._id, req.body);
  res.status(201).json({ success: true, data: interview });

  // Fire-and-forget email to applicant
  const populated = await interview.populate([
    { path: 'applicant', select: 'name email' },
    { path: 'job',       select: 'title company' },
  ]);

  if (populated.applicant?.email) {
    sendMail({
      to: populated.applicant.email,
      ...interviewScheduled({
        applicantName: populated.applicant.name,
        recruiterName: req.user.name,
        jobTitle:      populated.job?.title ?? 'the position',
        company:       populated.job?.company ?? req.user.name,
        scheduledAt:   interview.scheduledAt,
        durationMinutes: interview.durationMinutes,
        type:          interview.type,
        meetingLink:   interview.meetingLink,
        location:      interview.location,
        dashboardUrl:  `${FRONTEND_URL()}/applications`,
      }),
    })
      .then(() => interviewService.markEmailSent(interview._id))
      .catch(err => console.error('[email] interview-scheduled failed:', err.message));
  }

  // Real-time notification to applicant
  if (populated.applicant?._id) {
    const jobTitle = populated.job?.title ?? 'the position';
    const company  = populated.job?.company ?? '';
    createNotification(populated.applicant._id, {
      type:    'interview_scheduled',
      title:   'Interview Scheduled',
      message: `An interview has been scheduled for ${jobTitle}${company ? ' at ' + company : ''}.`,
      data:    { interviewId: String(interview._id), applicationId: String(interview.application) },
    }).catch(() => {});
  }
}

export async function getInterview(req, res) {
  const interview = await interviewService.getInterview(req.user._id, req.params.id);
  res.json({ success: true, data: interview });
}

export async function updateInterview(req, res) {
  const interview = await interviewService.updateInterview(req.user._id, req.params.id, req.body);
  res.json({ success: true, data: interview });

  // Notify applicant of reschedule
  if (interview.applicant) {
    createNotification(interview.applicant, {
      type:    'interview_updated',
      title:   'Interview Rescheduled',
      message: 'Your interview has been updated. Please check your dashboard for the new details.',
      data:    { interviewId: String(interview._id) },
    }).catch(() => {});
  }
}

export async function cancelInterview(req, res) {
  const interview = await interviewService.cancelInterview(req.user._id, req.params.id);
  res.json({ success: true, data: interview });

  // Notify applicant of cancellation
  if (interview.applicant) {
    createNotification(interview.applicant, {
      type:    'interview_cancelled',
      title:   'Interview Cancelled',
      message: 'Your scheduled interview has been cancelled. The recruiter may be in touch to reschedule.',
      data:    { interviewId: String(interview._id) },
    }).catch(() => {});
  }
}

// ── Analytics ─────────────────────────────────────────────────────────────

export async function getAnalytics(req, res) {
  const data = await recruiterService.getRecruiterAnalytics(req.user._id);
  res.json({ success: true, data });
}
