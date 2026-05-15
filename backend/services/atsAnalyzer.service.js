/**
 * atsAnalyzer.service.js
 * Enhanced ATS analysis: keyword relevance score + recruiter visibility score
 * + section-by-section breakdown + formatting issues detection.
 */

import OpenAI from 'openai';

const ATS_ENHANCED_SYSTEM = `You are a senior ATS engineer and executive recruiter with 15+ years optimizing resumes for Fortune 500 hiring systems. Perform a deep ATS analysis and return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "atsScore": <integer 0-100>,
  "keywordRelevanceScore": <integer 0-100>,
  "recruiterVisibilityScore": <integer 0-100>,
  "formattingScore": <integer 0-100>,
  "contentScore": <integer 0-100>,
  "overallFeedback": "<3-4 sentence candid assessment>",
  "strengths": ["<specific strength>"],
  "weaknesses": ["<specific weakness>"],
  "recommendations": ["<concrete actionable step>"],
  "skillsFound": ["<technical or soft skill explicitly mentioned>"],
  "keywordsPresent": ["<keyword already optimized for ATS>"],
  "missingElements": ["<absent resume section or data point>"],
  "formattingIssues": ["<specific formatting problem that hurts ATS parsing>"],
  "sectionScores": {
    "summary":    { "score": <0-100>, "feedback": "<one sentence>" },
    "experience": { "score": <0-100>, "feedback": "<one sentence>" },
    "skills":     { "score": <0-100>, "feedback": "<one sentence>" },
    "education":  { "score": <0-100>, "feedback": "<one sentence>" },
    "projects":   { "score": <0-100>, "feedback": "<one sentence>" }
  },
  "keywordGaps": {
    "critical": ["<keyword that will fail most ATS filters>"],
    "important": ["<keyword that strengthens relevance>"],
    "nice_to_have": ["<keyword that differentiates candidates>"]
  }
}

Scoring guides:
- atsScore: overall machine-readability and keyword density
- keywordRelevanceScore: how well keywords match current market demand for this candidate's level
- recruiterVisibilityScore: how quickly a human recruiter can identify value in 6 seconds
- formattingScore: ATS-parseable structure, consistent dates, bullet alignment
- contentScore: achievement quality, quantification, specificity

Rules:
- strengths: 3-5 specific, honest positives
- weaknesses: 3-5 specific gaps or issues
- recommendations: 4-6 immediately actionable steps
- formattingIssues: list ONLY actual problems, empty array if clean
- keywordGaps.critical: 3-8 must-have keywords missing
- keywordGaps.important: 3-8 beneficial keywords missing
- keywordGaps.nice_to_have: 2-5 differentiator keywords`;

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
      temperature:     0.2,
      max_tokens:      2000,
    });
    raw = completion.choices[0]?.message?.content ?? '{}';
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate-limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('ATS analysis failed. Please try again.'), { status: 500 });
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(new Error('AI returned unexpected format.'), { status: 500 });
  }
}

function clamp(n) { return typeof n === 'number' ? Math.min(100, Math.max(0, Math.round(n))) : null; }
function arr(v)   { return Array.isArray(v) ? v : []; }

/**
 * analyzeAts(resumeText)
 * Returns enhanced ATS analysis with keyword and recruiter visibility scores.
 */
export async function analyzeAts(resumeText) {
  const raw = await callAI(ATS_ENHANCED_SYSTEM, `RESUME:\n${resumeText.trim()}`);
  return {
    atsScore:                 clamp(raw.atsScore),
    keywordRelevanceScore:    clamp(raw.keywordRelevanceScore),
    recruiterVisibilityScore: clamp(raw.recruiterVisibilityScore),
    formattingScore:          clamp(raw.formattingScore),
    contentScore:             clamp(raw.contentScore),
    overallFeedback:          raw.overallFeedback || '',
    strengths:                arr(raw.strengths),
    weaknesses:               arr(raw.weaknesses),
    recommendations:          arr(raw.recommendations),
    skillsFound:              arr(raw.skillsFound),
    keywordsPresent:          arr(raw.keywordsPresent),
    missingElements:          arr(raw.missingElements),
    formattingIssues:         arr(raw.formattingIssues),
    sectionScores:            raw.sectionScores  ?? {},
    keywordGaps:              raw.keywordGaps    ?? { critical: [], important: [], nice_to_have: [] },
  };
}
