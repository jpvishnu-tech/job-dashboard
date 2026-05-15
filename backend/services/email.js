/**
 * email.js — nodemailer transport layer
 * ─────────────────────────────────────────────────────────────
 * Responsibilities:
 *   sendMail({ to, subject, html })         — send to a single recipient
 *   sendMailToAdmins({ subject, html })     — fan-out to all admin users in DB
 *
 * Configuration (env vars):
 *   SMTP_HOST   smtp.gmail.com | smtp.sendgrid.net | …
 *   SMTP_PORT   587 (STARTTLS, recommended) | 465 (SSL)
 *   SMTP_USER   your Gmail / SMTP username
 *   SMTP_PASS   Gmail App Password — spaces are stripped automatically
 *   EMAIL_FROM  "JobHub" <noreply@example.com>
 *
 * When SMTP_HOST is not set every call is a silent no-op so the app
 * continues to work in test environments without a mail server.
 */

import nodemailer from 'nodemailer';
import User       from '../models/User.js';

// ── Transport (lazy singleton) ─────────────────────────────────

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.SMTP_HOST) return null;

  // Gmail App Passwords are displayed with spaces for readability
  // (e.g. "abcd efgh ijkl mnop") — strip them before handing to nodemailer.
  const pass = (process.env.SMTP_PASS ?? '').replace(/\s/g, '');

  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === '465',   // true = SSL, false = STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass,
    },
    // Increase connection timeout for slow SMTP servers
    connectionTimeout: 10_000,
    greetingTimeout:   10_000,
  });

  return _transporter;
}

// ── Primary send helper ────────────────────────────────────────

/**
 * sendMail({ to, subject, html })
 *
 * Fire-and-forget safe — always returns a resolved Promise.
 * Call without `await` and chain `.catch(console.error)` in controllers.
 *
 * @param {string} to      – recipient email address
 * @param {string} subject – email subject line
 * @param {string} html    – rendered HTML from templates.js
 */
export async function sendMail({ to, subject, html }) {
  const t = getTransporter();

  if (!t) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[email] SMTP not configured — skipping: "${subject}" → ${to}`);
    }
    return;
  }

  const from = process.env.EMAIL_FROM || '"JobHub" <noreply@jobhub.io>';

  try {
    const info = await t.sendMail({ from, to, subject, html });
    console.log(`[email] ✓ Sent "${subject}" → ${to}  (msgId: ${info.messageId})`);
  } catch (err) {
    // Re-throw so the `.catch()` in the controller can log the real error
    console.error(`[email] ✗ Failed "${subject}" → ${to}: ${err.message}`);
    throw err;
  }
}

// ── Admin fan-out helper ───────────────────────────────────────

/**
 * sendMailToAdmins({ subject, html })
 *
 * Queries the DB for all admin users and sends the same email to each.
 * Fire-and-forget safe — always returns a resolved Promise.
 *
 * Falls back to ADMIN_EMAIL env var if no admins are found in the DB
 * (useful during the very first setup before any admin is created).
 */
export async function sendMailToAdmins({ subject, html }) {
  try {
    let adminEmails = [];

    // Primary source: admins stored in MongoDB
    const admins = await User.find({ role: 'admin' }).select('email').lean();
    adminEmails = admins.map((a) => a.email);

    // Fallback: ADMIN_EMAIL env var (comma-separated)
    if (adminEmails.length === 0 && process.env.ADMIN_EMAIL) {
      adminEmails = process.env.ADMIN_EMAIL.split(',').map((e) => e.trim()).filter(Boolean);
    }

    if (adminEmails.length === 0) {
      console.log(`[email] sendMailToAdmins: no admin recipients found for "${subject}"`);
      return;
    }

    // Send in parallel — fire-and-forget per recipient
    await Promise.allSettled(
      adminEmails.map((to) =>
        sendMail({ to, subject, html }).catch((err) =>
          console.error(`[email] admin fan-out failed → ${to}: ${err.message}`)
        )
      )
    );
  } catch (err) {
    console.error(`[email] sendMailToAdmins error: ${err.message}`);
  }
}

// ── SMTP health check ──────────────────────────────────────────

/**
 * verifySmtp()
 * Returns { ok: true } or { ok: false, error: string }.
 * Used by the admin test-email endpoint.
 */
export async function verifySmtp() {
  const t = getTransporter();
  if (!t) return { ok: false, error: 'SMTP_HOST is not configured' };

  try {
    await t.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
