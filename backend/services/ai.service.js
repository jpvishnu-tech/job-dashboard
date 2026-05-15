import OpenAI from 'openai';

// ── System prompts (verbatim from proven Vercel function) ─────────────────

const ANALYZE_SYSTEM = `You are a senior ATS (Applicant Tracking System) analyst and career coach with 15+ years of experience reviewing resumes for top tech companies. Analyze the provided resume and return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "atsScore": <integer 0-100>,
  "overallFeedback": "<2-3 sentence honest summary>",
  "strengths": ["<specific strength>", ...],
  "weaknesses": ["<specific weakness>", ...],
  "recommendations": ["<concrete actionable step>", ...],
  "missingElements": ["<missing resume section or info>", ...],
  "skillsFound": ["<explicitly mentioned skill>", ...],
  "formattingScore": <integer 0-100>,
  "contentScore": <integer 0-100>,
  "keywordStrength": "<low|medium|high>"
}

Scoring guide for atsScore:
- 80-100: Well-structured, keyword-rich, quantified achievements, complete sections
- 60-79:  Good but missing some elements or sparse keywords
- 40-59:  Needs significant improvement in structure or content
- 0-39:   Major issues with completeness, formatting, or keyword density

Rules:
- strengths: 3-5 specific, honest positives (not generic praise)
- weaknesses: 3-5 specific gaps or issues
- recommendations: 4-6 concrete steps the candidate can act on immediately
- missingElements: resume sections or data points that are absent
- skillsFound: technical tools, languages, frameworks, soft skills mentioned`;

const MATCH_SYSTEM = `You are a senior ATS analyst. Compare the provided resume against the job description and return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "matchScore": <integer 0-100>,
  "matchAssessment": "<2-3 sentence honest assessment of fit>",
  "matchingKeywords": ["<keyword in both resume and JD>", ...],
  "missingKeywords": ["<important JD keyword absent from resume>", ...],
  "recommendedSkills": ["<skill from JD to learn or add>", ...],
  "qualificationGaps": ["<specific requirement the candidate doesn't meet>", ...],
  "tailoringTips": ["<concrete tip to customize this resume for this role>", ...]
}

Scoring guide for matchScore:
- 80-100: Strong match — most requirements met, keywords well-aligned
- 60-79:  Good match with some gaps
- 40-59:  Moderate match — several important requirements missing
- 0-39:   Poor match — major skill or experience gaps

Rules:
- matchingKeywords: 5-12 keywords/phrases present in BOTH documents
- missingKeywords: 5-10 important terms from JD not found in resume
- recommendedSkills: 3-6 skills from JD the candidate should acquire or highlight
- qualificationGaps: specific hard requirements not met (years of experience, degrees, certs)
- tailoringTips: 4-6 precise, role-specific customization suggestions`;

// ── Client factory ────────────────────────────────────────────────────────

let _client = null;

function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('AI service is not configured. Please contact the administrator.'),
      { status: 503 },
    );
  }
  _client = new OpenAI({ apiKey });
  return _client;
}

// ── Shared call helper ────────────────────────────────────────────────────

async function callOpenAI(systemPrompt, userContent) {
  const client = getClient();

  let raw;
  try {
    const completion = await client.chat.completions.create({
      model:           'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent  },
      ],
      response_format: { type: 'json_object' },
      temperature:     0.2,
      max_tokens:      1500,
    });
    raw = completion.choices[0]?.message?.content ?? '{}';
  } catch (err) {
    if (err.status === 429) {
      throw Object.assign(
        new Error('AI service is rate-limited. Please wait a moment and try again.'),
        { status: 429 },
      );
    }
    if (err.status === 401) {
      throw Object.assign(
        new Error('AI API key is invalid. Please contact the administrator.'),
        { status: 500 },
      );
    }
    throw Object.assign(new Error('AI analysis failed. Please try again.'), { status: 500 });
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(
      new Error('AI returned an unexpected format. Please try again.'),
      { status: 500 },
    );
  }
}

// ── Public API ────────────────────────────────────────────────────────────

export async function analyze(resumeText) {
  return callOpenAI(ANALYZE_SYSTEM, `RESUME:\n${resumeText.trim()}`);
}

export async function match(resumeText, jobDescription) {
  return callOpenAI(
    MATCH_SYSTEM,
    `RESUME:\n${resumeText.trim()}\n\nJOB DESCRIPTION:\n${jobDescription.trim()}`,
  );
}

// ── Profile extraction (for job matching engine) ──────────────────────────

const PROFILE_SYSTEM = `You are an expert technical recruiter and resume parser. Extract a structured candidate profile from the resume text and return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "skills": ["<technical skill, programming language, tool, framework>", ...],
  "technologies": ["<specific technology, platform, cloud service, database>", ...],
  "yearsExperience": <integer — total years of professional work experience, 0 if student/entry>,
  "education": ["<Degree in Field — University, Year>", ...],
  "rolePreferences": ["<job title or role type the candidate is suited for>", ...],
  "summary": "<2-3 sentence professional summary of the candidate's profile>"
}

Rules:
- skills: 5-20 items; technical and soft skills explicitly mentioned
- technologies: 3-15 items; specific tools/platforms (e.g. "AWS", "PostgreSQL", "Docker")
- yearsExperience: derive from work history dates; 0 for fresh graduates
- education: 1-4 entries in the format shown
- rolePreferences: 2-6 role titles this person is best matched for (e.g. "Senior Backend Engineer", "DevOps Engineer")
- summary: concise, third-person professional pitch`;

const JOB_MATCH_FAST_SYSTEM = `You are a senior technical recruiter performing a fast resume-to-job match. You receive a candidate profile (structured JSON) and a job description. Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "matchScore": <integer 0-100>,
  "rankingScore": <integer 0-100 — composite score weighting skills 50%, experience 30%, education 20%>,
  "matchReason": "<1-2 sentence explanation of why this is or isn't a strong fit>",
  "missingSkills": ["<skill required by JD but absent from profile>", ...],
  "strengths": ["<specific strength that makes this candidate well-suited>", ...]
}

Scoring guide for matchScore:
- 80-100: Excellent fit — most required skills present, experience aligns
- 60-79:  Good fit with minor gaps
- 40-59:  Partial fit — some key skills missing
- 0-39:   Poor fit — significant skill or experience gap

Rules:
- missingSkills: 0-8 items; only list skills explicitly required by the JD
- strengths: 2-5 items; concrete positives from the profile that match this role
- rankingScore: may differ from matchScore to surface high-potential candidates with transferable skills`;

export async function extractProfile(resumeText) {
  const result = await callOpenAI(
    PROFILE_SYSTEM,
    `RESUME:\n${resumeText.trim()}`,
  );
  return {
    skills:          Array.isArray(result.skills)          ? result.skills          : [],
    technologies:    Array.isArray(result.technologies)    ? result.technologies    : [],
    yearsExperience: typeof result.yearsExperience === 'number' ? result.yearsExperience : 0,
    education:       Array.isArray(result.education)       ? result.education       : [],
    rolePreferences: Array.isArray(result.rolePreferences) ? result.rolePreferences : [],
    summary:         typeof result.summary === 'string'    ? result.summary         : '',
  };
}

export async function matchJobFast(profile, jobText) {
  const profileStr = JSON.stringify(profile, null, 2);
  const result = await callOpenAI(
    JOB_MATCH_FAST_SYSTEM,
    `CANDIDATE PROFILE (JSON):\n${profileStr}\n\nJOB DESCRIPTION:\n${jobText.trim()}`,
  );
  return {
    matchScore:    typeof result.matchScore    === 'number' ? Math.min(100, Math.max(0, result.matchScore))    : 0,
    rankingScore:  typeof result.rankingScore  === 'number' ? Math.min(100, Math.max(0, result.rankingScore))  : 0,
    matchReason:   typeof result.matchReason   === 'string' ? result.matchReason   : '',
    missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
    strengths:     Array.isArray(result.strengths)     ? result.strengths     : [],
  };
}
