/**
 * coverLetterGenerator.service.js
 * AI-powered cover letter generation with tone control and ATS optimization.
 * Also generates a role-specific application checklist and AI recommendations.
 */

import OpenAI from 'openai';

const CL_SYSTEM = `You are an elite career coach and professional writer who has helped thousands of candidates land roles at top tech companies. Generate a personalized, ATS-optimized cover letter AND a practical application checklist. Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "coverLetter": "<full cover letter text, 3-4 paragraphs, no salutation placeholder — use 'Dear Hiring Team,' or 'Dear [Company] Team,'>",
  "subjectLine": "<email subject line for this application>",
  "keyHighlights": ["<specific achievement or skill to emphasize>"],
  "checklist": [
    { "item": "<specific action to take>", "category": "<Resume|Research|Portfolio|Skills|Networking|Admin>", "priority": "<high|medium|low>" }
  ],
  "aiRecommendations": ["<strategic advice specific to this role and company>"],
  "toneUsed": "<professional|enthusiastic|technical|concise>"
}

Cover letter rules:
- Tone PROFESSIONAL: formal, confident, achievement-focused, third-person impact language
- Tone ENTHUSIASTIC: warm, energetic, passion-driven, specific company knowledge
- Tone TECHNICAL: lead with technical depth, mention specific systems/tech, quantified impact
- Tone CONCISE: 2 paragraphs max, punchy, scannable — best for senior roles
- NEVER use: "I am writing to apply", "Please find attached", "To whom it may concern"
- Open with a hook: a quantified achievement, a genuine company connection, or a bold value statement
- Paragraph 1: Hook + role-specific value proposition (why you + why this role)
- Paragraph 2: 2-3 specific achievements mapped to job requirements (use numbers)
- Paragraph 3: Company alignment + culture fit + enthusiasm (research-informed)
- Closing: Confident call-to-action, no "looking forward to hearing from you"
- Max 320 words
- ATS-friendly: include 3-5 key job title keywords naturally

Checklist rules:
- 6-10 items covering the full application process
- Categories: Resume (tailor it), Research (company/role), Portfolio (showcase work), Skills (gaps to address/mention), Networking (LinkedIn/referrals), Admin (deadlines/follow-up)
- Include at least 1 item per category
- prioritize items that have the highest impact on success

aiRecommendations rules:
- 3-5 strategic insights specific to this company and role
- Include: insider tips, red flags to address, things to research, specific talking points`;

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
      temperature:     0.4,
      max_tokens:      2000,
    });
    raw = completion.choices[0]?.message?.content ?? '{}';
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate-limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('Cover letter generation failed. Please try again.'), { status: 500 });
  }
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('AI returned unexpected format.'), { status: 500 }); }
}

function arr(v) { return Array.isArray(v) ? v : []; }

function jobSummary(job) {
  return [
    `Job Title: ${job.title}`,
    `Company: ${job.company}`,
    `Location: ${job.location || 'Not specified'}`,
    job.remote ? 'Remote: Yes' : '',
    job.type ? `Type: ${job.type}` : '',
    job.experienceLevel ? `Experience Level: ${job.experienceLevel}` : '',
    job.salaryMin || job.salaryMax ? `Salary Range: $${job.salaryMin?.toLocaleString() || '?'} – $${job.salaryMax?.toLocaleString() || '?'}` : '',
    job.skills?.length ? `Required Skills: ${job.skills.join(', ')}` : '',
    `Job Description:\n${(job.description || '').slice(0, 1200)}`,
  ].filter(Boolean).join('\n');
}

/**
 * generateCoverLetter(resumeText, job, options)
 * @param {string} resumeText — candidate's full resume text
 * @param {object} job        — job document
 * @param {object} options    — { tone: 'professional'|'enthusiastic'|'technical'|'concise' }
 */
export async function generateCoverLetter(resumeText, job, options = {}) {
  const tone    = ['professional', 'enthusiastic', 'technical', 'concise'].includes(options.tone)
    ? options.tone : 'professional';

  const content = [
    `CANDIDATE RESUME:\n${resumeText.slice(0, 3000)}`,
    `\nJOB LISTING:\n${jobSummary(job)}`,
    `\nTONE: ${tone.toUpperCase()}`,
    options.focusAreas?.length ? `\nFOCUS AREAS (emphasize these): ${options.focusAreas.join(', ')}` : '',
  ].filter(Boolean).join('');

  const raw = await callAI(CL_SYSTEM, content);

  return {
    coverLetter:        raw.coverLetter        || '',
    subjectLine:        raw.subjectLine        || `Application: ${job.title} — ${job.company}`,
    keyHighlights:      arr(raw.keyHighlights),
    checklist:          arr(raw.checklist).map(c => ({
      item:     c.item     || '',
      category: c.category || 'general',
      priority: ['high', 'medium', 'low'].includes(c.priority) ? c.priority : 'medium',
      done:     false,
    })),
    aiRecommendations:  arr(raw.aiRecommendations),
    toneUsed:           raw.toneUsed || tone,
  };
}
