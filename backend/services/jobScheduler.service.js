/**
 * jobScheduler.service.js
 * ─────────────────────────────────────────────────────────────────────────
 * Schedules periodic job aggregation syncs using node-cron.
 *
 * Configuration (.env):
 *   JOB_SYNC_CRON   — cron expression (default: "0 *\/6 * * *" = every 6h)
 *   JOB_SYNC_ON_BOOT — "true" to run a sync immediately on server start (default: true)
 *
 * Cron expression cheat-sheet:
 *   "0 *\/6 * * *"   — every 6 hours (recommended for production)
 *   "0 * * * *"     — every hour (development / testing)
 *   "0 0 * * *"     — once a day at midnight
 */

import cron                        from 'node-cron';
import { syncAll, expireOldJobs } from './jobAggregation.service.js';

const DEFAULT_CRON   = '0 */6 * * *'; // every 6 hours
const STARTUP_DELAY  = 10_000;         // 10s after boot before first sync

let _task = null;

async function runSync() {
  console.log('[scheduler] Starting job aggregation sync…');
  try {
    const summary = await syncAll();
    console.log('[scheduler] Sync complete:', JSON.stringify(summary));
    // Expire jobs older than 60 days after every sync
    await expireOldJobs(60);
  } catch (err) {
    console.error('[scheduler] Sync error:', err.message);
  }
}

/**
 * startScheduler()
 * Starts the cron-based periodic sync and (optionally) a boot-time sync.
 * Idempotent — safe to call multiple times.
 */
export function startScheduler() {
  if (_task) return;

  const expression = process.env.JOB_SYNC_CRON ?? DEFAULT_CRON;

  if (!cron.validate(expression)) {
    console.error(`[scheduler] Invalid JOB_SYNC_CRON expression: "${expression}". Using default.`);
  }

  _task = cron.schedule(
    cron.validate(expression) ? expression : DEFAULT_CRON,
    runSync,
    { scheduled: true, timezone: 'UTC' },
  );

  console.log(`[scheduler] Job sync scheduled — cron="${expression}" (UTC)`);

  // Optionally run once on startup
  if (process.env.JOB_SYNC_ON_BOOT !== 'false') {
    setTimeout(runSync, STARTUP_DELAY);
    console.log(`[scheduler] Boot-time sync queued (in ${STARTUP_DELAY / 1000}s)`);
  }
}

/**
 * stopScheduler()
 * Stops the cron task — useful for graceful shutdown or testing.
 */
export function stopScheduler() {
  if (_task) {
    _task.stop();
    _task = null;
    console.log('[scheduler] Stopped');
  }
}
