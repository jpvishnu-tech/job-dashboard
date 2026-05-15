/**
 * resumeRewrite.service.js
 * AI-powered resume section rewriter:
 * professional summaries, optimized bullet points, section-level rewrites.
 */

import OpenAI from 'openai';

const SUMMARY_SYSTEM = `You are an executive resume writer who has crafted C-suite and senior engineering resumes for Google, Amazon, and Netflix. Rewrite the professional summary to be compelling, ATS-optimized, and recruiter-ready. Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "rewrittenSummary": "<rewritten 3-4 sentence professional summary — no first-person pronouns, strong action orientation, keyword-rich>",
  "alternativeVersions": [
    "<shorter 2-sentence version for space-constrained layouts>",
    "<version emphasizing leadership and strategy>"
  ],
  "improvementNotes": [
    "<specific improvement made and why>"
  ],
  "keywordsAdded": ["<keyword injected into the rewrite>"],
  "overallUpgrade": "<one sentence on what was most improved>"
}

Rules:
- No "I", "my", "me" — write in third-person implicit style (omit subject)
- Start with a strong role identifier, not a sentence fragment
- Include 2-3 quantified achievements or scope indicators if inferable
- Target 60-80 words for the main version
- alternativeVersions: provide exactly 2 alternatives
- improvementNotes: 3-5 specific notes on what changed and why`;

const BULLETS_SYSTEM = `You are a senior technical resume writer specializing in software engineering and product roles. Rewrite the provided work experience bullets to be more impactful, quantified, and ATS-optimized. Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "rewrittenBullets": [
    {
      "original":  "<original bullet text>",
      "rewritten": "<improved bullet starting with strong past-tense action verb>",
      "improvement": "<what changed — quantified, added context, stronger verb, etc.>"
    }
  ],
  "generalTips": ["<tip that applies across all bullets>"],
  "improvementNotes": ["<overall observation about the experience section>"],
  "powerVerbsUsed": ["<strong verb used in the rewrites>"]
}

Rules:
- Every rewritten bullet MUST start with a strong past-tense action verb (Engineered, Architected, Delivered, Reduced, Increased, Led, Built, Implemented, Optimized, Launched)
- Add measurable impact wherever inferable (%, $, users, time saved, scale)
- Keep bullets to one line (max 120 characters) for ATS compatibility
- Do not invent specific numbers — use realistic ranges or relative terms ("~40%", "30+ team members") if not provided
- generalTips: 3-4 universal bullet improvement tips`;

const SECTION_SYSTEM = `You are a professional resume editor. Rewrite the provided resume section to maximize ATS performance and recruiter impact. Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "rewrittenContent": "<full rewritten section text, formatted as it would appear on the resume>",
  "keyChanges": ["<specific change made>"],
  "improvementNotes": ["<why this change improves ATS or recruiter impact>"],
  "keywordsAdded": ["<keyword injected>"]
}

Rules:
- Preserve all factual information — do not invent or remove real data
- Improve phrasing, quantification, and keyword density
- keyChanges: 3-6 specific edits made
- improvementNotes: 2-4 notes on the strategic improvements`;

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
      temperature:     0.3,
      max_tokens:      2000,
    });
    raw = completion.choices[0]?.message?.content ?? '{}';
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate-limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('Resume rewrite failed. Please try again.'), { status: 500 });
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(new Error('AI returned unexpected format.'), { status: 500 });
  }
}

function arr(v) { return Array.isArray(v) ? v : []; }

/**
 * rewriteSummary(summaryText, resumeContext?)
 * Rewrites the professional summary section.
 */
export async function rewriteSummary(summaryText, resumeContext = '') {
  const userContent = resumeContext
    ? `CURRENT SUMMARY:\n${summaryText.trim()}\n\nRESUME CONTEXT (for reference):\n${resumeContext.trim().slice(0, 1000)}`
    : `CURRENT SUMMARY:\n${summaryText.trim()}`;

  const raw = await callAI(SUMMARY_SYSTEM, userContent);
  return {
    targetSection:       'summary',
    rewrittenSummary:    raw.rewrittenSummary    || '',
    rewrittenBullets:    { versions: arr(raw.alternativeVersions) },
    improvementNotes:    arr(raw.improvementNotes),
    keywordsAdded:       arr(raw.keywordsAdded),
    overallUpgrade:      raw.overallUpgrade || '',
  };
}

/**
 * rewriteBullets(bulletsText, resumeContext?)
 * Rewrites experience/project bullet points.
 */
export async function rewriteBullets(bulletsText, resumeContext = '') {
  const userContent = resumeContext
    ? `BULLETS TO REWRITE:\n${bulletsText.trim()}\n\nRESUME CONTEXT:\n${resumeContext.trim().slice(0, 800)}`
    : `BULLETS TO REWRITE:\n${bulletsText.trim()}`;

  const raw = await callAI(BULLETS_SYSTEM, userContent);
  return {
    targetSection:    'experience',
    rewrittenSummary: '',
    rewrittenBullets: {
      bullets:      arr(raw.rewrittenBullets),
      generalTips:  arr(raw.generalTips),
      powerVerbs:   arr(raw.powerVerbsUsed),
    },
    improvementNotes: arr(raw.improvementNotes),
    keywordsAdded:    arr(raw.powerVerbsUsed),
    overallUpgrade:   '',
  };
}

/**
 * rewriteSection(sectionName, sectionText, resumeContext?)
 * Generic section rewriter for skills, education, projects, etc.
 */
export async function rewriteSection(sectionName, sectionText, resumeContext = '') {
  const userContent = `SECTION: ${sectionName}\n\nCONTENT:\n${sectionText.trim()}${
    resumeContext ? `\n\nRESUME CONTEXT:\n${resumeContext.trim().slice(0, 800)}` : ''
  }`;
  const raw = await callAI(SECTION_SYSTEM, userContent);
  return {
    targetSection:    sectionName,
    rewrittenSummary: raw.rewrittenContent || '',
    rewrittenBullets: { changes: arr(raw.keyChanges) },
    improvementNotes: arr(raw.improvementNotes),
    keywordsAdded:    arr(raw.keywordsAdded),
    overallUpgrade:   '',
  };
}
