import OpenAI      from 'openai';
import Application from '../models/Application.js';
import Resume      from '../models/Resume.js';

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('AI service not configured'), { status: 503 });
  _client = new OpenAI({ apiKey });
  return _client;
}

const INSIGHTS_SYSTEM = `You are a senior career coach and hiring analyst. Analyse the job application data and return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "interviewProbability": <integer 0-100>,
  "successProbability": <integer 0-100>,
  "rejectionRisk": <integer 0-100>,
  "responseTimeEstimate": <integer days or null>,
  "strengths": ["<specific strength>", ...],
  "concerns": ["<specific concern>", ...],
  "recommendations": ["<concrete next step>", ...],
  "summary": "<2-3 sentence honest assessment>"
}

Scoring:
- interviewProbability: likelihood of getting an interview given stage and data
- successProbability: overall probability of being hired
- rejectionRisk: risk of rejection based on stage, time elapsed, and match
- responseTimeEstimate: days until next response (null if already in advanced stage)
Rules: strengths 2-4 items, concerns 1-3 items, recommendations 3-5 items. Be honest.`;

export async function generateInsights(userId, appId) {
  const [app, resume] = await Promise.all([
    Application.findOne({ _id: appId, user: userId }),
    Resume.findOne({ user: userId }),
  ]);
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });

  const daysAtStage = Math.floor((Date.now() - new Date(app.updatedAt).getTime()) / 86400000);
  const profile     = resume?.resumeProfile ?? null;

  const lines = [
    'APPLICATION:',
    `Company: ${app.company}`,
    `Role: ${app.role}`,
    `Stage: ${app.status}`,
    `Applied: ${app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Not yet applied'}`,
    `Days at current stage: ${daysAtStage}`,
    `Match score: ${app.matchScore ?? 'N/A'}`,
    `Salary: ${app.salary || 'N/A'}`,
    `Interviews conducted: ${app.interviews?.length ?? 0}`,
  ];

  if (profile?.extractedAt) {
    lines.push('', 'CANDIDATE PROFILE:');
    lines.push(`Years experience: ${profile.yearsExperience ?? 'N/A'}`);
    lines.push(`Skills: ${profile.skills?.slice(0, 10).join(', ') ?? 'N/A'}`);
    lines.push(`Role preferences: ${profile.rolePreferences?.join(', ') ?? 'N/A'}`);
  }

  if (app.notes) lines.push('', `NOTES: ${app.notes.slice(0, 400)}`);

  let raw;
  try {
    const completion = await getClient().chat.completions.create({
      model:           'gpt-4o-mini',
      messages: [
        { role: 'system', content: INSIGHTS_SYSTEM },
        { role: 'user',   content: lines.join('\n') },
      ],
      response_format: { type: 'json_object' },
      temperature:     0.3,
      max_tokens:      800,
    });
    raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('AI analysis failed. Please try again.'), { status: 500 });
  }

  const insights = {
    interviewProbability: typeof raw.interviewProbability === 'number' ? clamp(raw.interviewProbability) : null,
    successProbability:   typeof raw.successProbability   === 'number' ? clamp(raw.successProbability)   : null,
    rejectionRisk:        typeof raw.rejectionRisk        === 'number' ? clamp(raw.rejectionRisk)        : null,
    responseTimeEstimate: typeof raw.responseTimeEstimate === 'number' ? raw.responseTimeEstimate        : null,
    strengths:       Array.isArray(raw.strengths)       ? raw.strengths       : [],
    concerns:        Array.isArray(raw.concerns)        ? raw.concerns        : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : [],
    summary:         typeof raw.summary === 'string'    ? raw.summary         : '',
    computedAt:      new Date(),
  };

  await Application.findByIdAndUpdate(appId, {
    $set:  { aiInsights: insights },
    $push: {
      timeline: {
        $each:     [{ type: 'ai_insight', title: 'AI insights generated',
                      description: insights.summary.slice(0, 120), actor: 'system', createdAt: new Date() }],
        $position: 0,
      },
    },
  });

  return insights;
}

function clamp(n) { return Math.min(100, Math.max(0, Math.round(n))); }
