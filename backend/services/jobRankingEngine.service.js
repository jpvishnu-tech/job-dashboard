/**
 * jobRankingEngine.service.js
 * AI-powered job ranking: scores jobs against a user's resume profile.
 * Combines resume match %, ATS compatibility, skill overlap, salary fit,
 * remote preference, and experience alignment into a ranked priority queue.
 */

import OpenAI    from 'openai';
import JobMatch  from '../models/JobMatch.js';
import Resume    from '../models/Resume.js';

const RANK_SYSTEM = `You are a senior technical recruiter and career strategist. Evaluate how well a candidate profile matches a job listing and return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "matchScore":   <integer 0-100>,
  "rankScore":    <integer 0-100>,
  "priority":     "<high|medium|low>",
  "matchReason":  "<2-sentence summary of overall fit>",
  "strengths":    ["<specific strength supporting this match>"],
  "skillGaps":    ["<skill required by job but absent from profile>"],
  "atsKeywords":  ["<keyword both present and important for ATS>"],
  "salaryFit":    "<above_range|in_range|below_range|unknown>",
  "experienceFit":"<overqualified|strong_fit|underqualified|unknown>",
  "remoteFit":    "<ideal|acceptable|mismatch|unknown>",
  "applyAdvice":  "<one concrete action to strengthen this application>"
}

Scoring guide for matchScore (raw fit):
- 85-100: Excellent — nearly all requirements met
- 70-84:  Strong — most requirements met, minor gaps
- 50-69:  Good — meaningful overlap, some gaps
- 30-49:  Moderate — some fit but notable gaps
- 0-29:   Weak — significant skill or experience mismatch

rankScore = matchScore weighted by:
- salary_fit (in_range: +5, above_range: -3, below_range: +3)
- remote_fit (ideal: +5, mismatch: -10)
- experience_fit (strong_fit: +5, overqualified: -5, underqualified: -8)

Priority tiers:
- high:   rankScore >= 75
- medium: rankScore 50-74
- low:    rankScore < 50

Rules:
- strengths: 3-5 specific, concrete positives
- skillGaps: only list skills EXPLICITLY required by the job, max 6
- atsKeywords: 4-8 high-value keywords the candidate should include in their application`;

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
      max_tokens:      800,
    });
    raw = completion.choices[0]?.message?.content ?? '{}';
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate-limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('Job ranking failed.'), { status: 500 });
  }
  try { return JSON.parse(raw); } catch { return {}; }
}

function clamp(n, fallback = 50) {
  return typeof n === 'number' ? Math.min(100, Math.max(0, Math.round(n))) : fallback;
}
function arr(v) { return Array.isArray(v) ? v : []; }

function jobToText(job) {
  const parts = [
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    `Location: ${job.location || 'Not specified'}`,
    job.remote ? 'Remote: Yes' : 'Remote: No',
    job.type ? `Type: ${job.type}` : '',
    job.experienceLevel ? `Experience Level: ${job.experienceLevel}` : '',
    job.salaryMin || job.salaryMax
      ? `Salary: $${job.salaryMin?.toLocaleString() ?? '?'} - $${job.salaryMax?.toLocaleString() ?? '?'}`
      : '',
    job.skills?.length ? `Required Skills: ${job.skills.join(', ')}` : '',
    job.description ? `Description: ${job.description.slice(0, 800)}` : '',
  ];
  return parts.filter(Boolean).join('\n');
}

function profileToText(profile) {
  return [
    `Skills: ${profile.skills?.join(', ') || 'Not specified'}`,
    `Technologies: ${profile.technologies?.join(', ') || 'Not specified'}`,
    `Years of Experience: ${profile.yearsExperience ?? 'Unknown'}`,
    `Education: ${profile.education?.join(', ') || 'Not specified'}`,
    `Role Preferences: ${profile.rolePreferences?.join(', ') || 'Not specified'}`,
    profile.summary ? `Summary: ${profile.summary}` : '',
  ].filter(Boolean).join('\n');
}

/**
 * rankSingleJob(resumeProfile, job)
 * Calls OpenAI to score a single job against the user's resume profile.
 */
export async function rankSingleJob(resumeProfile, job) {
  const content = `CANDIDATE PROFILE:\n${profileToText(resumeProfile)}\n\nJOB LISTING:\n${jobToText(job)}`;
  const raw = await callAI(RANK_SYSTEM, content);
  return {
    matchScore:    clamp(raw.matchScore),
    rankScore:     clamp(raw.rankScore),
    priority:      ['high', 'medium', 'low'].includes(raw.priority) ? raw.priority : 'medium',
    matchReason:   raw.matchReason   || '',
    strengths:     arr(raw.strengths),
    skillGaps:     arr(raw.skillGaps),
    atsKeywords:   arr(raw.atsKeywords),
    salaryFit:     raw.salaryFit     || 'unknown',
    experienceFit: raw.experienceFit || 'unknown',
    remoteFit:     raw.remoteFit     || 'unknown',
    applyAdvice:   raw.applyAdvice   || '',
  };
}

/**
 * getOrComputeJobMatch(userId, resumeProfile, job)
 * Returns cached JobMatch if fresh (< 7 days), otherwise computes and caches.
 */
export async function getOrComputeJobMatch(userId, resumeProfile, job) {
  const existing = await JobMatch.findOne({ user: userId, job: job._id });
  if (existing) {
    return {
      matchScore:   existing.matchScore,
      rankScore:    existing.rankingScore,
      priority:     existing.rankingScore >= 75 ? 'high' : existing.rankingScore >= 50 ? 'medium' : 'low',
      matchReason:  existing.matchReason,
      strengths:    existing.strengths,
      skillGaps:    existing.missingSkills,
      atsKeywords:  [],
      salaryFit:    'unknown',
      experienceFit:'unknown',
      remoteFit:    'unknown',
      applyAdvice:  '',
    };
  }

  const result = await rankSingleJob(resumeProfile, job);

  // Cache in JobMatch (upsert)
  await JobMatch.findOneAndUpdate(
    { user: userId, job: job._id },
    {
      matchScore:    result.matchScore,
      rankingScore:  result.rankScore,
      matchReason:   result.matchReason,
      missingSkills: result.skillGaps,
      strengths:     result.strengths,
      computedAt:    new Date(),
    },
    { upsert: true, new: true }
  );

  return result;
}

/**
 * getUserResumeProfile(userId)
 * Returns the cached resume profile, or null if no resume exists.
 */
export async function getUserResumeProfile(userId) {
  const resume = await Resume.findOne({ user: userId });
  if (!resume?.resumeProfile?.extractedAt) return null;
  return resume.resumeProfile;
}
