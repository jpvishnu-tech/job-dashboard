/**
 * Email templates — inline-CSS HTML that renders well across
 * all major email clients (Gmail, Outlook, Apple Mail).
 *
 * Each function returns { subject, html }.
 */

// ── Shared design tokens ────────────────────────────────────────
const PRIMARY   = '#6366f1';
const BG        = '#f1f5f9';
const SURFACE   = '#ffffff';
const TEXT      = '#1e293b';
const MUTED     = '#64748b';
const BORDER    = '#e2e8f0';
const GREEN     = '#22c55e';
const BLUE      = '#3b82f6';
const AMBER     = '#f59e0b';

function base(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>JobHub</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:${BG};padding:40px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:560px;background:${SURFACE};border-radius:12px;
                    border:1px solid ${BORDER};box-shadow:0 4px 16px rgba(0,0,0,.08);">

        <!-- Header bar -->
        <tr>
          <td style="background:${PRIMARY};border-radius:12px 12px 0 0;padding:22px 32px;">
            <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-.02em;">
              ⚡ JobHub
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:32px 32px 24px;">${content}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid ${BORDER};">
            <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">
              You're receiving this email because you have a JobHub account.<br/>
              If you didn't expect this, you can safely ignore it.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(href, text, color = PRIMARY) {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0 0;">
    <tr>
      <td style="background:${color};border-radius:8px;">
        <a href="${href}" style="display:inline-block;padding:12px 24px;color:#fff;
                  font-size:14px;font-weight:700;text-decoration:none;
                  border-radius:8px;font-family:'Helvetica Neue',Arial,sans-serif;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:6px 0;color:${MUTED};font-size:13px;width:120px;">${label}</td>
    <td style="padding:6px 0;color:${TEXT};font-size:13px;font-weight:600;">${value}</td>
  </tr>`;
}

// ── Template 1: Application confirmation ────────────────────────
export function applicationConfirmation({ userName, company, role, location, appliedAt, dashboardUrl }) {
  const date = new Date(appliedAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${TEXT};">
      Application received ✅
    </h1>
    <p style="margin:0 0 24px;color:${MUTED};font-size:15px;line-height:1.6;">
      Hi ${userName}, your application has been saved to your JobHub dashboard.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation"
           style="background:${BG};border-radius:8px;padding:16px 20px;width:100%;
                  border:1px solid ${BORDER};margin-bottom:8px;">
      <tbody>
        ${infoRow('Company', company)}
        ${infoRow('Role', role)}
        ${infoRow('Location', location || 'Not specified')}
        ${infoRow('Applied on', date)}
        ${infoRow('Status', '<span style="color:' + AMBER + ';">Pending</span>')}
      </tbody>
    </table>

    <p style="margin:20px 0 0;color:${MUTED};font-size:14px;line-height:1.6;">
      We'll notify you whenever your application status changes.
      You can also track all your applications from your dashboard.
    </p>

    ${btn(dashboardUrl, 'View Dashboard')}
  `;

  return {
    subject: `Application saved — ${role} at ${company}`,
    html: base(content),
  };
}

// ── Template 2: Interview stage update ──────────────────────────
export function interviewUpdate({ userName, company, role, dashboardUrl }) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${TEXT};">
      Interview stage reached 🎉
    </h1>
    <p style="margin:0 0 24px;color:${MUTED};font-size:15px;line-height:1.6;">
      Hi ${userName}, your application for <strong>${role}</strong> at
      <strong>${company}</strong> has moved to the <strong>Interview</strong> stage.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation"
           style="background:${BG};border-radius:8px;padding:16px 20px;width:100%;
                  border:1px solid ${BORDER};margin-bottom:8px;">
      <tbody>
        ${infoRow('Company', company)}
        ${infoRow('Role', role)}
        ${infoRow('New status', '<span style="color:' + BLUE + ';font-weight:700;">Interview</span>')}
      </tbody>
    </table>

    <p style="margin:20px 0 0;color:${MUTED};font-size:14px;line-height:1.6;">
      Head to your dashboard to review details, add notes, or update the status
      if things progress further.
    </p>

    ${btn(dashboardUrl, 'View Application', BLUE)}
  `;

  return {
    subject: `Interview stage — ${role} at ${company}`,
    html: base(content),
  };
}

// ── Template 3: Password reset ───────────────────────────────────
export function passwordReset({ userName, resetUrl, expiresInMinutes = 60 }) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${TEXT};">
      Reset your password 🔐
    </h1>
    <p style="margin:0 0 24px;color:${MUTED};font-size:15px;line-height:1.6;">
      Hi ${userName}, we received a request to reset your JobHub password.
      Click the button below — the link expires in ${expiresInMinutes} minutes.
    </p>

    ${btn(resetUrl, 'Reset Password')}

    <p style="margin:24px 0 0;color:${MUTED};font-size:13px;line-height:1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color:${PRIMARY};word-break:break-all;">${resetUrl}</a>
    </p>

    <p style="margin:20px 0 0;padding:16px;background:#fef9c3;border-radius:8px;
              color:#854d0e;font-size:13px;line-height:1.6;">
      ⚠️ If you didn't request a password reset, you can safely ignore this email.
      Your password will not change.
    </p>
  `;

  return {
    subject: 'Reset your JobHub password',
    html: base(content),
  };
}
