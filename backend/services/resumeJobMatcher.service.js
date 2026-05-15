/**
 * resumeJobMatcher.service.js
 * Deep resume-to-job matching: skill overlap analysis, ATS keyword compatibility,
 * salary fit, experience alignment, and version recommendation.
 */

import OpenAI from 'openai';

const MATCH_SYSTEM = `You are a senior ATS engineer and technical recruiter. Perform a deep resume-to-job analysis and return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "matchScore":         <integer 0-100>,
  "atsCompatibility":   <integer 0-100>,
  "skillOverlap":       <integer 0-100>,
  "experienceAlignment":<integer 0-100>,
  "overallAssessment":  "<3-4 sentence honest assessment>",
  "presentSkills":      ["<skill/technology explicitly in resume AND required by job>"],
  "missingSkills":      {
    "critical": ["<must-have skill missing from resume>"],
    "important": ["<nice-to-have skill missing>"]
  },
  "keywordAnalysis": {
    "atsKeywordsPresent":  ["<ATS keyword found in resume>"],
    "atsKeywordsMissing":  ["<important ATS keyword to add>"],
    "keywordDensityScore": <integer 0-100>
  },
  "salaryAnalysis": {
    "fit":        "<above_range|in_range|below_range|unknown>",
    "assessment": "<one sentence on salary fit>"
  },
  "experienceAnalysis": {
    "fit":             "<overqualified|strong_fit|slightly_under|significantly_under|unknown>",
    "yearsRequired":   <integer or null>,
    "yearsDetected":   <integer or null>,
    "assessment":      "<one sentence>"
  },
  "remoteAnalysis": {
    "jobRemote":         <boolean>,
    "candidateFit":      "<ideal|acceptable|mismatch|unknown>",
    "assessment":        "<one sentence>"
  },
  "applicationStrengths": ["<specific point that makes this candidate stand out>"],
  "applicationWeaknesses": ["<specific gap or concern>"],
  "tailoringActions": ["<concrete action to improve this application>"],
  "resumeVersionAdvice": "<which version of resume to use or how to optimize existing one>"
}

Scoring:
- matchScore: overall raw compatibility (skills 50% + experience 30% + ATS 20%)
- atsCompatibility: keyword density, formatting, section completeness for THIS job
- skillOverlap: % of job-required skills present in resume
- experienceAlignment: years + level fit (100 = perfect, 50 = slightly off, 0 = major mismatch)

Rules:
- presentSkills: only skills mentioned in BOTH the resume AND job listing
- missingSkills.critical: must-have (5-8 items max)
- missingSkills.important: nice-to-have (3-5 items max)
- atsKeywordsPresent: 5-10 keywords
- atsKeywordsMissing: 5-8 keywords
- tailoringActions: 4-6 immediately actionable items`;

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('AI service not configured'), { status: 503 });
  _client = new OpenAI({ apiKey });
  return _client;
}

async function callAI(systemPrompt, userContent) {
  const client = getClient();
  let raw;
  try {
    const completion = await client.chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
      response_format: { type: 'json_object' },
      temperature:     0.15,
      max_tokens:      1800,
    });
    raw = completion.choices[0]?.message?.content ?? '{}';
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate-limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('Resume matching failed. Please try again.'), { status: 500 });
  }
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('AI returned unexpected format.'), { status: 500 }); }
}

function clamp(n, fb = 0) { return typeof n === 'number' ? Math.min(100, Math.max(0, Math.round(n))) : fb; }
function arr(v) { return Array.isArray(v) ? v : []; }
function obj(v, fb = {}) { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : fb; }

/**
 * matchResumeToJob(resumeText, job)
 * Deep analysis of resume vs. job listing.
 */
export async function matchResumeToJob(resumeText, job) {
  const jobText = [
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    `Location: ${job.location || 'Not specified'}`,
    job.remote ? 'Remote: Yes' : 'Remote: No/Not specified',
    job.type ? `Type: ${job.type}` : '',
    job.experienceLevel ? `Experience Level: ${job.experienceLevel}` : '',
    job.salaryMin || job.salaryMax ? `Salary: $${job.salaryMin?.toLocaleString() || '?'} – $${job.salaryMax?.toLocaleString() || '?'}` : '',
    job.skills?.length ? `Required Skills: ${job.skills.join(', ')}` : '',
    `Description: ${(job.description || '').slice(0, 1000)}`,
  ].filter(Boolean).join('\n');

  const content = `RESUME:\n${resumeText.slice(0, 3000)}\n\nJOB LISTING:\n${jobText}`;
  const raw = await callAI(MATCH_SYSTEM, content);

  const ms = obj(raw.missingSkills);
  const ka = obj(raw.keywordAnalysis);
  const sa = obj(raw.salaryAnalysis);
  const ea = obj(raw.experienceAnalysis);
  const ra = obj(raw.remoteAnalysis);

  return {
    matchScore:          clamp(raw.matchScore, 50),
    atsCompatibility:    clamp(raw.atsCompatibility, 50),
    skillOverlap:        clamp(raw.skillOverlap, 50),
    experienceAlignment: clamp(raw.experienceAlignment, 50),
    overallAssessment:   raw.overallAssessment || '',
    presentSkills:       arr(raw.presentSkills),
    missingSkills: {
      critical:  arr(ms.critical),
      important: arr(ms.important),
    },
    keywordAnalysis: {
      atsKeywordsPresent:  arr(ka.atsKeywordsPresent),
      atsKeywordsMissing:  arr(ka.atsKeywordsMissing),
      keywordDensityScore: clamp(ka.keywordDensityScore, 50),
    },
    salaryAnalysis: {
      fit:        sa.fit        || 'unknown',
      assessment: sa.assessment || '',
    },
    experienceAnalysis: {
      fit:           ea.fit           || 'unknown',
      yearsRequired: typeof ea.yearsRequired === 'number' ? ea.yearsRequired : null,
      yearsDetected: typeof ea.yearsDetected === 'number' ? ea.yearsDetected : null,
      assessment:    ea.assessment || '',
    },
    remoteAnalysis: {
      jobRemote:   Boolean(ra.jobRemote),
      candidateFit: ra.candidateFit || 'unknown',
      assessment:  ra.assessment || '',
    },
    applicationStrengths:  arr(raw.applicationStrengths),
    applicationWeaknesses: arr(raw.applicationWeaknesses),
    tailoringActions:      arr(raw.tailoringActions),
    resumeVersionAdvice:   raw.resumeVersionAdvice || '',
  };
}
