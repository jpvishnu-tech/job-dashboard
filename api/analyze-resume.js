/* ============================================================
   api/analyze-resume.js  —  Vercel Serverless Function
   Proxies resume analysis requests to OpenAI.
   The OPENAI_API_KEY environment variable must be set in the
   Vercel project settings — it is never exposed to the client.
   ============================================================ */

import OpenAI from 'openai';

// ── System prompts ─────────────────────────────────────────────────

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

// ── Handler ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS headers — tighten ALLOWED_ORIGIN in production to your domain
  res.setHeader('Access-Control-Allow-Origin',  process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { resumeText, jobDescription, mode = 'analyze' } = req.body ?? {};

  // ── Input validation ─────────────────────────────────────────────
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 100) {
    return res.status(400).json({
      error: 'Resume text is too short. Make sure your PDF has selectable text (not a scanned image).',
    });
  }

  if (resumeText.length > 15_000) {
    return res.status(400).json({
      error: 'Resume text exceeds 15,000 characters. Please use a shorter resume.',
    });
  }

  if (mode === 'match' && (!jobDescription || jobDescription.trim().length < 50)) {
    return res.status(400).json({
      error: 'Job description is too short. Please paste the full job posting.',
    });
  }

  // ── API key guard ────────────────────────────────────────────────
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[analyze-resume] OPENAI_API_KEY environment variable is not set');
    return res.status(503).json({
      error: 'AI service is not configured. Please contact the administrator.',
    });
  }

  // ── OpenAI call ──────────────────────────────────────────────────
  try {
    const openai   = new OpenAI({ apiKey });
    const isMatch  = mode === 'match';
    const messages = [
      { role: 'system', content: isMatch ? MATCH_SYSTEM   : ANALYZE_SYSTEM },
      {
        role: 'user',
        content: isMatch
          ? `RESUME:\n${resumeText.trim()}\n\nJOB DESCRIPTION:\n${jobDescription.trim()}`
          : `RESUME:\n${resumeText.trim()}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model:           'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      temperature:     0.2,
      max_tokens:      1500,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      console.error('[analyze-resume] JSON parse failed:', raw.slice(0, 200));
      return res.status(500).json({ error: 'AI returned an unexpected format. Please try again.' });
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('[analyze-resume] OpenAI error:', err.message);

    if (err.status === 429) {
      return res.status(429).json({ error: 'AI service is rate-limited. Please wait a moment and try again.' });
    }
    if (err.status === 401) {
      return res.status(500).json({ error: 'AI API key is invalid. Please contact the administrator.' });
    }
    return res.status(500).json({ error: 'AI analysis failed. Please try again.' });
  }
}
