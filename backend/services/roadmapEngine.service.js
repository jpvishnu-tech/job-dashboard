import OpenAI      from 'openai';
import CareerPlan  from '../models/CareerPlan.js';
import Resume      from '../models/Resume.js';

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('AI service not configured'), { status: 503 });
  _client = new OpenAI({ apiKey });
  return _client;
}

async function callAI(system, user, maxTokens = 2000) {
  try {
    const c = await getClient().chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: { type: 'json_object' },
      temperature:     0.4,
      max_tokens:      maxTokens,
    });
    return JSON.parse(c.choices[0]?.message?.content ?? '{}');
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('AI generation failed. Please try again.'), { status: 500 });
  }
}

// ── System Prompt ─────────────────────────────────────────────────────────

const ROADMAP_SYSTEM = `You are a senior career strategist and technology educator with deep knowledge of the current tech job market. Generate a detailed, phased, and actionable career roadmap. Return ONLY a valid JSON object — no markdown, no code fences.

Required JSON structure:
{
  "summary": "<2-3 sentence overview of the transition plan and what success looks like>",
  "totalDuration": "<e.g. '12-18 months'>",
  "difficulty": "<beginner | intermediate | advanced>",
  "phases": [
    {
      "phase": <integer 1-5>,
      "title": "<phase title, e.g. 'Foundation Building'>",
      "duration": "<e.g. '2-3 months'>",
      "focus": "<primary focus of this phase in one sentence>",
      "skills": ["<specific skill, e.g. 'TypeScript generics'>", ...],
      "milestones": ["<measurable outcome, e.g. 'Build a REST API with auth'>", ...],
      "resources": [
        { "title": "<name>", "type": "<course|book|project|practice|article>", "priority": "<high|medium|low>" }
      ]
    }
  ],
  "keyTechnologies": ["<critical tech>", ...],
  "marketInsight": "<2-3 sentences about current demand and hiring landscape for this role>",
  "quickWins": ["<actionable item achievable this week>", ...]
}

Rules: 3-5 phases; 3-6 skills per phase; 2-4 milestones per phase; 2-4 resources per phase; skills must be specific; milestones must be measurable; quickWins: 3-5 items.`;

// ── Public API ────────────────────────────────────────────────────────────

export async function getCareerPlan(userId) {
  return CareerPlan.findOne({ user: userId }).lean();
}

export async function generateRoadmap(userId, {
  targetRole, currentRole, experienceLevel = 'mid',
  goals = [], timelineMonths = 12,
}) {
  if (!targetRole?.trim()) throw Object.assign(new Error('targetRole is required'), { status: 400 });

  // Get resume profile for context
  const resume = await Resume.findOne({ user: userId }).select('resumeProfile lastAtsScore').lean();
  const profile = resume?.resumeProfile ?? {};

  const lines = [
    `TRANSITION REQUEST:`,
    `Current role: ${currentRole || 'Not specified'}`,
    `Target role: ${targetRole}`,
    `Experience level: ${experienceLevel}`,
    `Timeline: ${timelineMonths} months`,
    goals.length ? `Goals:\n${goals.map(g => `- ${g}`).join('\n')}` : '',
    profile.skills?.length
      ? `\nCANDIDATE'S CURRENT SKILLS:\n${profile.skills.slice(0, 20).join(', ')}`
      : '',
    profile.yearsExperience
      ? `Years of experience: ${profile.yearsExperience}`
      : '',
    profile.summary ? `\nProfile: ${profile.summary}` : '',
  ].filter(Boolean);

  const raw = await callAI(ROADMAP_SYSTEM, lines.join('\n'), 2200);

  // Normalise AI output
  const roadmap = {
    summary:         raw.summary         || '',
    totalDuration:   raw.totalDuration   || `${timelineMonths} months`,
    difficulty:      ['beginner','intermediate','advanced'].includes(raw.difficulty) ? raw.difficulty : 'intermediate',
    phases:          Array.isArray(raw.phases) ? raw.phases : [],
    keyTechnologies: Array.isArray(raw.keyTechnologies) ? raw.keyTechnologies : [],
    marketInsight:   raw.marketInsight   || '',
    quickWins:       Array.isArray(raw.quickWins) ? raw.quickWins : [],
    generatedAt:     new Date(),
  };

  // Build initial learning progress from all skills across phases
  const allSkills = [];
  for (const phase of roadmap.phases) {
    for (const skill of (phase.skills || [])) {
      allSkills.push({ skill, phase: phase.phase, status: 'not_started' });
    }
  }

  // Upsert the career plan
  const plan = await CareerPlan.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        currentRole, targetRole, experienceLevel, goals, timelineMonths,
        roadmap,
        learningProgress: allSkills,
      },
    },
    { new: true, upsert: true },
  );

  return plan;
}

export async function updateLearningProgress(userId, skill, status) {
  const plan = await CareerPlan.findOne({ user: userId });
  if (!plan) throw Object.assign(new Error('Career plan not found'), { status: 404 });

  const item = plan.learningProgress.find(p => p.skill === skill);
  if (!item) throw Object.assign(new Error('Skill not found in progress'), { status: 404 });

  item.status = status;
  if (status === 'in_progress' && !item.startedAt)   item.startedAt   = new Date();
  if (status === 'completed'   && !item.completedAt) item.completedAt = new Date();
  if (status === 'not_started') { item.startedAt = null; item.completedAt = null; }

  await plan.save();
  return plan.learningProgress;
}
