/**
 * resumeOptimizer.controller.js
 * Handlers for the AI Resume Optimizer endpoints.
 *
 * All endpoints require an uploaded resume in MongoDB.
 * resumeText can be supplied in the request body (client-extracted from PDF)
 * or falls back to the cached extractedText field in the Resume document.
 */

import Resume                from '../models/Resume.js';
import * as resumeService    from '../services/resume.service.js';
import * as analyticsService from '../services/analytics.service.js';
import * as atsAnalyzer      from '../services/atsAnalyzer.service.js';
import * as keywordEngine    from '../services/keywordEngine.service.js';
import * as optimizer        from '../services/resumeOptimizer.service.js';
import * as rewriter         from '../services/resumeRewrite.service.js';
import { extractText }       from '../utils/resumeParser.js';
import ApiError              from '../utils/ApiError.js';

// ── helpers ───────────────────────────────────────────────────

async function getResumeAndText(userId) {
  const resume = await Resume.findOne({ user: userId });
  if (!resume) throw ApiError.notFound('No resume found. Please upload a PDF resume first.');
  const text = await extractText(resume); // uses cached extractedText or downloads+parses
  return { resume, text };
}

// ── GET /api/resume/ats-score ─────────────────────────────────
// Fast read — returns the last stored ATS score without an AI call.
export async function getAtsScore(req, res) {
  const resume = await resumeService.getResume(req.user._id);
  res.json({
    success: true,
    data: {
      lastAtsScore:  resume.lastAtsScore ?? null,
      fileName:      resume.fileName,
      uploadedAt:    resume.uploadedAt,
      analysisCount: resume.analyses?.length ?? 0,
    },
  });
}

// ── POST /api/resume/analyze ──────────────────────────────────
// Enhanced ATS analysis + keyword engine (runs in parallel).
export async function analyzeResume(req, res) {
  const { resume, text: resumeText } = await getResumeAndText(req.user._id);

  const [atsResult, kwResult] = await Promise.all([
    atsAnalyzer.analyzeAts(resumeText),
    keywordEngine.analyzeKeywords(resumeText),
  ]);

  const analysisDoc = {
    type:                    'analyze',
    atsScore:                atsResult.atsScore,
    formattingScore:         atsResult.formattingScore,
    contentScore:            atsResult.contentScore,
    keywordRelevanceScore:   atsResult.keywordRelevanceScore,
    recruiterVisibilityScore:atsResult.recruiterVisibilityScore,
    overallFeedback:         atsResult.overallFeedback,
    strengths:               atsResult.strengths,
    weaknesses:              atsResult.weaknesses,
    recommendations:         atsResult.recommendations,
    skillsFound:             atsResult.skillsFound,
    keywordsPresent:         atsResult.keywordsPresent,
    missingElements:         atsResult.missingElements,
    formattingIssues:        atsResult.formattingIssues,
    sectionScores:           atsResult.sectionScores,
    keywordGaps:             atsResult.keywordGaps,
  };

  resume.addAnalysis(analysisDoc);
  await resume.save();

  analyticsService.track(analyticsService.EVENT_TYPES.AI_ANALYZE, {
    user:     req.user._id,
    metadata: { atsScore: atsResult.atsScore, source: 'optimizer' },
    ip:       req.ip,
  });

  res.status(201).json({
    success: true,
    data: { ats: atsResult, keywords: kwResult },
  });
}

// ── POST /api/resume/optimize ─────────────────────────────────
// Job-specific optimization plan.
// Body: { jobDescription }
export async function optimizeResume(req, res) {
  const { jobDescription } = req.body;
  if (!jobDescription || jobDescription.trim().length < 30) {
    throw ApiError.badRequest('Job description must be at least 30 characters.');
  }

  const { resume, text: resumeText } = await getResumeAndText(req.user._id);
  const result = await optimizer.optimizeResume(resumeText, jobDescription);

  const analysisDoc = {
    type:                    'optimize',
    optimizationScore:       result.optimizationScore,
    targetRole:              result.targetRole,
    overallFeedback:         result.overallFeedback,
    tailoredRecommendations: result.tailoredRecommendations,
    keywordsToAdd:           result.keywordsToAdd,
    missingSkills:           result.missingSkills,
    missingTechnologies:     result.missingTechnologies,
    sectionSuggestions:      result.sectionSuggestions,
    strengthsForRole:        result.strengthsForRole,
    gapsForRole:             result.gapsForRole,
    jobDescriptionSnippet:   jobDescription.trim().slice(0, 500),
  };

  resume.addAnalysis(analysisDoc);
  await resume.save();

  analyticsService.track(analyticsService.EVENT_TYPES.RESUME_OPTIMIZE, {
    user:     req.user._id,
    metadata: { optimizationScore: result.optimizationScore, targetRole: result.targetRole },
    ip:       req.ip,
  });

  res.status(201).json({ success: true, data: { result } });
}

// ── POST /api/resume/rewrite ──────────────────────────────────
// AI section rewriter: summary | bullets | <section name>
// Body: { section: 'summary'|'bullets'|'skills'|..., content }
export async function rewriteSection(req, res) {
  const { section = 'summary', content } = req.body;

  if (!content || content.trim().length < 10) {
    throw ApiError.badRequest('Content to rewrite must be at least 10 characters.');
  }

  // Best-effort resume context for richer rewrites
  let resumeContext = '';
  try {
    const { text } = await getResumeAndText(req.user._id);
    resumeContext = text;
  } catch { /* optional — proceed without context */ }

  let result;
  if (section === 'summary') {
    result = await rewriter.rewriteSummary(content.trim(), resumeContext);
  } else if (section === 'bullets' || section === 'experience') {
    result = await rewriter.rewriteBullets(content.trim(), resumeContext);
  } else {
    result = await rewriter.rewriteSection(section, content.trim(), resumeContext);
  }

  // Persist to history (best-effort — don't fail the response if no resume doc)
  try {
    const resume = await Resume.findOne({ user: req.user._id });
    if (resume) {
      resume.addAnalysis({
        type:             'rewrite',
        targetSection:    result.targetSection,
        rewrittenSummary: result.rewrittenSummary,
        rewrittenBullets: result.rewrittenBullets,
        improvementNotes: result.improvementNotes,
        keywordsAdded:    result.keywordsAdded,
      });
      await resume.save();
    }
  } catch { /* non-critical */ }

  analyticsService.track(analyticsService.EVENT_TYPES.RESUME_REWRITE, {
    user:     req.user._id,
    metadata: { section: result.targetSection },
    ip:       req.ip,
  });

  res.status(201).json({ success: true, data: { result } });
}
