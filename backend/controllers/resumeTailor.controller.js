/**
 * resumeTailor.controller.js
 * AI Resume Tailoring Engine — endpoint handlers.
 *
 * POST   /api/resume/tailor
 * GET    /api/resume/tailored-versions
 * GET    /api/resume/tailored-versions/:id
 * DELETE /api/resume/tailored-versions/:id
 */

import Resume           from '../models/Resume.js';
import TailoredResume   from '../models/TailoredResume.js';
import { extractText }  from '../utils/resumeParser.js';
import * as tailorSvc   from '../services/resumeTailorService.js';
import * as analytics   from '../services/analytics.service.js';
import ApiError         from '../utils/ApiError.js';

async function getResumeText(userId) {
  const resume = await Resume.findOne({ user: userId });
  if (!resume) throw ApiError.badRequest('No resume found. Please upload a PDF first.');
  return { resume, text: await extractText(resume) };
}

// ── POST /api/resume/tailor ───────────────────────────────────
// Body: { jobDescription, jobTitle?, jobCompany?, jobId? }
export async function tailorResume(req, res) {
  const { jobDescription, jobTitle = '', jobCompany = '', jobId } = req.body;

  const { text: resumeText } = await getResumeText(req.user._id);

  // Run ATS scoring and full tailoring in parallel
  const [atsResult, tailorResult] = await Promise.all([
    tailorSvc.calculateATSMatchScore(resumeText, jobDescription),
    tailorSvc.generateTailoredResume(resumeText, jobDescription, {
      jobTitle,
      company: jobCompany,
    }),
  ]);

  const version = await TailoredResume.create({
    user:                  req.user._id,
    jobTitle:              jobTitle.trim(),
    jobCompany:            jobCompany.trim(),
    jobDescriptionSnippet: jobDescription.trim().slice(0, 600),
    originalAtsScore:      atsResult.atsScore,
    projectedAtsScore:     tailorResult.projectedAtsScore,
    keywordMatchScore:     atsResult.keywordMatchScore,
    skillMatchScore:       atsResult.skillMatchScore,
    tailoredSummary:       tailorResult.tailoredSummary,
    skillsToHighlight:     tailorResult.skillsToHighlight,
    skillsToAdd:           tailorResult.skillsToAdd,
    keywordsToIncorporate: tailorResult.keywordsToIncorporate,
    sectionImprovements:   tailorResult.sectionImprovements,
    bulletRewrites:        tailorResult.bulletRewrites,
    missingSkills:         atsResult.missingSkills,
    atsKeywordsFound:      tailorResult.atsKeywordsFound,
    atsCriticalMissing:    tailorResult.atsCriticalMissing,
    topRecommendations:    tailorResult.topRecommendations,
    ...(jobId ? { jobRef: jobId } : {}),
  });

  analytics.track(analytics.EVENT_TYPES.RESUME_TAILOR, {
    user:     req.user._id,
    metadata: {
      atsScore:       atsResult.atsScore,
      projectedScore: tailorResult.projectedAtsScore,
      jobTitle,
    },
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    data:    { version, ats: atsResult },
  });
}

// ── GET /api/resume/tailored-versions ────────────────────────
export async function getTailoredVersions(req, res) {
  const { page = 1, limit = 12 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [versions, total] = await Promise.all([
    TailoredResume.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-sectionImprovements -bulletRewrites -jobDescriptionSnippet'),
    TailoredResume.countDocuments({ user: req.user._id }),
  ]);

  res.json({
    success: true,
    data: {
      versions,
      pagination: {
        page:  Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
}

// ── GET /api/resume/tailored-versions/:id ────────────────────
export async function getTailoredVersion(req, res) {
  const version = await TailoredResume.findOne({
    _id:  req.params.id,
    user: req.user._id,
  });
  if (!version) throw ApiError.notFound('Tailored version not found.');
  res.json({ success: true, data: version });
}

// ── DELETE /api/resume/tailored-versions/:id ─────────────────
export async function deleteTailoredVersion(req, res) {
  const version = await TailoredResume.findOneAndDelete({
    _id:  req.params.id,
    user: req.user._id,
  });
  if (!version) throw ApiError.notFound('Tailored version not found.');
  res.json({ success: true, message: 'Version deleted.' });
}
