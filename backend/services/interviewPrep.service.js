import OpenAI           from 'openai';
import InterviewSession from '../models/InterviewSession.js';
import CareerPlan       from '../models/CareerPlan.js';
import Resume           from '../models/Resume.js';

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('AI service not configured'), { status: 503 });
  _client = new OpenAI({ apiKey });
  return _client;
}

async function callAI(system, user, maxTokens = 2500) {
  try {
    const c = await getClient().chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: { type: 'json_object' },
      temperature:     0.5,
      max_tokens:      maxTokens,
    });
    return JSON.parse(c.choices[0]?.message?.content ?? '{}');
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('Interview prep generation failed. Please try again.'), { status: 500 });
  }
}

// ── System prompts ────────────────────────────────────────────────────────

const INTERVIEW_SYSTEM = `You are a senior technical interviewer with 15+ years of experience at top tech companies. Generate realistic, role-appropriate interview questions. Return ONLY a valid JSON object — no markdown, no code fences.

Required JSON structure:
{
  "sessionOverview": "<2-3 sentences on what to expect in this interview format>",
  "companyCulture": "<2-3 sentences on company type culture signals and what to emphasise>",
  "preparationTips": ["<specific, actionable preparation advice>", ...],
  "questions": [
    {
      "type": "<technical | behavioral | system_design>",
      "difficulty": "<easy | medium | hard>",
      "question": "<the full question text>",
      "context": "<1 sentence on why interviewers ask this>",
      "hints": ["<helpful thinking hint that doesn't give away the answer>", ...],
      "sampleAnswer": "<strong answer outline — 4-6 key bullet points, NOT a word-for-word script>",
      "evaluationCriteria": ["<what strong candidates demonstrate>", ...]
    }
  ]
}

Rules:
- Generate exactly the requested number of questions
- Mix types appropriately: technical (40%), behavioral (35%), system_design (25%) for mixed; adjust for specific types
- Difficulty: easy questions are entry-level, hard questions require deep expertise
- sampleAnswer: outline format with bullet points covering the key points only
- hints: 2-3 hints, helpful but not spoilers
- evaluationCriteria: 2-3 items per question
- preparationTips: 4-6 role-specific, company-context-aware tips`;

const FEEDBACK_SYSTEM = `You are a senior interviewer evaluating a candidate's response. Provide constructive, specific, and balanced feedback. Return ONLY a valid JSON object — no markdown, no code fences.

Required JSON structure:
{
  "score": <integer 1-10>,
  "feedback": "<2-3 sentence overall assessment — honest but constructive>",
  "strengths": ["<specific strength in the answer>", ...],
  "improvements": ["<specific, actionable improvement>", ...],
  "idealPoints": ["<key point that should have been mentioned>", ...]
}

Rules:
- score: 1-3 poor, 4-6 adequate, 7-8 good, 9-10 excellent
- strengths: 2-4 items — what the candidate did well (be specific, not generic)
- improvements: 2-4 items — concrete ways to strengthen the answer
- idealPoints: 3-5 key concepts or points a strong answer should include
- Be honest: don't inflate scores for weak answers`;

// ── Public API ────────────────────────────────────────────────────────────

export async function generateSession(userId, {
  company, role, type = 'mixed', difficulty = 'medium', count = 5,
}) {
  if (!role?.trim()) throw Object.assign(new Error('role is required'), { status: 400 });

  const safeCount = Math.min(Math.max(Number(count) || 5, 3), 10);

  // Get resume profile for context
  const resume  = await Resume.findOne({ user: userId }).select('resumeProfile').lean();
  const plan    = await CareerPlan.findOne({ user: userId }).select('targetRole experienceLevel').lean();
  const profile = resume?.resumeProfile ?? {};

  const lines = [
    `INTERVIEW DETAILS:`,
    `Role: ${role}`,
    company ? `Company: ${company}` : 'Company: Not specified',
    `Interview type: ${type}`,
    `Difficulty level: ${difficulty}`,
    `Number of questions to generate: ${safeCount}`,
    '',
    `CANDIDATE PROFILE:`,
    profile.skills?.length      ? `Skills: ${profile.skills.slice(0, 20).join(', ')}`  : 'No profile data',
    profile.yearsExperience     ? `Years of experience: ${profile.yearsExperience}`     : '',
    plan?.experienceLevel       ? `Experience level: ${plan.experienceLevel}`           : '',
    profile.summary             ? `Summary: ${profile.summary}`                         : '',
  ].filter(Boolean);

  const raw = await callAI(INTERVIEW_SYSTEM, lines.join('\n'), 2800);

  const questions = (Array.isArray(raw.questions) ? raw.questions : [])
    .slice(0, safeCount)
    .map(q => ({
      type:               ['technical','behavioral','system_design'].includes(q.type) ? q.type : 'technical',
      difficulty:         ['easy','medium','hard'].includes(q.difficulty) ? q.difficulty : difficulty,
      question:           String(q.question || ''),
      context:            String(q.context  || ''),
      hints:              Array.isArray(q.hints) ? q.hints : [],
      sampleAnswer:       String(q.sampleAnswer || ''),
      evaluationCriteria: Array.isArray(q.evaluationCriteria) ? q.evaluationCriteria : [],
    }));

  const session = await InterviewSession.create({
    user:             userId,
    company:          company || '',
    role,
    type,
    difficulty,
    sessionOverview:  raw.sessionOverview  || '',
    companyCulture:   raw.companyCulture   || '',
    preparationTips:  Array.isArray(raw.preparationTips) ? raw.preparationTips : [],
    questions,
  });

  return session;
}

export async function getSessionHistory(userId, limit = 20) {
  return InterviewSession.find({ user: userId })
    .select('company role type difficulty questions.type sessionOverview createdAt completedAt readinessScore')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function getSession(userId, sessionId) {
  const session = await InterviewSession.findOne({ _id: sessionId, user: userId });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  return session;
}

export async function submitAnswerFeedback(userId, sessionId, questionIndex, userAnswer) {
  const session = await InterviewSession.findOne({ _id: sessionId, user: userId });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });

  const q = session.questions[questionIndex];
  if (!q) throw Object.assign(new Error('Question not found'), { status: 404 });
  if (!userAnswer?.trim()) throw Object.assign(new Error('Answer is required'), { status: 400 });

  const input = [
    `QUESTION:\n${q.question}`,
    `\nQUESTION TYPE: ${q.type}`,
    `DIFFICULTY: ${q.difficulty}`,
    q.evaluationCriteria?.length
      ? `\nEVALUATION CRITERIA:\n${q.evaluationCriteria.map(c => `- ${c}`).join('\n')}`
      : '',
    `\nCANDIDATE'S ANSWER:\n${userAnswer.slice(0, 2000)}`,
  ].filter(Boolean).join('\n');

  const raw = await callAI(FEEDBACK_SYSTEM, input, 800);

  // Update the question in the session
  session.questions[questionIndex].userAnswer    = userAnswer;
  session.questions[questionIndex].aiFeedback    = raw.feedback    || '';
  session.questions[questionIndex].aiScore       = typeof raw.score === 'number' ? Math.min(10, Math.max(1, Math.round(raw.score))) : null;
  session.questions[questionIndex].aiStrengths   = Array.isArray(raw.strengths)    ? raw.strengths    : [];
  session.questions[questionIndex].aiImprovements= Array.isArray(raw.improvements) ? raw.improvements : [];
  session.questions[questionIndex].aiIdealPoints = Array.isArray(raw.idealPoints)  ? raw.idealPoints  : [];
  session.questions[questionIndex].practisedAt   = new Date();

  // Compute overall readiness score from answered questions
  const answered = session.questions.filter(q => q.aiScore !== null);
  if (answered.length > 0) {
    session.readinessScore = Math.round(
      answered.reduce((sum, q) => sum + q.aiScore, 0) / answered.length,
    );
  }

  if (!session.completedAt) session.completedAt = new Date();
  await session.save();

  return {
    feedback:     session.questions[questionIndex].aiFeedback,
    score:        session.questions[questionIndex].aiScore,
    strengths:    session.questions[questionIndex].aiStrengths,
    improvements: session.questions[questionIndex].aiImprovements,
    idealPoints:  session.questions[questionIndex].aiIdealPoints,
  };
}
