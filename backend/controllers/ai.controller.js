import Resume        from '../models/Resume.js';
import Job            from '../models/Job.js';
import JobMatch       from '../models/JobMatch.js';
import { extractText } from '../utils/resumeParser.js';
import * as aiService  from '../services/ai.service.js';
import * as shortlistEngine from '../services/aiShortlistEngine.js';

// ── POST /api/ai/analyze ──────────────────────────────────────────────────

export async function analyzeResume(req, res) {
  const resume = await Resume.findOne({ user: req.user._id });
  if (!resume) {
    return res.status(404).json({
      success: false,
      message: 'No resume found. Please upload one first.',
    });
  }

  const resumeText = await extractText(resume);
  const result     = await aiService.analyze(resumeText);

  resume.addAnalysis({ type: 'analyze', ...result });
  await resume.save();

  res.json({ success: true, data: result });
}

// ── POST /api/ai/match ────────────────────────────────────────────────────

export async function matchJob(req, res) {
  const { jobDescription } = req.body;

  const resume = await Resume.findOne({ user: req.user._id });
  if (!resume) {
    return res.status(404).json({
      success: false,
      message: 'No resume found. Please upload one first.',
    });
  }

  const resumeText = await extractText(resume);
  const result     = await aiService.match(resumeText, jobDescription);

  resume.addAnalysis({
    type:                 'match',
    ...result,
    jobDescriptionSnippet: jobDescription.slice(0, 500),
  });
  await resume.save();

  res.json({ success: true, data: result });
}

// ── POST /api/ai/analyze-resume ───────────────────────────────────────────
// Extracts structured profile from resume and caches it on the Resume doc.

export async function analyzeResumeProfile(req, res) {
  const resume = await Resume.findOne({ user: req.user._id }).select('+extractedText');
  if (!resume) {
    return res.status(404).json({ success: false, message: 'No resume found. Please upload one first.' });
  }

  const resumeText = await extractText(resume);
  const profile    = await aiService.extractProfile(resumeText);

  resume.resumeProfile = { ...profile, extractedAt: new Date() };
  await resume.save();

  res.json({ success: true, data: profile });
}

// ── GET /api/ai/job-matches ───────────────────────────────────────────────
// Returns match scores for all active MongoDB jobs against the user's resume.
// Stale/missing JobMatch docs are (re)computed; results cached for 7 days.

const BATCH_SIZE = 5;

export async function getJobMatches(req, res) {
  const resume = await Resume.findOne({ user: req.user._id }).select('+extractedText');
  if (!resume) {
    return res.status(404).json({ success: false, message: 'No resume found. Please upload one first.' });
  }

  // Ensure profile is fresh
  let profile = resume.resumeProfile?.extractedAt ? resume.resumeProfile.toObject() : null;
  if (!profile || (resume.uploadedAt && resume.resumeProfile.extractedAt < resume.uploadedAt)) {
    const resumeText = await extractText(resume);
    profile = await aiService.extractProfile(resumeText);
    resume.resumeProfile = { ...profile, extractedAt: new Date() };
    await resume.save();
  }

  const jobs = await Job.find({ isActive: true }).select('_id title company location type description requirements').lean();
  if (!jobs.length) {
    return res.json({ success: true, data: [] });
  }

  // Load cached matches
  const cachedMap = new Map();
  const cached = await JobMatch.find({ user: req.user._id, job: { $in: jobs.map(j => j._id) } }).lean();
  for (const m of cached) cachedMap.set(m.job.toString(), m);

  const results = [];

  // Process in batches to limit parallel OpenAI calls
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(async (job) => {
      const existing = cachedMap.get(job._id.toString());
      // Use cache if it exists and is not stale
      if (existing && existing.computedAt > resume.uploadedAt) {
        return { job, match: existing };
      }

      const jobText = [
        job.title,
        job.company,
        job.description,
        ...(job.requirements || []),
      ].join('\n');

      const matchData = await aiService.matchJobFast(profile, jobText);

      const doc = await JobMatch.findOneAndUpdate(
        { user: req.user._id, job: job._id },
        { ...matchData, computedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return { job, match: doc };
    }));
    results.push(...batchResults);
  }

  const data = results
    .sort((a, b) => b.match.rankingScore - a.match.rankingScore)
    .map(({ job, match }) => ({
      job:          { _id: job._id, title: job.title, company: job.company, location: job.location, type: job.type },
      matchScore:   match.matchScore,
      rankingScore: match.rankingScore,
      matchReason:  match.matchReason,
      missingSkills:match.missingSkills,
      strengths:    match.strengths,
      computedAt:   match.computedAt,
    }));

  res.json({ success: true, data });
}

// ── GET /api/ai/recommended-jobs ─────────────────────────────────────────
// Returns the top 5 recommended jobs — lightweight, from cached JobMatch docs.

export async function getRecommendedJobs(req, res) {
  const resume = await Resume.findOne({ user: req.user._id }).lean();
  if (!resume || !resume.resumeProfile?.extractedAt) {
    return res.json({ success: true, data: [], profileMissing: true });
  }

  const matches = await JobMatch.find({ user: req.user._id })
    .sort({ rankingScore: -1 })
    .limit(5)
    .populate('job', 'title company location type url isActive')
    .lean();

  // Filter out matches where the job was deleted or deactivated
  const data = matches
    .filter(m => m.job && m.job.isActive !== false)
    .map(m => ({
      job:          m.job,
      matchScore:   m.matchScore,
      rankingScore: m.rankingScore,
      matchReason:  m.matchReason,
      missingSkills:m.missingSkills,
      strengths:    m.strengths,
      computedAt:   m.computedAt,
    }));

  res.json({ success: true, data });
}

// ── GET /api/ai/shortlisted-jobs ──────────────────────────────────────────
// Returns the cached shortlist for the user with filters.
// Does NOT trigger new OpenAI computation — reads from Shortlist collection.

export async function getShortlistedJobs(req, res) {
  const { priorityLevel, remote, sort } = req.query;
  const data = await shortlistEngine.getShortlistedJobs(req.user._id, { priorityLevel, remote, sort });
  res.json({ success: true, data });
}

// ── GET /api/ai/recommendations ───────────────────────────────────────────
// Runs the full shortlist pipeline (profile + matching + scoring + reasons).
// Uses 24h cache; pass ?refresh=true to force recomputation.

export async function getRecommendations(req, res) {
  const forceRefresh = req.query.refresh === 'true';
  const data = await shortlistEngine.generateShortlist(req.user._id, { forceRefresh });
  res.json({ success: true, data });
}

// ── GET /api/ai/priority-jobs ─────────────────────────────────────────────
// Returns top apply_now + strong_fit jobs for the Dashboard widget.

export async function getPriorityJobs(req, res) {
  const limit = Math.min(10, Math.max(1, parseInt(req.query.limit ?? '5', 10)));
  const data  = await shortlistEngine.getPriorityJobs(req.user._id, limit);
  res.json({ success: true, data });
}

// ── GET /api/ai/recommendation-analytics ─────────────────────────────────
// Returns aggregated analytics from the Shortlist + Application collections.

export async function getRecommendationAnalytics(req, res) {
  const data = await shortlistEngine.getRecommendationAnalytics(req.user._id);
  res.json({ success: true, data });
}
