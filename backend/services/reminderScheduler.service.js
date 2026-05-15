/**
 * reminderScheduler.service.js
 * ─────────────────────────────────────────────────────────────────────────
 * Periodic automation checks via node-cron:
 *
 *   Every 5 min  — fire due reminders (→ createNotification + mark sent)
 *   Every hour   — auto-create 24h-before interview reminders
 *
 * Started by server.js alongside the job aggregation scheduler.
 */

import cron from 'node-cron';
import {
  processDueReminders,
  autoCreateInterviewReminders,
} from './automation.service.js';

let _reminderTask  = null;
let _interviewTask = null;

function run(label, fn) {
  fn()
    .then(r  => console.log(`[reminder-scheduler] ${label}:`, r))
    .catch(e => console.error(`[reminder-scheduler] ${label} error:`, e.message));
}

export function startReminderScheduler() {
  if (_reminderTask) return;

  // Every 5 minutes — fire due reminders
  _reminderTask = cron.schedule('*/5 * * * *', () => run('due-reminders', processDueReminders), {
    scheduled: true,
    timezone:  'UTC',
  });

  // Every hour — auto-create interview reminders for next 24h
  _interviewTask = cron.schedule('0 * * * *', () => run('interview-reminders', autoCreateInterviewReminders), {
    scheduled: true,
    timezone:  'UTC',
  });

  console.log('[reminder-scheduler] Started — due-reminders every 5min, interview-reminders every hour (UTC)');
}

export function stopReminderScheduler() {
  if (_reminderTask)  { _reminderTask.stop();  _reminderTask  = null; }
  if (_interviewTask) { _interviewTask.stop(); _interviewTask = null; }
  console.log('[reminder-scheduler] Stopped');
}
