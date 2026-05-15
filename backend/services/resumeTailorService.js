/**
 * resumeTailorService.js
 * AI-powered resume tailoring engine.
 *
 * Functions:
 *   extractSkillsFromResume  — parse skills from resume text
 *   extractSkillsFromJob     — parse requirements from job description
 *   compareResumeToJob       — algorithmic gap analysis (no AI)
 *   calculateATSMatchScore   — comprehensive ATS scoring via AI
 *   optimizeResumeBullets    — rewrite bullets for job alignment
 *   generateTailoredResume   — full tailored resume plan + projected score
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function parse(text, fallback) {
  try   { return JSON.parse(text); }
  catch { return fallback; }
}

// ── extractSkillsFromResume ───────────────────────────────────
/**
 * Extract structured skills from resume text.
 * Returns { technical, soft, tools, languages }
 */
export async function extractSkillsFromResume(resumeText) {
  const resp = await openai.chat.completions.create({
    model:           'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature:     0.1,
    max_tokens:      600,
    messages: [
      {
        role:    'system',
        content: 'You are a resume parser. Extract every skill, technology, and tool mentioned in the resume.',
      },
      {
        role:    'user',
        content: `Extract all skills from this resume:

${resumeText.slice(0, 3000)}

Return JSON:
{
  "technical":  ["React", "Node.js", "Python"],
  "soft":       ["leadership", "communication"],
  "tools":      ["Git", "Docker", "Jira"],
  "languages":  ["JavaScript", "Python", "SQL"]
}`,
      },
    ],
  });
  return parse(resp.choices[0].message.content, {
    technical: [], soft: [], tools: [], languages: [],
  });
}

// ── extractSkillsFromJob ──────────────────────────────────────
/**
 * Extract requirements from a job description.
 * Returns { required, preferred, niceToHave, experienceYears, roleLevel, roleTitle }
 */
export async function extractSkillsFromJob(jobDescription) {
  const resp = await openai.chat.completions.create({
    model:           'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature:     0.1,
    max_tokens:      600,
    messages: [
      {
        role:    'system',
        content: 'You are a job description analyzer. Extract requirements with high precision.',
      },
      {
        role:    'user',
        content: `Extract requirements from this job description:

${jobDescription.slice(0, 3000)}

Return JSON:
{
  "required":       ["skill1", "skill2"],
  "preferred":      ["skill1"],
  "niceToHave":     ["skill1"],
  "experienceYears": 3,
  "roleLevel":      "junior|mid|senior|lead|executive",
  "roleTitle":      "inferred role title"
}`,
      },
    ],
  });
  return parse(resp.choices[0].message.content, {
    required: [], preferred: [], niceToHave: [],
    experienceYears: null, roleLevel: 'mid', roleTitle: '',
  });
}

// ── compareResumeToJob ────────────────────────────────────────
/**
 * Pure algorithmic comparison — no AI call.
 * Returns { overallMatch, requiredScore, preferredScore, matched, missing, totals }
 */
export function compareResumeToJob(resumeSkills, jobSkills) {
  const flat = [
    ...resumeSkills.technical,
    ...resumeSkills.soft,
    ...resumeSkills.tools,
    ...resumeSkills.languages,
  ].map(s => s.toLowerCase());

  const has = (skill) =>
    flat.some(rs =>
      rs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(rs)
    );

  const matchedRequired  = jobSkills.required.filter(has);
  const matchedPreferred = jobSkills.preferred.filter(has);
  const missingRequired  = jobSkills.required.filter(s => !has(s));
  const missingPreferred = jobSkills.preferred.filter(s => !has(s));

  const reqScore  = jobSkills.required.length  > 0
    ? Math.round((matchedRequired.length  / jobSkills.required.length)  * 100) : 100;
  const prefScore = jobSkills.preferred.length > 0
    ? Math.round((matchedPreferred.length / jobSkills.preferred.length) * 100) : 100;

  return {
    overallMatch:   Math.round(reqScore * 0.7 + prefScore * 0.3),
    requiredScore:  reqScore,
    preferredScore: prefScore,
    matched:  { required: matchedRequired,  preferred: matchedPreferred },
    missing:  { required: missingRequired,  preferred: missingPreferred, niceToHave: jobSkills.niceToHave },
    totals:   { required: jobSkills.required.length, preferred: jobSkills.preferred.length },
  };
}

// ── calculateATSMatchScore ────────────────────────────────────
/**
 * Deep ATS scoring — keyword, skill, experience, formatting analysis.
 * Returns full breakdown with improvement recommendations.
 */
export async function calculateATSMatchScore(resumeText, jobDescription) {
  const resp = await openai.chat.completions.create({
    model:           'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature:     0.15,
    max_tokens:      1500,
    messages: [
      {
        role:    'system',
        content: 'You are an expert ATS (Applicant Tracking System) scoring engine. Score resumes accurately based on keyword density, skill alignment, experience match, and ATS formatting.',
      },
      {
        role:    'user',
        content: `Score this resume against the job description for ATS compatibility.

RESUME:
${resumeText.slice(0, 3000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

Return JSON:
{
  "atsScore":              0-100,
  "keywordMatchScore":     0-100,
  "skillMatchScore":       0-100,
  "experienceMatchScore":  0-100,
  "formattingScore":       0-100,
  "overallAssessment":     "2-3 sentence summary of fit",
  "matchedKeywords":       ["kw1"],
  "missingKeywords":       ["kw1"],
  "missingSkills": {
    "critical":   ["skill1"],
    "important":  ["skill1"],
    "niceToHave": ["skill1"]
  },
  "improvements": [
    { "area": "summary|skills|experience|keywords|formatting", "suggestion": "...", "impact": "high|medium|low" }
  ],
  "strengths":  ["str1"],
  "weaknesses": ["w1"]
}`,
      },
    ],
  });
  return parse(resp.choices[0].message.content, {
    atsScore: 50, keywordMatchScore: 50, skillMatchScore: 50,
    experienceMatchScore: 50, formattingScore: 70,
    overallAssessment: '', matchedKeywords: [], missingKeywords: [],
    missingSkills: { critical: [], important: [], niceToHave: [] },
    improvements: [], strengths: [], weaknesses: [],
  });
}

// ── optimizeResumeBullets ─────────────────────────────────────
/**
 * Rewrite experience bullets to be ATS-friendly and job-aligned.
 * Returns { optimizedBullets: [{ original, tailored, addedKeywords, improvement }], generalTips }
 */
export async function optimizeResumeBullets(bulletsText, jobDescription) {
  const resp = await openai.chat.completions.create({
    model:           'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature:     0.35,
    max_tokens:      2000,
    messages: [
      {
        role:    'system',
        content: 'You are a professional resume writer. Rewrite experience bullets to use strong action verbs, quantifiable results where possible, and ATS keywords from the job description. Maintain authenticity.',
      },
      {
        role:    'user',
        content: `Optimize these resume bullets for the target job.

BULLETS:
${bulletsText.slice(0, 2000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 1500)}

Return JSON:
{
  "optimizedBullets": [
    {
      "original":      "exact original bullet text",
      "tailored":      "improved version with action verb + keywords",
      "addedKeywords": ["kw1"],
      "improvement":   "brief reason why this is stronger"
    }
  ],
  "generalTips": ["tip1"]
}`,
      },
    ],
  });
  return parse(resp.choices[0].message.content, {
    optimizedBullets: [], generalTips: [],
  });
}

// ── generateTailoredResume ────────────────────────────────────
/**
 * Master function — generates a fully tailored resume plan with
 * projected ATS score, section rewrites, and bullet optimizations.
 */
export async function generateTailoredResume(resumeText, jobDescription, options = {}) {
  const { jobTitle = '', company = '' } = options;
  const context = [jobTitle, company].filter(Boolean).join(' at ');

  const resp = await openai.chat.completions.create({
    model:           'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature:     0.3,
    max_tokens:      3000,
    messages: [
      {
        role:    'system',
        content: `You are an elite resume tailoring specialist. Maximize the candidate's ATS score by:
1. Rewriting the professional summary to match the role precisely
2. Optimizing experience bullets with job-relevant keywords and strong verbs
3. Reordering and highlighting the most relevant skills
4. Providing specific, actionable improvements per section
Maintain the candidate's authentic voice. Be concrete and specific.`,
      },
      {
        role:    'user',
        content: `Tailor this resume${context ? ` for ${context}` : ' for the job below'}.

RESUME:
${resumeText.slice(0, 3500)}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

Return JSON:
{
  "projectedAtsScore":     0-100,
  "tailoredSummary":       "optimized 3-5 sentence professional summary matching the role",
  "skillsToHighlight":     ["skill1"],
  "skillsToAdd":           ["skill1"],
  "keywordsToIncorporate": ["kw1"],
  "sectionImprovements": [
    {
      "section":  "Summary|Experience|Skills|Education|Projects",
      "type":     "rewrite|add|remove|reorder|expand",
      "original": "original text or null",
      "improved": "improved version",
      "reason":   "why this change improves ATS score"
    }
  ],
  "bulletRewrites": [
    {
      "original":      "original bullet text",
      "tailored":      "improved bullet with action verb and keywords",
      "addedKeywords": ["kw1"],
      "impact":        "high|medium|low"
    }
  ],
  "topRecommendations": ["rec1", "rec2", "rec3", "rec4", "rec5"],
  "atsKeywordsFound":   ["kw1"],
  "atsCriticalMissing": ["kw1"]
}`,
      },
    ],
  });

  return parse(resp.choices[0].message.content, {
    projectedAtsScore:     60,
    tailoredSummary:       '',
    skillsToHighlight:     [],
    skillsToAdd:           [],
    keywordsToIncorporate: [],
    sectionImprovements:   [],
    bulletRewrites:        [],
    topRecommendations:    [],
    atsKeywordsFound:      [],
    atsCriticalMissing:    [],
  });
}
