/**
 * recommendationReasonService.js
 * ─────────────────────────────────────────────────────────────────────────
 * Generates human-readable recommendation reasons using a single batched
 * OpenAI call for up to 10 jobs at once.
 *
 * Cost note: this is the only OpenAI call in the shortlist pipeline.
 * Results are cached in the Shortlist model (TTL 7 days), so the call
 * only fires on initial generation or after the cache expires.
 */

import OpenAI from 'openai';

const REASON_SYSTEM_PROMPT = `You are an expert career advisor generating personalised job recommendation explanations for a software professional.

Given a candidate's profile (JSON) and a list of job opportunities with their AI match scores, generate a recommendation explanation for each job.

Return ONLY a valid JSON array — no markdown, no code fences, no extra text.

Array structure (one object per job, in the same order as input):
[
  {
    "jobId":                  "<the exact jobId string provided>",
    "recommendationReason":   "<2-3 sentences: specific reasons this job fits this candidate, referencing their exact skills and experience>",
    "careerGrowthPotential":  "<1-2 sentences: concrete career advancement this role offers>",
    "missingSkills":          ["<skill explicitly required by JD but absent from profile>", ...],
    "strengths":              ["<specific profile attribute that matches this role>", ...]
  },
  ...
]

Rules:
- recommendationReason: cite specific skills, technologies, or experience — avoid generic praise
- careerGrowthPotential: focus on seniority growth, learning, or impact
- missingSkills: 0-5 items; only hard requirements absent from profile
- strengths: 2-4 concrete items from the candidate profile that match this role
- Respond with exactly one object per job in the input, preserving jobId values`;

let _client = null;

function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('AI service is not configured.'),
      { status: 503 },
    );
  }
  _client = new OpenAI({ apiKey });
  return _client;
}

/**
 * generateBatchReasons(profile, jobs)
 * ─────────────────────────────────────────────────────────────────────────
 * Single OpenAI call that returns recommendation reasons for up to 10 jobs.
 *
 * @param {object}   profile  Resume profile object
 * @param {object[]} jobs     Array of job objects (each must have _id, title, company,
 *                            description, skills, experienceLevel, salary, matchScore)
 * @returns {Array<{ jobId, recommendationReason, careerGrowthPotential, missingSkills, strengths }>}
 */
export async function generateBatchReasons(profile, jobs) {
  if (!jobs.length) return [];

  const client = getClient();

  // Trim jobs to essential fields to minimise token usage
  const jobInput = jobs.map(j => ({
    jobId:            String(j._id),
    title:            j.title,
    company:          j.company,
    location:         j.location,
    skills:           j.skills?.slice(0, 10) ?? [],
    experienceLevel:  j.experienceLevel,
    remote:           j.remote,
    salary:           j.salary || null,
    matchScore:       j.matchScore,
    descriptionSnip:  (j.description ?? '').replace(/<[^>]+>/g, '').slice(0, 400),
  }));

  const profileInput = {
    skills:          profile.skills?.slice(0, 20)        ?? [],
    technologies:    profile.technologies?.slice(0, 20)  ?? [],
    yearsExperience: profile.yearsExperience             ?? 0,
    education:       profile.education?.slice(0, 3)      ?? [],
    rolePreferences: profile.rolePreferences?.slice(0, 5) ?? [],
    summary:         profile.summary                     ?? '',
  };

  const userContent = `CANDIDATE PROFILE:\n${JSON.stringify(profileInput, null, 2)}\n\nJOBS TO EVALUATE:\n${JSON.stringify(jobInput, null, 2)}`;

  let raw;
  try {
    const completion = await client.chat.completions.create({
      model:           'gpt-4o-mini',
      messages: [
        { role: 'system', content: REASON_SYSTEM_PROMPT },
        { role: 'user',   content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature:     0.3,
      max_tokens:      3000,
    });
    raw = completion.choices[0]?.message?.content ?? '{}';
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate-limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('AI reason generation failed.'), { status: 500 });
  }

  try {
    const parsed = JSON.parse(raw);
    // OpenAI sometimes wraps the array in an object key
    const arr = Array.isArray(parsed) ? parsed : (Object.values(parsed).find(v => Array.isArray(v)) ?? []);
    return arr.map(item => ({
      jobId:                  String(item.jobId ?? ''),
      recommendationReason:   typeof item.recommendationReason  === 'string' ? item.recommendationReason  : '',
      careerGrowthPotential:  typeof item.careerGrowthPotential === 'string' ? item.careerGrowthPotential : '',
      missingSkills:          Array.isArray(item.missingSkills) ? item.missingSkills.slice(0, 6) : [],
      strengths:              Array.isArray(item.strengths)     ? item.strengths.slice(0, 5)     : [],
    }));
  } catch {
    // Return stub reasons so the pipeline doesn't fail
    return jobs.map(j => ({
      jobId:                  String(j._id),
      recommendationReason:   `This role aligns with your ${profile.skills?.[0] ?? 'technical'} background.`,
      careerGrowthPotential:  'This position offers meaningful career advancement.',
      missingSkills:          [],
      strengths:              profile.skills?.slice(0, 3) ?? [],
    }));
  }
}
