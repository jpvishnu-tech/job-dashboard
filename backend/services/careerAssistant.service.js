import OpenAI      from 'openai';
import CareerPlan  from '../models/CareerPlan.js';
import Resume      from '../models/Resume.js';
import Application from '../models/Application.js';

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('AI service not configured'), { status: 503 });
  _client = new OpenAI({ apiKey });
  return _client;
}

async function callAI(system, user, maxTokens = 1800) {
  try {
    const c = await getClient().chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: { type: 'json_object' },
      temperature:     0.3,
      max_tokens:      maxTokens,
    });
    return JSON.parse(c.choices[0]?.message?.content ?? '{}');
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('Skills gap analysis failed. Please try again.'), { status: 500 });
  }
}

// ── System Prompt ─────────────────────────────────────────────────────────

const SKILLS_GAP_SYSTEM = `You are a senior technical recruiter and career coach with expertise in skills demand analysis. Analyse the candidate's profile against their target role. Return ONLY a valid JSON object — no markdown, no code fences.

Required JSON structure:
{
  "targetRoleOverview": "<2-sentence description of what this role requires in today's market>",
  "matchScore": <integer 0-100 — how well the candidate matches today>,
  "currentStrengths": ["<relevant skill or experience the candidate already has>", ...],
  "missingSkills": [
    {
      "skill": "<specific skill name>",
      "priority": "<critical | important | nice_to_have>",
      "estimatedLearningWeeks": <integer 1-52>,
      "demandLevel": "<very_high | high | medium | low>",
      "trend": "<growing | stable | declining>"
    }
  ],
  "trendingTechnologies": [
    {
      "tech": "<technology name>",
      "demandLevel": "<very_high | high | medium>",
      "adoptionStage": "<mainstream | emerging | cutting_edge>"
    }
  ],
  "recruiterExpectations": ["<what technical recruiters specifically look for>", ...],
  "priorityLearningPath": ["<skill to learn in this order — ordered by impact and prerequisite>", ...]
}

Rules:
- missingSkills: 4-10 items, ordered by priority (critical first)
- trendingTechnologies: 5-8 items relevant to the role
- recruiterExpectations: 4-6 concrete expectations
- priorityLearningPath: 5-8 ordered skills (subset of missingSkills, highest-impact first)
- matchScore: honest — 0-39 large gaps, 40-69 partial match, 70-100 strong match`;

// ── Cache for skills gap (24h TTL per user) ────────────────────────────────

const SKILLS_GAP_TTL = 24 * 60 * 60 * 1000;

function isStale(date) {
  return !date || Date.now() - new Date(date).getTime() > SKILLS_GAP_TTL;
}

// ── Public API ────────────────────────────────────────────────────────────

export async function getSkillsGap(userId, targetRoleOverride) {
  const [resume, plan, apps] = await Promise.all([
    Resume.findOne({ user: userId }).select('resumeProfile lastAtsScore').lean(),
    CareerPlan.findOne({ user: userId }).lean(),
    Application.find({ user: userId })
      .select('role status')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  // Determine target role
  const targetRole = targetRoleOverride
    || plan?.targetRole
    || inferTargetRole(apps);

  if (!targetRole) {
    return { hasTargetRole: false };
  }

  // Return cached if fresh
  const cached = plan?.skillsGap;
  if (
    cached?.analysedAt
    && !isStale(cached.analysedAt)
    && (!targetRoleOverride || plan?.targetRole === targetRoleOverride)
  ) {
    return { ...cached, cached: true };
  }

  // Guard: needs resume profile
  if (!resume?.resumeProfile?.skills?.length) {
    return { hasResume: !!resume, hasProfile: false, targetRole };
  }

  // Build input
  const profile  = resume.resumeProfile;
  const atsScore = resume.lastAtsScore;

  const lines = [
    `TARGET ROLE: ${targetRole}`,
    `\nCANDIDATE PROFILE:`,
    `Years of experience: ${profile.yearsExperience ?? 0}`,
    `Skills: ${profile.skills.slice(0, 25).join(', ')}`,
    profile.technologies?.length ? `Technologies: ${profile.technologies.slice(0, 15).join(', ')}` : '',
    profile.education?.length    ? `Education: ${profile.education.join(' | ')}`                   : '',
    profile.summary              ? `Summary: ${profile.summary}`                                    : '',
    atsScore !== null            ? `Resume ATS score: ${atsScore}/100`                             : '',
    apps.length
      ? `\nRECENT APPLICATIONS (roles applied to):\n${[...new Set(apps.map(a => a.role))].slice(0, 5).join(', ')}`
      : '',
  ].filter(Boolean);

  const raw = await callAI(SKILLS_GAP_SYSTEM, lines.join('\n'), 1800);

  const skillsGap = {
    targetRoleOverview:    raw.targetRoleOverview    || '',
    matchScore:            typeof raw.matchScore === 'number' ? Math.min(100, Math.max(0, Math.round(raw.matchScore))) : null,
    currentStrengths:      Array.isArray(raw.currentStrengths)      ? raw.currentStrengths      : [],
    missingSkills:         Array.isArray(raw.missingSkills)         ? raw.missingSkills         : [],
    trendingTechnologies:  Array.isArray(raw.trendingTechnologies)  ? raw.trendingTechnologies  : [],
    recruiterExpectations: Array.isArray(raw.recruiterExpectations) ? raw.recruiterExpectations : [],
    priorityLearningPath:  Array.isArray(raw.priorityLearningPath)  ? raw.priorityLearningPath  : [],
    analysedAt:            new Date(),
  };

  // Save/update the career plan
  await CareerPlan.findOneAndUpdate(
    { user: userId },
    { $set: { skillsGap, ...(targetRoleOverride ? { targetRole: targetRoleOverride } : {}) } },
    { upsert: true },
  );

  return skillsGap;
}

// Infer most-likely target role from recent applications
function inferTargetRole(apps) {
  if (!apps.length) return null;
  const freq = {};
  for (const a of apps) if (a.role) freq[a.role] = (freq[a.role] || 0) + 1;
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}
