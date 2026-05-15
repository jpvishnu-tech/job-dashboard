/**
 * applyRecommendation.service.js
 * Manages the smart apply queue:
 *   - Fetches recommended jobs from existing JobMatch scores
 *   - Merges with ApplicationDraft status
 *   - Returns a priority-sorted, deduplicated queue
 */

import mongoose       from 'mongoose';
import JobMatch       from '../models/JobMatch.js';
import Job            from '../models/Job.js';
import ApplicationDraft from '../models/ApplicationDraft.js';
import Application    from '../models/Application.js';

const JOB_SELECT = 'title company companyLogo location type remote salaryMin salaryMax skills experienceLevel applyUrl source external clickCount isActive';

/**
 * getRecommendedQueue(userId, { limit, includeApplied })
 * Returns ranked job recommendations with draft status and match metadata.
 *
 * @returns {object} { queue: QueueItem[], stats: { total, high, medium, low, drafts } }
 */
export async function getRecommendedQueue(userId, { limit = 30, includeApplied = false } = {}) {
  const uid = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  // 1. Fetch user's JobMatch scores (sorted by rankingScore desc)
  const matches = await JobMatch.find({ user: uid })
    .sort({ rankingScore: -1 })
    .limit(limit)
    .lean();

  if (!matches.length) {
    return { queue: [], stats: { total: 0, high: 0, medium: 0, low: 0, drafts: 0 }, hasProfile: false };
  }

  const jobIds = matches.map(m => m.job);

  // 2. Fetch active jobs
  const jobs = await Job.find({ _id: { $in: jobIds }, isActive: true })
    .select(JOB_SELECT)
    .lean();

  const jobMap = new Map(jobs.map(j => [String(j._id), j]));

  // 3. Fetch existing drafts for these jobs
  const drafts = await ApplicationDraft.find({ user: uid, job: { $in: jobIds } })
    .select('job status priority coverLetter checklist updatedAt')
    .lean();
  const draftMap = new Map(drafts.map(d => [String(d.job), d]));

  // 4. Fetch applied jobs to optionally exclude
  let appliedJobIds = new Set();
  if (!includeApplied) {
    const applied = await Application.find({
      user: uid,
      status: { $in: ['applied', 'under_review', 'interview_scheduled', 'interview_completed', 'offer_received', 'hired'] },
    }).select('job').lean();
    appliedJobIds = new Set(applied.map(a => String(a.job)).filter(Boolean));
  }

  // 5. Build queue items
  const queue = [];
  for (const match of matches) {
    const jobId = String(match.job);
    const job   = jobMap.get(jobId);
    if (!job) continue;
    if (appliedJobIds.has(jobId)) continue;

    const rankScore = match.rankingScore ?? 0;
    const priority  = rankScore >= 75 ? 'high' : rankScore >= 50 ? 'medium' : 'low';
    const draft     = draftMap.get(jobId) || null;

    queue.push({
      _id:         match._id,
      job:         { ...job, _id: job._id },
      matchScore:  match.matchScore,
      rankScore:   rankScore,
      priority,
      matchReason: match.matchReason  || '',
      strengths:   match.strengths    || [],
      skillGaps:   match.missingSkills || [],
      computedAt:  match.computedAt,
      draft: draft ? {
        _id:         draft._id,
        status:      draft.status,
        hasCoverLetter: Boolean(draft.coverLetter),
        checklistProgress: draft.checklist?.length
          ? Math.round(draft.checklist.filter(c => c.done).length / draft.checklist.length * 100)
          : 0,
        updatedAt: draft.updatedAt,
      } : null,
    });
  }

  // 6. Stats
  const high   = queue.filter(q => q.priority === 'high').length;
  const medium = queue.filter(q => q.priority === 'medium').length;
  const low    = queue.filter(q => q.priority === 'low').length;
  const draftCount = queue.filter(q => q.draft !== null).length;

  return {
    queue,
    stats: { total: queue.length, high, medium, low, drafts: draftCount },
    hasProfile: true,
  };
}

/**
 * getSavedQueue(userId)
 * Returns jobs the user has manually saved (status='saved' Applications) that are
 * not yet in the recommended queue — so the user can prepare those too.
 */
export async function getSavedQueue(userId) {
  const saved = await Application.find({ user: userId, status: 'saved' })
    .populate({ path: 'job', select: JOB_SELECT })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return saved
    .filter(a => a.job && a.job.isActive)
    .map(a => ({
      applicationId: a._id,
      job:           a.job,
      savedAt:       a.createdAt,
      notes:         a.notes || '',
    }));
}

/**
 * getDrafts(userId, { status })
 * Returns the user's ApplicationDraft documents.
 */
export async function getDrafts(userId, { status } = {}) {
  const filter = { user: userId };
  if (status) filter.status = status;

  const drafts = await ApplicationDraft.find(filter)
    .populate({ path: 'job', select: JOB_SELECT })
    .sort({ updatedAt: -1 })
    .lean();

  return drafts;
}
