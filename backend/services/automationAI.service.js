import OpenAI      from 'openai';
import Application from '../models/Application.js';
import Resume      from '../models/Resume.js';

// ── OpenAI client ────────────────────────────────────────────────────────

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('AI service not configured'), { status: 503 });
  _client = new OpenAI({ apiKey });
  return _client;
}

async function callAI(systemPrompt, userContent, maxTokens = 1000) {
  try {
    const completion = await getClient().chat.completions.create({
      model:           'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent   },
      ],
      response_format: { type: 'json_object' },
      temperature:     0.3,
      max_tokens:      maxTokens,
    });
    return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate limited. Try again shortly.'), { status: 429 });
    if (err.status === 401) throw Object.assign(new Error('AI service misconfigured.'), { status: 500 });
    throw Object.assign(new Error('AI generation failed. Please try again.'), { status: 500 });
  }
}

// ── System prompts ────────────────────────────────────────────────────────

const TASKS_SYSTEM = `You are a career strategist AI assistant. Given a user's job application pipeline data, generate a prioritized list of actionable tasks to help them advance their job search. Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "tasks": [
    {
      "type": "<task type — see list below>",
      "title": "<concise action title, max 70 chars>",
      "description": "<1-2 sentence specific, actionable instruction>",
      "priority": "<high | medium | low>",
      "dueInDays": <integer 1-14 or null>
    }
  ],
  "pipelineHealth": "<excellent | good | needs_attention | critical>",
  "healthNote": "<1-2 sentence honest assessment of the overall job search state>"
}

Valid task types: apply_to_job, follow_up_application, prepare_interview, research_company, update_resume, reach_out_recruiter, review_offer, improve_profile, add_skills, practice_interview, custom

Rules:
- Generate 4-7 tasks total
- Prioritise based on urgency and career impact
- Each task must be specific and actionable — no generic advice
- high priority: time-sensitive (interview soon, offer pending) or high-impact actions
- dueInDays: realistic timeframe; null if no clear deadline`;

const COVER_LETTER_SYSTEM = `You are an expert cover letter writer. Write compelling, personalised cover letters that highlight the specific match between the candidate's profile and the role requirements. Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "coverLetter": "<full cover letter text — 3-4 paragraphs, greeting, body, closing>",
  "subject": "<professional email subject line>",
  "keyHighlights": ["<highlight 1>", "<highlight 2>", "<highlight 3>"],
  "toneUsed": "<brief description of the tone and approach>"
}

Rules:
- coverLetter: 250-400 words, formal greeting ("Dear Hiring Manager,"), sign-off ("Sincerely, [Your Name]")
- Opening: show genuine, informed interest in THIS specific company and role
- Body (1-2 paragraphs): connect 2-3 of the candidate's concrete achievements to the role's requirements
- Closing: enthusiasm, call to action, availability
- Do NOT use clichés: "I am writing to express my interest", "perfect fit", "passionate about"
- Tailor the tone to the specified preference (professional / enthusiastic / concise)
- subject: "Application for [Role] — [Name]" format`;

// ── AI Task Generation ────────────────────────────────────────────────────

export async function generateAITasks(userId) {
  const now  = new Date();

  const [apps, resume] = await Promise.all([
    Application.find({
      user:   userId,
      status: { $nin: ['hired'] },
    }).select('company role status createdAt updatedAt appliedAt interviews').lean(),
    Resume.findOne({ user: userId }).select('resumeProfile lastAtsScore').lean(),
  ]);

  // Build pipeline summary
  const byStatus = {};
  let stalled = 0, upcomingInterviews = 0, offersReceived = 0;

  for (const app of apps) {
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    const daysSince = Math.floor((now - new Date(app.updatedAt)) / 86_400_000);
    if (['applied', 'under_review'].includes(app.status) && daysSince >= 7) stalled++;
    if (app.status === 'offer_received') offersReceived++;
    if (app.interviews?.some(i => i.status === 'scheduled' && new Date(i.scheduledAt) > now)) {
      upcomingInterviews++;
    }
  }

  const profileSummary = resume?.resumeProfile?.summary || '';
  const atsScore       = resume?.lastAtsScore ?? null;

  const lines = [
    `APPLICATION PIPELINE:`,
    `Total active applications: ${apps.length}`,
    `By stage: ${JSON.stringify(byStatus)}`,
    `Stalled (7+ days without progress): ${stalled}`,
    `Upcoming interviews: ${upcomingInterviews}`,
    `Pending offers to review: ${offersReceived}`,
  ];

  if (profileSummary) lines.push(`\nCANDIDATE SUMMARY:\n${profileSummary}`);
  if (atsScore !== null) lines.push(`Resume ATS score: ${atsScore}/100`);

  const raw = await callAI(TASKS_SYSTEM, lines.join('\n'), 1200);

  return {
    tasks:          Array.isArray(raw.tasks)            ? raw.tasks          : [],
    pipelineHealth: typeof raw.pipelineHealth === 'string' ? raw.pipelineHealth : 'good',
    healthNote:     typeof raw.healthNote     === 'string' ? raw.healthNote     : '',
  };
}

// ── Cover Letter Generation ───────────────────────────────────────────────

export async function generateCoverLetter(userId, { company, role, description, tone = 'professional', candidateName = '' }) {
  const resume = await Resume.findOne({ user: userId }).select('resumeProfile').lean();
  const profile = resume?.resumeProfile ?? null;

  const profileLines = [];
  if (profile?.summary)         profileLines.push(`Summary: ${profile.summary}`);
  if (profile?.skills?.length)  profileLines.push(`Skills: ${profile.skills.slice(0, 15).join(', ')}`);
  if (profile?.yearsExperience) profileLines.push(`Years of experience: ${profile.yearsExperience}`);
  if (profile?.education?.length) profileLines.push(`Education: ${profile.education.join(' | ')}`);
  if (profile?.rolePreferences?.length) profileLines.push(`Best-fit roles: ${profile.rolePreferences.join(', ')}`);

  const lines = [
    `CANDIDATE PROFILE:`,
    profileLines.length ? profileLines.join('\n') : 'No profile data available — write a strong general cover letter.',
    ``,
    `JOB DETAILS:`,
    `Company: ${company}`,
    `Role: ${role}`,
    `Tone preference: ${tone}`,
    candidateName ? `Candidate name: ${candidateName}` : '',
    ``,
    `JOB DESCRIPTION (excerpt):`,
    description ? description.slice(0, 1500) : 'No description provided — focus on the role title and company name.',
  ];

  const raw = await callAI(COVER_LETTER_SYSTEM, lines.filter(Boolean).join('\n'), 1500);

  return {
    coverLetter:    typeof raw.coverLetter   === 'string' ? raw.coverLetter    : '',
    subject:        typeof raw.subject       === 'string' ? raw.subject        : `Application for ${role} — ${company}`,
    keyHighlights:  Array.isArray(raw.keyHighlights) ? raw.keyHighlights : [],
    toneUsed:       typeof raw.toneUsed      === 'string' ? raw.toneUsed       : tone,
    generatedAt:    new Date(),
  };
}

// ── Resume Recommendations (from cached analyses) ─────────────────────────
// No AI call — reads the latest analyze-type analysis from the Resume model
// and categorises the data into 4 actionable areas.

export async function getResumeRecommendations(userId) {
  const resume = await Resume.findOne({ user: userId })
    .select('lastAtsScore resumeProfile analyses')
    .lean();

  if (!resume) return { hasResume: false };

  const latest = resume.analyses?.find(a => a.type === 'analyze');
  if (!latest) return { hasResume: true, hasAnalysis: false, atsScore: resume.lastAtsScore };

  const allRecs  = latest.recommendations  || [];
  const allWeaks = latest.weaknesses        || [];
  const missing  = latest.missingElements   || [];

  const categories = {
    missing_skills:         [],
    ats_improvements:       [],
    keyword_optimization:   [],
    experience_improvements: [],
  };

  const SKILL_KW    = ['skill', 'certif', 'learn', 'technolog', 'tool', 'framework', 'language', 'cloud', 'aws', 'docker', 'python', 'java'];
  const KEYWORD_KW  = ['keyword', 'tailor', 'match', 'job description', 'term', 'optimize', 'ats keyword'];
  const EXP_KW      = ['experience', 'achievement', 'quantif', 'impact', 'result', 'metric', 'led', 'managed', 'bullet', 'measur'];

  function bucket(text) {
    const l = text.toLowerCase();
    if (KEYWORD_KW.some(k => l.includes(k)))   return 'keyword_optimization';
    if (SKILL_KW.some(k   => l.includes(k)))   return 'missing_skills';
    if (EXP_KW.some(k     => l.includes(k)))   return 'experience_improvements';
    return 'ats_improvements';
  }

  for (const item of [...allRecs, ...allWeaks, ...missing]) {
    categories[bucket(item)].push(item);
  }

  return {
    hasResume:    true,
    hasAnalysis:  true,
    atsScore:     latest.atsScore      ?? resume.lastAtsScore,
    analyzedAt:   latest.createdAt,
    strengths:    latest.strengths     || [],
    skillsFound:  latest.skillsFound   || [],
    categories,
  };
}
