/**
 * aiShortlistEngine.js
 * ─────────────────────────────────────────────────────────────────────────
 * Orchestrates the full AI shortlisting pipeline:
 *
 *   Resume profile  →  JobMatch scores  →  Scoring engine  →  AI reasons
 *   →  Shortlist upsert  →  Sorted result
 *
 * OpenAI call budget per run:
 *   • Profile extraction:        1 call  (skipped if profile is fresh)
 *   • Per-job match scoring:     1 call each (skipped if JobMatch cache hit)
 *   • Batch reason generation:   1 call for top-10 (skipped if Shortlist cache)
 *
 * Caches (all TTL = 7 days via MongoDB index):
 *   Resume.resumeProfile  →  re-extracted only when resume is re-uploaded
 *   JobMatch              →  7-day TTL, invalidated by new resume upload
 *   Shortlist             →  7-day TTL, invalidated by new resume upload
 */

import Resume    from '../models/Resume.js';
import Job       from '../models/Job.js';
import JobMatch  from '../models/JobMatch.js';
import Shortlist from '../models/Shortlist.js';
import Application from '../models/Application.js';
import { extractText }         from '../utils/resumeParser.js';
import * as aiService          from './ai.service.js';
import * as scoring            from './scoringEngine.js';
import { generateBatchReasons } from './recommendationReasonService.js';

const BATCH_SIZE   = 5;   // parallel OpenAI calls for job matching
const MAX_JOBS     = 60;  // jobs to score per run (limit OpenAI spend)
const MAX_SHORTLIST = 20; // jobs to keep in shortlist
const REASON_BATCH  = 10; // jobs to send for batch reason generation

// ── Internal helpers ──────────────────────────────────────────────────────

async function ensureProfile(resume) {
  const profile = resume.resumeProfile;
  const needsExtract =
    !profile?.extractedAt ||
    (resume.uploadedAt && profile.extractedAt < resume.uploadedAt);

  if (!needsExtract) {
    return typeof profile.toObject === 'function' ? profile.toObject() : profile;
  }

  const resumeText = await extractText(resume);
  const extracted  = await aiService.extractProfile(resumeText);

  await Resume.updateOne(
    { _id: resume._id },
    { resumeProfile: { ...extracted, extractedAt: new Date() } },
  );

  return extracted;
}

async function computeMatchScores(userId, resume, jobs, profile) {
  const jobIds     = jobs.map(j => j._id);
  const cached     = await JobMatch.find({ user: userId, job: { $in: jobIds } }).lean();
  const matchMap   = new Map(cached.map(m => [m.job.toString(), m]));

  const results = [];

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(batch.map(async job => {
      const cached = matchMap.get(job._id.toString());
      if (cached && cached.computedAt > resume.uploadedAt) {
        return { job, matchScore: cached.matchScore, strengths: cached.strengths ?? [] };
      }

      const jobText = [
        job.title,
        job.company,
        (job.description ?? '').slice(0, 800),
        ...(job.requirements ?? []),
      ].join('\n');

      const matchData = await aiService.matchJobFast(profile, jobText);

      await JobMatch.findOneAndUpdate(
        { user: userId, job: job._id },
        { ...matchData, computedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      return { job, matchScore: matchData.matchScore, strengths: matchData.strengths ?? [] };
    }));

    results.push(...batchResults);
  }

  return results;
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * generateShortlist(userId, options)
 * Runs the full pipeline and upserts Shortlist records.
 * Returns sorted shortlist array (populated with job data).
 */
export async function generateShortlist(userId, { forceRefresh = false } = {}) {
  // 1. Load resume
  const resume = await Resume.findOne({ user: userId }).select('+extractedText');
  if (!resume) throw Object.assign(new Error('No resume found. Upload one first.'), { status: 404 });

  // 2. Ensure profile is fresh
  const profile = await ensureProfile(resume);

  // 3. Load active jobs
  const jobs = await Job.find({ isActive: true })
    .select('_id title company companyLogo location type description requirements skills tags remote experienceLevel salary salaryMin postedAt url department')
    .sort({ postedAt: -1 })
    .limit(MAX_JOBS)
    .lean();

  if (!jobs.length) return [];

  // 4. Check for fresh cached shortlist (skip full recompute)
  if (!forceRefresh) {
    const freshCount = await Shortlist.countDocuments({
      user: userId,
      computedAt: { $gte: new Date(Date.now() - 23 * 3600_000) },
    });
    if (freshCount > 5) {
      return getShortlistedJobs(userId);
    }
  }

  // 5. Compute / retrieve match scores in batches
  const withScores = await computeMatchScores(userId, resume, jobs, profile);

  // 6. Run algorithmic scoring engine
  const fullyScored = withScores.map(({ job, matchScore }) => ({
    job,
    ...scoring.scoreJob(profile, job, matchScore),
  }));

  // Sort by overall score, keep top MAX_SHORTLIST
  fullyScored.sort((a, b) => b.overallScore - a.overallScore);
  const top = fullyScored.slice(0, MAX_SHORTLIST);

  // 7. Generate batch AI reasons for the top REASON_BATCH jobs
  const forReasons   = top.slice(0, REASON_BATCH);
  const reasonsInput = forReasons.map(({ job, matchScore }) => ({ ...job, matchScore }));

  let reasonMap = new Map();
  try {
    const reasons = await generateBatchReasons(profile, reasonsInput);
    reasonMap = new Map(reasons.map(r => [r.jobId, r]));
  } catch (err) {
    console.warn('[shortlist] reason generation failed (non-fatal):', err.message);
  }

  // 8. Upsert Shortlist documents
  const upsertOps = top.map(({ job, ...scores }) => {
    const reason = reasonMap.get(String(job._id));
    return {
      updateOne: {
        filter: { user: userId, job: job._id },
        update: {
          $set: {
            ...scores,
            recommendationReason:   reason?.recommendationReason  ?? '',
            careerGrowthPotential:  reason?.careerGrowthPotential ?? '',
            missingSkills:          reason?.missingSkills         ?? [],
            strengths:              reason?.strengths             ?? [],
            resumeVersionAt:        resume.uploadedAt ?? new Date(),
            computedAt:             new Date(),
          },
        },
        upsert: true,
      },
    };
  });

  if (upsertOps.length) await Shortlist.bulkWrite(upsertOps, { ordered: false });

  return getShortlistedJobs(userId);
}

/**
 * getShortlistedJobs(userId, filters)
 * Returns cached shortlist for a user with populated job data.
 */
export async function getShortlistedJobs(userId, {
  priorityLevel,
  remote,
  sort = 'score',
  limit = 30,
} = {}) {
  const query = { user: userId };
  if (priorityLevel) query.priorityLevel = priorityLevel;

  let mongoSort;
  switch (sort) {
    case 'salary':  mongoSort = { salaryRelevanceScore: -1, overallScore: -1 }; break;
    case 'recency': mongoSort = { recencyScore: -1, overallScore: -1 };         break;
    default:        mongoSort = { overallScore: -1 };
  }

  const docs = await Shortlist.find(query)
    .sort(mongoSort)
    .limit(limit)
    .populate('job', 'title company companyLogo location type url salary salaryMin remote experienceLevel skills tags postedAt isActive')
    .lean();

  // Post-filter remote in application layer (since sort/limit is already applied)
  const filtered = remote === 'true' || remote === true
    ? docs.filter(d => d.job?.remote)
    : docs;

  return filtered.filter(d => d.job && d.job.isActive !== false);
}

/**
 * getPriorityJobs(userId)
 * Returns the top apply_now + strong_fit jobs. Used for Dashboard widget.
 */
export async function getPriorityJobs(userId, limit = 5) {
  const docs = await Shortlist.find({
    user: userId,
    priorityLevel: { $in: ['apply_now', 'strong_fit'] },
  })
    .sort({ overallScore: -1 })
    .limit(limit)
    .populate('job', 'title company companyLogo location type url salary remote experienceLevel skills postedAt isActive')
    .lean();

  return docs.filter(d => d.job && d.job.isActive !== false);
}

/**
 * getRecommendationAnalytics(userId)
 * Computes analytics from Shortlist + Application collections.
 */
export async function getRecommendationAnalytics(userId) {
  const [shortlistDocs, applications] = await Promise.all([
    Shortlist.find({ user: userId }).lean(),
    Application.find({ user: userId }).lean(),
  ]);

  if (!shortlistDocs.length) {
    return {
      total: 0, applyNowCount: 0, strongFitCount: 0, goodMatchCount: 0,
      averageScore: 0, applicationRate: 0, successRate: 0,
      scoreDistribution: {},
    };
  }

  const total          = shortlistDocs.length;
  const applyNowCount  = shortlistDocs.filter(d => d.priorityLevel === 'apply_now').length;
  const strongFitCount = shortlistDocs.filter(d => d.priorityLevel === 'strong_fit').length;
  const goodMatchCount = shortlistDocs.filter(d => d.priorityLevel === 'good_match').length;
  const averageScore   = Math.round(shortlistDocs.reduce((s, d) => s + d.overallScore, 0) / total);

  // Cross-reference shortlist job IDs with applied jobs
  const appliedJobIds  = new Set(applications.filter(a => a.job).map(a => String(a.job)));
  const shortlistJobIds = new Set(shortlistDocs.map(d => String(d.job)));
  const appliedFromShortlist = [...appliedJobIds].filter(id => shortlistJobIds.has(id)).length;

  const applicationRate = total > 0 ? Math.round((appliedFromShortlist / total) * 100) : 0;

  // Success = application moved beyond pending
  const successfulApps = applications.filter(a =>
    a.job && appliedJobIds.has(String(a.job)) &&
    ['interview', 'offer', 'hired'].includes(a.status)
  ).length;
  const successRate = appliedFromShortlist > 0
    ? Math.round((successfulApps / appliedFromShortlist) * 100)
    : 0;

  const scoreDistribution = {
    '80-100': shortlistDocs.filter(d => d.overallScore >= 80).length,
    '65-79':  shortlistDocs.filter(d => d.overallScore >= 65 && d.overallScore < 80).length,
    '50-64':  shortlistDocs.filter(d => d.overallScore >= 50 && d.overallScore < 65).length,
    '0-49':   shortlistDocs.filter(d => d.overallScore < 50).length,
  };

  return {
    total,
    applyNowCount,
    strongFitCount,
    goodMatchCount,
    averageScore,
    applicationRate,
    successRate,
    scoreDistribution,
  };
}
