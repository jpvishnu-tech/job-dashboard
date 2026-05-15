/**
 * Email templates
 * ─────────────────────────────────────────────────────────────
 * Every function returns { subject, html }.
 * HTML uses table-based layout + inline CSS for broad email-client
 * compatibility (Gmail, Outlook, Apple Mail, mobile).
 *
 * Templates:
 *   welcomeEmail            – sent to user on sign-up
 *   loginAlert              – sent to user on every sign-in (opt-in)
 *   applicationConfirmation – sent to user when they track an application
 *   interviewUpdate         – sent to user when status → interview
 *   offerReceived           – sent to user when status → offer
 *   passwordReset           – sent to user for forgot-password flow
 *   adminNewUser            – sent to admins when a new account is created
 *   adminNewApplication     – sent to admins when a user tracks a new app
 */

// ── Design tokens ─────────────────────────────────────────────
const C = {
  primary:  '#6366f1',
  dark:     '#4f46e5',
  bg:       '#f1f5f9',
  surface:  '#ffffff',
  text:     '#1e293b',
  muted:    '#64748b',
  border:   '#e2e8f0',
  green:    '#22c55e',
  blue:     '#3b82f6',
  amber:    '#f59e0b',
  red:      '#ef4444',
  purple:   '#8b5cf6',
};

// ── Shared primitives ─────────────────────────────────────────

function wrap(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="max-width:560px;background:${C.surface};border-radius:12px;
                    border:1px solid ${C.border};box-shadow:0 4px 20px rgba(0,0,0,.07);">
        <tr>
          <td style="background:${C.primary};border-radius:12px 12px 0 0;padding:20px 32px;">
            <span style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-.02em;">⚡ JobHub</span>
          </td>
        </tr>
        <tr><td style="padding:32px 32px 24px;">${content}</td></tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid ${C.border};">
            <p style="margin:0;color:${C.muted};font-size:12px;line-height:1.6;">
              You're receiving this because you have a JobHub account.
              If you didn't expect this email, you can safely ignore it.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h1(text) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${C.text};line-height:1.3;">${text}</h1>`;
}

function p(text, style = '') {
  return `<p style="margin:0 0 0;color:${C.muted};font-size:15px;line-height:1.7;${style}">${text}</p>`;
}

function btn(href, label, color = C.primary) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
    <tr>
      <td style="background:${color};border-radius:8px;">
        <a href="${href}"
           style="display:inline-block;padding:13px 28px;color:#fff;font-size:14px;
                  font-weight:700;text-decoration:none;border-radius:8px;
                  font-family:'Helvetica Neue',Arial,sans-serif;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function infoTable(rows) {
  const cells = rows
    .map(([label, value]) => `<tr>
      <td style="padding:7px 0;color:${C.muted};font-size:13px;width:130px;vertical-align:top;">${label}</td>
      <td style="padding:7px 0;color:${C.text};font-size:13px;font-weight:600;">${value}</td>
    </tr>`)
    .join('');
  return `<table cellpadding="0" cellspacing="0"
           style="background:${C.bg};border-radius:8px;padding:14px 18px;
                  width:100%;border:1px solid ${C.border};margin:20px 0 0;">
    <tbody>${cells}</tbody>
  </table>`;
}

function badge(text, color) {
  return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;
                 background:${color}22;color:${color};font-size:12px;font-weight:700;">
    ${text}
  </span>`;
}

function divider() {
  return `<hr style="margin:24px 0;border:none;border-top:1px solid ${C.border};"/>`;
}

// ── Template 1 — Welcome ──────────────────────────────────────

/**
 * welcomeEmail({ userName, loginUrl })
 * Triggered: POST /api/auth/register (new account created)
 */
export function welcomeEmail({ userName, loginUrl }) {
  const content = `
    ${h1('Welcome to JobHub! 🎉')}
    <div style="height:10px;"></div>
    ${p(`Hi <strong>${userName}</strong>, your account is ready. Start tracking your job search,
         analysing your resume with AI, and landing your next role.`)}
    ${divider()}
    <table cellpadding="0" cellspacing="0" width="100%">
      ${featureRow('📋', 'Track Applications', 'Log every application, status change, and note in one place.')}
      ${featureRow('🤖', 'AI Resume Analysis', 'Get an ATS score and tailored recommendations in seconds.')}
      ${featureRow('📊', 'Progress Dashboard', 'Visualise your funnel from pending → offer at a glance.')}
    </table>
    ${btn(loginUrl, 'Go to Dashboard')}
  `;
  return { subject: 'Welcome to JobHub — you\'re all set!', html: wrap(content) };
}

function featureRow(icon, title, desc) {
  return `<tr>
    <td style="padding:8px 0;vertical-align:top;width:36px;font-size:20px;">${icon}</td>
    <td style="padding:8px 0 8px 8px;">
      <p style="margin:0;font-size:14px;font-weight:700;color:${C.text};">${title}</p>
      <p style="margin:2px 0 0;font-size:13px;color:${C.muted};">${desc}</p>
    </td>
  </tr>`;
}

// ── Template 2 — Login alert ──────────────────────────────────

/**
 * loginAlert({ userName, ip, userAgent, loginTime, settingsUrl })
 * Triggered: POST /api/auth/login (opt-in via SEND_LOGIN_ALERTS=true)
 */
export function loginAlert({ userName, ip = 'unknown', userAgent = 'unknown', loginTime, settingsUrl }) {
  const time = new Date(loginTime).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
  const content = `
    ${h1('New sign-in detected 🔐')}
    <div style="height:10px;"></div>
    ${p(`Hi <strong>${userName}</strong>, a new sign-in to your JobHub account was just recorded.`)}
    ${infoTable([
      ['Time',       time],
      ['IP address', ip],
      ['Device',     userAgent.length > 60 ? userAgent.slice(0, 60) + '…' : userAgent],
    ])}
    <div style="margin:20px 0 0;padding:14px 18px;background:#fef9c3;border-radius:8px;border:1px solid #fde68a;">
      <p style="margin:0;font-size:13px;color:#854d0e;line-height:1.6;">
        ⚠️ If this wasn't you, secure your account immediately by changing your password.
      </p>
    </div>
    ${btn(settingsUrl || '#', 'Review Account Settings', C.blue)}
  `;
  return { subject: 'New sign-in to your JobHub account', html: wrap(content) };
}

// ── Template 3 — Application confirmation ────────────────────

/**
 * applicationConfirmation({ userName, company, role, location, appliedAt, dashboardUrl })
 * Triggered: POST /api/users/applications
 */
export function applicationConfirmation({ userName, company, role, location, appliedAt, dashboardUrl }) {
  const date = new Date(appliedAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  const content = `
    ${h1('Application saved ✅')}
    <div style="height:10px;"></div>
    ${p(`Hi <strong>${userName}</strong>, your application has been saved to your JobHub dashboard.`)}
    ${infoTable([
      ['Company',    company],
      ['Role',       role],
      ['Location',   location || 'Not specified'],
      ['Applied on', date],
      ['Status',     badge('Pending', C.amber)],
    ])}
    ${p('We\'ll notify you whenever your application status changes.', 'margin-top:16px;')}
    ${btn(dashboardUrl, 'View Dashboard')}
  `;
  return {
    subject: `Application saved — ${role} at ${company}`,
    html: wrap(content),
  };
}

// ── Template 4 — Interview update ────────────────────────────

/**
 * interviewUpdate({ userName, company, role, dashboardUrl })
 * Triggered: PUT /api/users/applications/:id  status → 'interview'
 */
export function interviewUpdate({ userName, company, role, dashboardUrl }) {
  const content = `
    ${h1('Interview stage reached 🎉')}
    <div style="height:10px;"></div>
    ${p(`Hi <strong>${userName}</strong>, your application for <strong>${role}</strong> at
         <strong>${company}</strong> has moved to the ${badge('Interview', C.blue)} stage.`)}
    ${infoTable([
      ['Company',    company],
      ['Role',       role],
      ['New status', badge('Interview', C.blue)],
    ])}
    ${p('Head to your dashboard to add notes or update the status if things progress.', 'margin-top:16px;')}
    ${btn(dashboardUrl, 'View Application', C.blue)}
  `;
  return {
    subject: `Interview stage reached — ${role} at ${company}`,
    html: wrap(content),
  };
}

// ── Template 5 — Offer received ──────────────────────────────

/**
 * offerReceived({ userName, company, role, dashboardUrl })
 * Triggered: PUT /api/users/applications/:id  status → 'offer'
 */
export function offerReceived({ userName, company, role, dashboardUrl }) {
  const content = `
    ${h1('You received an offer! 🏆')}
    <div style="height:10px;"></div>
    ${p(`Congratulations <strong>${userName}</strong>! Your application for
         <strong>${role}</strong> at <strong>${company}</strong> has reached the
         ${badge('Offer', C.green)} stage. Well done!`)}
    ${infoTable([
      ['Company',    company],
      ['Role',       role],
      ['Status',     badge('Offer', C.green)],
    ])}
    ${p('Take your time to review the offer. Log any notes in your dashboard to keep track of the details.', 'margin-top:16px;')}
    ${btn(dashboardUrl, 'View Offer Details', C.green)}
  `;
  return {
    subject: `🏆 Offer received — ${role} at ${company}`,
    html: wrap(content),
  };
}

// ── Template 6 — Password reset ──────────────────────────────

/**
 * passwordReset({ userName, resetUrl, expiresInMinutes })
 * Triggered: POST /api/auth/forgot-password
 */
export function passwordReset({ userName, resetUrl, expiresInMinutes = 60 }) {
  const content = `
    ${h1('Reset your password 🔑')}
    <div style="height:10px;"></div>
    ${p(`Hi <strong>${userName}</strong>, we received a request to reset your JobHub password.
         The link below expires in <strong>${expiresInMinutes} minutes</strong>.`)}
    ${btn(resetUrl, 'Reset Password')}
    ${p(`If the button doesn't work, copy and paste this link:<br/>
         <a href="${resetUrl}" style="color:${C.primary};font-size:12px;word-break:break-all;">${resetUrl}</a>`,
       'margin-top:20px;')}
    <div style="margin:20px 0 0;padding:14px 18px;background:#fef9c3;border-radius:8px;border:1px solid #fde68a;">
      <p style="margin:0;font-size:13px;color:#854d0e;">
        ⚠️ If you didn't request a password reset, ignore this email. Your password will not change.
      </p>
    </div>
  `;
  return { subject: 'Reset your JobHub password', html: wrap(content) };
}

// ── Template 7 — Admin: new user registered ───────────────────

/**
 * adminNewUser({ newUserName, newUserEmail, totalUsers, adminDashboardUrl })
 * Triggered: POST /api/auth/register or /api/auth/firebase (new account)
 */
export function adminNewUser({ newUserName, newUserEmail, totalUsers, adminDashboardUrl }) {
  const content = `
    ${h1('New user registered 👤')}
    <div style="height:10px;"></div>
    ${p('A new account was just created on JobHub.')}
    ${infoTable([
      ['Name',        newUserName],
      ['Email',       newUserEmail],
      ['Total users', String(totalUsers)],
      ['Registered',  new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })],
    ])}
    ${btn(adminDashboardUrl, 'Open Admin Dashboard', C.purple)}
  `;
  return {
    subject: `New user registered — ${newUserName}`,
    html: wrap(content),
  };
}

// ── Template 8a — Recruiter: interview scheduled ──────────────

/**
 * interviewScheduled({ applicantName, recruiterName, jobTitle, company,
 *                       scheduledAt, durationMinutes, type, meetingLink,
 *                       location, dashboardUrl })
 * Triggered: POST /api/recruiter/interviews
 */
export function interviewScheduled({
  applicantName, recruiterName, jobTitle, company,
  scheduledAt, durationMinutes = 60, type = 'video',
  meetingLink = '', location = '', dashboardUrl,
}) {
  const dateStr = new Date(scheduledAt).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  const typeLabels = {
    phone: 'Phone call', video: 'Video call',
    onsite: 'On-site', technical: 'Technical round', panel: 'Panel interview',
  };
  const typeLabel = typeLabels[type] ?? type;

  const locationRow = meetingLink
    ? ['Meeting link', `<a href="${meetingLink}" style="color:#6366f1;">${meetingLink}</a>`]
    : location
    ? ['Location', location]
    : null;

  const rows = [
    ['Company',  company],
    ['Role',     jobTitle],
    ['Format',   typeLabel],
    ['When',     dateStr],
    ['Duration', `${durationMinutes} minutes`],
    ...(locationRow ? [locationRow] : []),
    ['Scheduled by', recruiterName],
  ];

  const content = `
    ${h1('Interview scheduled! 📅')}
    <div style="height:10px;"></div>
    ${p(`Hi <strong>${applicantName}</strong>, great news! You've been invited to an interview
         for <strong>${jobTitle}</strong> at <strong>${company}</strong>.`)}
    ${infoTable(rows)}
    ${p('Please confirm your availability and prepare thoroughly. Good luck!', 'margin-top:16px;')}
    ${btn(dashboardUrl, 'View in Dashboard', C.blue)}
  `;
  return {
    subject: `Interview scheduled — ${jobTitle} at ${company}`,
    html: wrap(content),
  };
}

// ── Template 8b — Recruiter: welcome new recruiter ────────────

/**
 * recruiterWelcome({ recruiterName, companyName, dashboardUrl })
 * Triggered when admin sets a user's role to 'recruiter'.
 */
export function recruiterWelcome({ recruiterName, dashboardUrl }) {
  const content = `
    ${h1('You now have Recruiter access 🎯')}
    <div style="height:10px;"></div>
    ${p(`Hi <strong>${recruiterName}</strong>, your JobHub account has been upgraded to
         <strong>Recruiter</strong> status.`)}
    ${divider()}
    <table cellpadding="0" cellspacing="0" width="100%">
      ${featureRow('🏢', 'Company Profile', 'Set up your company to attract the right candidates.')}
      ${featureRow('📋', 'Post Jobs', 'Create and manage job listings on the JobHub board.')}
      ${featureRow('👥', 'ATS Pipeline', 'Track applicants — shortlist, interview, hire.')}
      ${featureRow('📅', 'Interview Scheduling', 'Schedule interviews and notify candidates automatically.')}
    </table>
    ${btn(dashboardUrl, 'Open Recruiter Portal')}
  `;
  return {
    subject: 'You now have Recruiter access on JobHub',
    html: wrap(content),
  };
}

// ── Template 8 — Admin: new application tracked ───────────────

/**
 * adminNewApplication({ userName, userEmail, company, role, totalApps, adminDashboardUrl })
 * Triggered: POST /api/users/applications
 */
export function adminNewApplication({ userName, userEmail, company, role, totalApps, adminDashboardUrl }) {
  const content = `
    ${h1('New application tracked 📋')}
    <div style="height:10px;"></div>
    ${p(`A user just tracked a new job application.`)}
    ${infoTable([
      ['User',          `${userName} (${userEmail})`],
      ['Company',       company],
      ['Role',          role],
      ['Total apps',    String(totalApps)],
      ['Tracked at',    new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })],
    ])}
    ${btn(adminDashboardUrl, 'Open Admin Dashboard', C.purple)}
  `;
  return {
    subject: `New application — ${role} at ${company}`,
    html: wrap(content),
  };
}
