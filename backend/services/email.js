import nodemailer from 'nodemailer';

/**
 * email.js
 * ─────────────────────────────────────────────────────────────
 * Thin wrapper around nodemailer.  Reads SMTP credentials from
 * environment variables.  When SMTP_HOST is not set (e.g. in
 * test environments) every send is a no-op so the rest of the
 * app continues to work without a real mail server.
 *
 * Required env vars:
 *   SMTP_HOST   smtp.gmail.com | smtp.sendgrid.net | …
 *   SMTP_PORT   587 (STARTTLS) | 465 (SSL)
 *   SMTP_USER   your SMTP username / address
 *   SMTP_PASS   your SMTP password / API key
 *
 * Optional:
 *   EMAIL_FROM  "JobHub" <noreply@example.com>
 *   FRONTEND_URL  https://yourdomain.com  (used in reset links)
 */

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * sendMail({ to, subject, html })
 *
 * Fire-and-forget safe — always returns a resolved promise so
 * callers can use `.catch(console.error)` without crashing the
 * request if SMTP is misconfigured.
 */
export async function sendMail({ to, subject, html }) {
  const t = getTransporter();

  if (!t) {
    console.log(`[email] SMTP not configured — skipping: "${subject}" → ${to}`);
    return;
  }

  const from = process.env.EMAIL_FROM || '"JobHub" <noreply@jobhub.io>';

  await t.sendMail({ from, to, subject, html });
  console.log(`[email] Sent: "${subject}" → ${to}`);
}
