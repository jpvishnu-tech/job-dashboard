/**
 * jobAggregation.service.js
 * ─────────────────────────────────────────────────────────────────────────
 * Core pipeline for ingesting jobs from external providers into MongoDB.
 *
 * Pipeline:
 *   Provider.sync()  →  normalize  →  validate  →  deduplicate  →  bulkUpsert
 *
 * Deduplication strategy:
 *   Primary:   externalId + source  (provider-assigned ID)
 *   Fallback:  _dedupeHash          (MD5 of title + company + source)
 */

import crypto from 'crypto';
import Job    from '../models/Job.js';

// ── Provider imports ──────────────────────────────────────────────────────
import { RemotiveProvider      } from '../providers/remotive.provider.js';
import { CustomCompanyProvider } from '../providers/customCompany.provider.js';
import { AdzunaProvider        } from '../providers/adzuna.provider.js';
import { RemoteOkProvider      } from '../providers/remoteok.provider.js';
import { GreenhouseProvider    } from '../providers/greenhouse.provider.js';
import { LeverProvider         } from '../providers/lever.provider.js';
import { RapidApiProvider      } from '../providers/rapidapi.provider.js';

// Legacy providers — loaded dynamically; disabled if files don't exist
class DisabledProvider {
  isEnabled() { return false; }
  async sync()      { return []; }
  normalize()       { return null; }
}

let LinkedInProvider = DisabledProvider;
let IndeedProvider   = DisabledProvider;
let NaukriProvider   = DisabledProvider;

try { ({ LinkedInProvider } = await import('../providers/linkedin.provider.js'));  } catch { /* optional */ }
try { ({ IndeedProvider   } = await import('../providers/indeed.provider.js'));    } catch { /* optional */ }
try { ({ NaukriProvider   } = await import('../providers/naukri.provider.js'));    } catch { /* optional */ }

// ── Provider registry ─────────────────────────────────────────────────────

export const PROVIDERS = {
  // ── New real-world providers ────────────────────────────────
  adzuna:     new AdzunaProvider(),
  remoteok:   new RemoteOkProvider(),
  greenhouse: new GreenhouseProvider(),
  lever:      new LeverProvider(),
  rapidapi:   new RapidApiProvider(),

  // ── Original providers ──────────────────────────────────────
  remotive:   new RemotiveProvider(),
  linkedin:   new LinkedInProvider(),
  indeed:     new IndeedProvider(),
  naukri:     new NaukriProvider(),
  custom:     new CustomCompanyProvider(),
};

// ── Internal helpers ──────────────────────────────────────────────────────

function buildDedupeHash(job) {
  const key = [
    job.title.toLowerCase().trim(),
    job.company.toLowerCase().trim(),
    job.source,
  ].join('::');
  return crypto.createHash('md5').update(key).digest('hex');
}

function validateJob(job) {
  return (
    job &&
    typeof job.title   === 'string' && job.title.trim().length   > 0 &&
    typeof job.company === 'string' && job.company.trim().length > 0 &&
    typeof job.url     === 'string' && job.url.trim().length     > 0
  );
}

function buildUpsertOp(job) {
  const hash              = buildDedupeHash(job);
  const doc               = { ...job, _dedupeHash: hash };
  const { postedAt, ...rest } = doc;

  const filter = job.externalId
    ? { externalId: job.externalId, source: job.source }
    : { _dedupeHash: hash };

  return {
    updateOne: {
      filter,
      update: {
        $set:         rest,
        $setOnInsert: { postedAt: postedAt ?? new Date() },
      },
      upsert: true,
    },
  };
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * upsertJobs(normalizedJobs)
 * Validates, deduplicates, and bulk-writes an array of normalised jobs.
 * Returns { inserted, updated, skipped, errors }.
 */
export async function upsertJobs(normalizedJobs) {
  const result = { inserted: 0, updated: 0, skipped: 0, errors: 0 };

  const valid = normalizedJobs.filter(j => {
    if (!validateJob(j)) { result.skipped++; return false; }
    return true;
  });

  if (!valid.length) return result;

  try {
    const res       = await Job.bulkWrite(valid.map(buildUpsertOp), { ordered: false });
    result.inserted = res.upsertedCount;
    result.updated  = res.modifiedCount;
  } catch (err) {
    if (err.code === 11000 && err.result) {
      result.inserted = err.result.upsertedCount ?? 0;
      result.updated  = err.result.modifiedCount ?? 0;
      result.errors   = err.writeErrors?.length   ?? 0;
    } else {
      throw err;
    }
  }

  return result;
}

/**
 * syncProvider(providerName, params)
 * Runs a single named provider through the full pipeline.
 */
export async function syncProvider(providerName, params = {}) {
  const provider = PROVIDERS[providerName];
  if (!provider) throw new Error(`Unknown provider: "${providerName}"`);

  if (!provider.isEnabled()) {
    return { skipped: true, reason: `${providerName} provider is not configured` };
  }

  console.log(`[aggregation] Syncing provider: ${providerName}`);
  const jobs   = await provider.sync(params);
  const result = await upsertJobs(jobs);
  console.log(`[aggregation] ${providerName} → fetched=${jobs.length}`, result);
  return { fetched: jobs.length, ...result };
}

/**
 * syncAll(providerNames?)
 * Runs every enabled provider sequentially and aggregates results.
 * Pass an optional string[] to run a subset of providers.
 */
export async function syncAll(providerNames) {
  const names   = providerNames ?? Object.keys(PROVIDERS);
  const summary = {};

  for (const name of names) {
    const provider = PROVIDERS[name];
    if (!provider) { summary[name] = { error: 'unknown provider' }; continue; }

    if (!provider.isEnabled()) {
      summary[name] = { skipped: true, reason: 'not configured' };
      continue;
    }

    try {
      const jobs     = await provider.sync();
      summary[name]  = { fetched: jobs.length, ...(await upsertJobs(jobs)) };
    } catch (err) {
      console.error(`[aggregation] ${name} sync failed:`, err.message);
      summary[name] = { error: err.message };
    }
  }

  console.log('[aggregation] syncAll complete:', summary);
  return summary;
}

/**
 * normalizeAndImport(rawJobs, providerName)
 * Convenience for the /api/jobs/import endpoint.
 */
export async function normalizeAndImport(rawJobs, providerName = 'custom') {
  const provider   = PROVIDERS[providerName] ?? PROVIDERS.custom;
  const normalized = rawJobs
    .map(raw => { try { return provider.normalize(raw); } catch { return null; } })
    .filter(Boolean);
  return upsertJobs(normalized);
}

/**
 * getProviderStatus()
 * Returns { [name]: { enabled, name } } for all registered providers.
 */
export function getProviderStatus() {
  return Object.fromEntries(
    Object.entries(PROVIDERS).map(([name, p]) => [
      name,
      { name, enabled: p.isEnabled() },
    ])
  );
}

/**
 * expireOldJobs(daysOld = 60)
 * Soft-deletes external jobs older than `daysOld` days.
 */
export async function expireOldJobs(daysOld = 60) {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const res    = await Job.updateMany(
    { external: true, isActive: true, postedAt: { $lt: cutoff } },
    { $set: { isActive: false } }
  );
  console.log(`[aggregation] Expired ${res.modifiedCount} old external jobs (>${daysOld}d)`);
  return res.modifiedCount;
}
