/**
 * autoApply.controller.js
 * Smart Auto-Apply Assistant handlers.
 *
 * Endpoints (mounted under /api/applications for user-specified routes):
 *   GET  /api/applications/queue
 *   POST /api/applications/prepare
 *   POST /api/applications/generate-cover-letter
 *   GET  /api/applications/drafts
 *   PATCH /api/applications/drafts/:id
 *   POST /api/applications/drafts/:id/submit
 *   DELETE /api/applications/drafts/:id
 */

import mongoose         from 'mongoose';
import Job              from '../models/Job.js';
import Application      from '../models/Application.js';
import ApplicationDraft from '../models/ApplicationDraft.js';
import Resume           from '../models/Resume.js';
import * as rankEngine  from '../services/jobRankingEngine.service.js';
import * as clGen       from '../services/coverLetterGenerator.service.js';
import * as matcher     from '../services/resumeJobMatcher.service.js';
import * as queue       from '../services/applyRecommendation.service.js';
import { extractText }  from '../utils/resumeParser.js';
import * as analyticsService from '../services/analytics.service.js';
import ApiError         from '../utils/ApiError.js';

// ── helpers ───────────────────────────────────────────────────

async function getResumeWithText(userId) {
  const resume = await Resume.findOne({ user: userId });
  if (!resume) throw ApiError.badRequest('No resume found. Please upload a PDF resume first.');
  const text = await extractText(resume);
  return { resume, text };
}

function snapshotJob(job) {
  return {
    title:           job.title           || '',
    company:         job.company         || '',
    location:        job.location        || '',
    type:            job.type            || '',
    remote:          job.remote          || false,
    skills:          job.skills          || [],
    salaryMin:       job.salaryMin       || null,
    salaryMax:       job.salaryMax       || null,
    experienceLevel: job.experienceLevel || '',
    applyUrl:        job.applyUrl        || '',
    source:          job.source          || '',
    descriptionSnippet: (job.description || '').slice(0, 600),
  };
}

function priorityFromScore(rankScore) {
  if (rankScore >= 75) return 'high';
  if (rankScore >= 50) return 'medium';
  return 'low';
}

// ── GET /api/applications/queue ───────────────────────────────
export async function getApplyQueue(req, res) {
  const { limit = 30, includeApplied = false, view = 'recommended' } = req.query;

  analyticsService.track(analyticsService.EVENT_TYPES.APPLY_QUEUE_VIEWED, {
    user:     req.user._id,
    metadata: { view },
    ip:       req.ip,
  });

  if (view === 'saved') {
    const saved = await queue.getSavedQueue(req.user._id);
    return res.json({ success: true, data: { queue: saved, view: 'saved', stats: { total: saved.length } } });
  }

  const result = await queue.getRecommendedQueue(req.user._id, {
    limit:          Number(limit),
    includeApplied: String(includeApplied) === 'true',
  });

  res.json({ success: true, data: { ...result, view: 'recommended' } });
}

// ── POST /api/applications/prepare ───────────────────────────
// Body: { jobId, tone? }
// Runs match analysis + cover letter generation in parallel.
export async function prepareApplication(req, res) {
  const { jobId, tone = 'professional' } = req.body;
  if (!jobId) throw ApiError.badRequest('jobId is required.');

  const job = await Job.findById(jobId);
  if (!job || !job.isActive) throw ApiError.notFound('Job not found or no longer available.');

  const { resume, text: resumeText } = await getResumeWithText(req.user._id);
  const resumeProfile = resume.resumeProfile?.extractedAt ? resume.resumeProfile : null;

  // Check for recent draft (less than 1 hour old)
  const existing = await ApplicationDraft.findOne({ user: req.user._id, job: jobId });
  if (existing && existing.status !== 'draft' && existing.coverLetter) {
    const age = Date.now() - existing.updatedAt.getTime();
    if (age < 60 * 60 * 1000) {
      const populated = await ApplicationDraft.findById(existing._id).populate('job', 'title company companyLogo applyUrl location remote type skills salaryMin salaryMax source');
      return res.json({ success: true, data: { draft: populated, cached: true } });
    }
  }

  // Run detailed match analysis and cover letter generation in parallel
  const [matchResult, clResult] = await Promise.all([
    matcher.matchResumeToJob(resumeText, job),
    clGen.generateCoverLetter(resumeText, job, { tone }),
  ]);

  // Compute rank score using profile if available, otherwise use match score
  let rankScore = matchResult.matchScore;
  let rankPriority = priorityFromScore(rankScore);
  if (resumeProfile) {
    try {
      const ranked = await rankEngine.rankSingleJob(resumeProfile, job);
      rankScore    = ranked.rankScore;
      rankPriority = ranked.priority;
      // Update JobMatch cache
      await rankEngine.getOrComputeJobMatch(req.user._id, resumeProfile, job);
    } catch { /* rank engine optional */ }
  }

  // Upsert ApplicationDraft
  const draftData = {
    jobSnapshot:       snapshotJob(job),
    matchScore:        matchResult.matchScore,
    rankScore,
    priority:          rankPriority,
    matchReason:       matchResult.overallAssessment,
    strengths:         matchResult.applicationStrengths,
    skillGaps:         [...(matchResult.missingSkills?.critical || []), ...(matchResult.missingSkills?.important || [])].slice(0, 6),
    coverLetter:       clResult.coverLetter,
    coverLetterTone:   tone,
    coverLetterVersion: (existing?.coverLetterVersion || 0) + 1,
    checklist:         clResult.checklist,
    applicationNotes:  existing?.applicationNotes || '',
    aiRecommendations: [
      ...clResult.aiRecommendations,
      ...(matchResult.tailoringActions || []),
    ].slice(0, 8),
    status:            'ready',
  };

  const draft = await ApplicationDraft.findOneAndUpdate(
    { user: req.user._id, job: jobId },
    { $set: draftData },
    { upsert: true, new: true, runValidators: true }
  ).populate('job', 'title company companyLogo applyUrl location remote type skills salaryMin salaryMax source external');

  analyticsService.track(analyticsService.EVENT_TYPES.APP_DRAFT_CREATED, {
    user:     req.user._id,
    metadata: { jobId, matchScore: matchResult.matchScore, tone },
    ip:       req.ip,
  });

  res.status(201).json({ success: true, data: { draft, matchDetail: matchResult, cached: false } });
}

// ── POST /api/applications/generate-cover-letter ──────────────
// Body: { jobId, draftId?, tone?, focusAreas? }
// Regenerates the cover letter (increments version).
export async function generateCoverLetter(req, res) {
  const { jobId, draftId, tone = 'professional', focusAreas } = req.body;
  if (!jobId) throw ApiError.badRequest('jobId is required.');

  const job = await Job.findById(jobId);
  if (!job) throw ApiError.notFound('Job not found.');

  const { text: resumeText } = await getResumeWithText(req.user._id);

  const clResult = await clGen.generateCoverLetter(resumeText, job, {
    tone,
    focusAreas: Array.isArray(focusAreas) ? focusAreas : [],
  });

  analyticsService.track(analyticsService.EVENT_TYPES.COVER_LETTER_GEN, {
    user:     req.user._id,
    metadata: { jobId, tone },
    ip:       req.ip,
  });

  // If a draftId is provided, update the draft with the new cover letter
  if (draftId) {
    const draft = await ApplicationDraft.findOneAndUpdate(
      { _id: draftId, user: req.user._id },
      {
        $set: {
          coverLetter:     clResult.coverLetter,
          coverLetterTone: tone,
        },
        $inc: { coverLetterVersion: 1 },
      },
      { new: true }
    ).populate('job', 'title company companyLogo applyUrl location remote type skills salaryMin salaryMax source');

    if (draft) {
      return res.json({ success: true, data: { draft, coverLetter: clResult } });
    }
  }

  res.json({ success: true, data: { coverLetter: clResult } });
}

// ── GET /api/applications/drafts ──────────────────────────────
export async function getDrafts(req, res) {
  const { status } = req.query;
  const drafts = await queue.getDrafts(req.user._id, { status });
  res.json({ success: true, data: drafts });
}

// ── PATCH /api/applications/drafts/:id ───────────────────────
// Body: { applicationNotes?, checklist?, status? }
export async function updateDraft(req, res) {
  const { id } = req.params;
  const { applicationNotes, checklist, status: newStatus } = req.body;

  const update = {};
  if (applicationNotes !== undefined) update.applicationNotes = applicationNotes;
  if (checklist !== undefined)        update.checklist         = checklist;
  if (newStatus && ['draft', 'ready'].includes(newStatus)) update.status = newStatus;

  const draft = await ApplicationDraft.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { $set: update },
    { new: true, runValidators: true }
  ).populate('job', 'title company companyLogo applyUrl location type salaryMin salaryMax');

  if (!draft) throw ApiError.notFound('Draft not found.');
  res.json({ success: true, data: draft });
}

// ── POST /api/applications/drafts/:id/submit ─────────────────
// Creates an Application record and marks the draft as submitted.
export async function submitDraft(req, res) {
  const { id } = req.params;

  const draft = await ApplicationDraft.findOne({ _id: id, user: req.user._id })
    .populate('job', 'title company location type salaryMin salaryMax applyUrl source');
  if (!draft) throw ApiError.notFound('Draft not found.');
  if (draft.status === 'submitted') {
    return res.json({ success: true, data: { draft, alreadySubmitted: true } });
  }

  // Create or update Application record
  const appData = {
    user:            req.user._id,
    job:             draft.job._id,
    company:         draft.jobSnapshot.company || draft.job.company,
    role:            draft.jobSnapshot.title   || draft.job.title,
    location:        draft.jobSnapshot.location || draft.job.location,
    url:             draft.jobSnapshot.applyUrl || draft.job.applyUrl || '',
    status:          'applied',
    externalApply:   Boolean(draft.jobSnapshot.applyUrl),
    sourcePlatform:  draft.jobSnapshot.source || 'direct',
    applyClickedAt:  new Date(),
    notes:           draft.applicationNotes || '',
  };

  let application = await Application.findOne({ user: req.user._id, job: draft.job._id });
  if (application) {
    application.status       = 'applied';
    application.applyClickedAt = new Date();
    await application.save();
  } else {
    application = await Application.create(appData);
  }

  // Mark draft as submitted
  draft.status       = 'submitted';
  draft.submittedAt  = new Date();
  draft.applicationRef = application._id;
  await draft.save();

  analyticsService.track(analyticsService.EVENT_TYPES.APP_DRAFT_SUBMITTED, {
    user:     req.user._id,
    metadata: { jobId: String(draft.job._id), matchScore: draft.matchScore },
    ip:       req.ip,
  });

  res.json({ success: true, data: { draft, application } });
}

// ── DELETE /api/applications/drafts/:id ──────────────────────
export async function deleteDraft(req, res) {
  const { id } = req.params;
  const draft = await ApplicationDraft.findOneAndDelete({ _id: id, user: req.user._id });
  if (!draft) throw ApiError.notFound('Draft not found.');
  res.json({ success: true, message: 'Draft deleted.' });
}
