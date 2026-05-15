/**
 * workflowEngine.js
 * ─────────────────────────────────────────────────────────────────────────
 * AI-powered workflow engine: builds priority queues, computes next-action
 * recommendations, and scores applications for the Smart Queue dashboard.
 */

import OpenAI               from 'openai';
import ApplicationWorkspace from '../models/ApplicationWorkspace.js';
import WorkflowHistory      from '../models/WorkflowHistory.js';

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('AI service not configured'), { status: 503 });
  _client = new OpenAI({ apiKey });
  return _client;
}

// ── AI Prompts ────────────────────────────────────────────────────────────

const QUEUE_SYSTEM = `You are an expert career strategist. Analyze these job application workspaces and return a prioritized queue with scores and next-action recommendations.

Return ONLY valid JSON:
{
  "queue": [
    {
      "applicationId": "<id>",
      "priorityScore": <0-100>,
      "priorityLabel": "<high|medium|low>",
      "urgency": "<urgent|normal|low>",
      "nextAction": "<specific single action, max 10 words>",
      "nextActionCategory": "<prepare|apply|follow_up|interview_prep|research|negotiate>",
      "reasoning": "<1-2 sentences>"
    }
  ],
  "dailyTarget": <recommended apps to work on today, 1-10>,
  "insights": ["<strategic pipeline insight, max 2 items>"],
  "topOpportunity": "<applicationId of the single best opportunity>"
}

Scoring factors (weight):
- matchScore vs role requirements (35%)
- ATS score / preparation completeness (20%)
- Application priority tag (15%)
- Workflow state readiness (15%) — ready_to_apply > prepared > saved; applied needing follow-up scores high
- Salary potential (10%)
- Recency / days stale (5%)`;

const NEXT_ACTIONS_SYSTEM = `You are a senior career coach. Given one job application workspace, suggest 3-5 concrete actions the candidate should take right now.

Return ONLY valid JSON:
{
  "nextActions": [
    {
      "action": "<specific action>",
      "category": "<prepare|research|apply|follow_up|interview_prep|negotiate|other>",
      "priority": "<high|medium|low>",
      "timeEstimate": "<e.g. 15 min>",
      "reasoning": "<why this matters, 1 sentence>"
    }
  ],
  "urgencyLevel": "<critical|high|medium|low>",
  "overallAdvice": "<1-2 sentence strategic advice>"
}`;

// ── Pure scoring function (no AI, instant) ────────────────────────────────

function computeBaseScore(workspace, application) {
  let score = 50;

  // Match score contribution
  if (application.matchScore != null) {
    score += (application.matchScore - 50) * 0.35;
  }

  // ATS score contribution
  if (workspace.ats?.score != null) {
    score += (workspace.ats.score - 50) * 0.20;
  }

  // Priority tag
  const priorityBoost = { high: 15, medium: 0, low: -10 };
  score += priorityBoost[application.priority ?? 'medium'] ?? 0;

  // Workflow state
  const stateScore = {
    ready_to_apply: 20,
    prepared:       10,
    saved:           0,
    applied:         5,
    interview:      25,
    offer:          30,
    rejected:      -50,
  };
  score += stateScore[workspace.workflowState] ?? 0;

  // Stale follow-up bump (applied with no change in 7+ days)
  if (workspace.workflowState === 'applied' && workspace.updatedAt) {
    const daysStale = (Date.now() - new Date(workspace.updatedAt).getTime()) / 86400000;
    if (daysStale > 7) score += 12;
  }

  // Salary potential
  if (application.salaryMax > 150000)      score += 10;
  else if (application.salaryMax > 100000) score +=  5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ── buildApplyQueue ───────────────────────────────────────────────────────

/**
 * Returns the AI-ranked apply queue for the authenticated user.
 * Top 20 applications go through the AI; the rest use the base scorer.
 */
export async function buildApplyQueue(userId) {
  const workspaces = await ApplicationWorkspace.find({
    user:          userId,
    archived:      false,
    workflowState: { $nin: ['rejected'] },
  })
    .sort({ pinned: -1, aiQueueScore: -1, createdAt: -1 })
    .limit(50)
    .populate('application', 'company role status priority matchScore salaryMax salary location type appliedAt updatedAt')
    .lean();

  if (!workspaces.length) {
    return { queue: [], dailyTarget: 3, insights: [], topOpportunity: null, total: 0 };
  }

  // Base-score everything first (fast path)
  const scored = workspaces
    .map(ws => ({ ws, baseScore: ws.application ? computeBaseScore(ws, ws.application) : 50 }))
    .sort((a, b) => b.baseScore - a.baseScore);

  // Pass top 20 to AI for refined rankings
  const top = scored.slice(0, 20);
  const appSummaries = top.map(({ ws, baseScore }) => {
    const a = ws.application;
    if (!a) return null;
    return {
      applicationId:    String(a._id),
      company:          a.company,
      role:             a.role,
      workflowState:    ws.workflowState,
      priority:         a.priority,
      matchScore:       a.matchScore,
      atsScore:         ws.ats?.score ?? null,
      salary:           a.salary || (a.salaryMax ? `$${Math.round(a.salaryMax / 1000)}k` : null),
      daysSinceAction:  Math.floor((Date.now() - new Date(ws.updatedAt ?? ws.createdAt)) / 86400000),
      resumeOptimized:  ws.preparation?.resumeOptimized ?? false,
      hasCoverLetter:   ws.preparation?.coverLetterGenerated ?? false,
      checklistDone:    ws.preparation?.checklistComplete ?? false,
      baseScore,
    };
  }).filter(Boolean);

  let aiResult = null;
  try {
    const completion = await getClient().chat.completions.create({
      model:           'gpt-4o-mini',
      messages: [
        { role: 'system', content: QUEUE_SYSTEM },
        { role: 'user',   content: `Rank these applications:\n${JSON.stringify(appSummaries, null, 2)}` },
      ],
      response_format: { type: 'json_object' },
      temperature:     0.2,
      max_tokens:      1500,
    });
    aiResult = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  } catch { /* silently fall back to base scores */ }

  // Build scored-map from AI results
  const aiMap = {};
  for (const item of (aiResult?.queue ?? [])) {
    aiMap[item.applicationId] = item;
  }

  const queue = top.map(({ ws, baseScore }) => {
    const appId = String(ws.application?._id);
    const ai    = aiMap[appId];
    return {
      workspaceId:         String(ws._id),
      applicationId:       appId,
      application:         ws.application,
      workflowState:       ws.workflowState,
      ats:                 ws.ats,
      preparation:         ws.preparation,
      coverLetter:         { version: ws.coverLetter?.version, generatedAt: ws.coverLetter?.generatedAt },
      pinned:              ws.pinned,
      tags:                ws.tags,
      priorityScore:       ai?.priorityScore       ?? baseScore,
      priorityLabel:       ai?.priorityLabel       ?? (baseScore >= 70 ? 'high' : baseScore >= 40 ? 'medium' : 'low'),
      urgency:             ai?.urgency             ?? 'normal',
      nextAction:          ai?.nextAction          ?? 'Review application details',
      nextActionCategory:  ai?.nextActionCategory  ?? 'prepare',
      reasoning:           ai?.reasoning           ?? '',
    };
  }).sort((a, b) => b.pinned - a.pinned || b.priorityScore - a.priorityScore);

  // Bulk-update cached queue scores
  const bulkOps = queue.map(item => ({
    updateOne: {
      filter: { _id: item.workspaceId },
      update: { $set: { aiQueueScore: item.priorityScore, aiQueueComputedAt: new Date() } },
    },
  }));
  ApplicationWorkspace.bulkWrite(bulkOps).catch(() => {});

  return {
    queue,
    dailyTarget:     aiResult?.dailyTarget    ?? Math.min(5, Math.ceil(queue.length * 0.2)),
    insights:        aiResult?.insights       ?? [],
    topOpportunity:  aiResult?.topOpportunity ?? queue[0]?.applicationId ?? null,
    total:           workspaces.length,
  };
}

// ── getNextActions ────────────────────────────────────────────────────────

export async function getNextActions(userId, workspaceId) {
  const workspace = await ApplicationWorkspace.findOne({ _id: workspaceId, user: userId })
    .populate('application', 'company role status matchScore description')
    .lean();
  if (!workspace) throw Object.assign(new Error('Workspace not found'), { status: 404 });

  const a = workspace.application ?? {};

  const prompt = [
    `Company: ${a.company ?? 'Unknown'}`,
    `Role: ${a.role ?? 'Unknown'}`,
    `Workflow State: ${workspace.workflowState}`,
    `ATS Score: ${workspace.ats?.score ?? 'Not scored yet'}`,
    `Match Score: ${a.matchScore ?? 'N/A'}`,
    `Cover Letter: ${workspace.preparation?.coverLetterGenerated ? 'Generated' : 'Missing'}`,
    `Resume Optimized: ${workspace.preparation?.resumeOptimized ? 'Yes' : 'No'}`,
    `Checklist Complete: ${workspace.preparation?.checklistComplete ? 'Yes' : 'No'}`,
    `Checklist Items Remaining: ${workspace.checklist?.filter(c => !c.done).length ?? 0}`,
    `Days in Workspace: ${Math.floor((Date.now() - new Date(workspace.createdAt)) / 86400000)}`,
    workspace.ats?.missingKeywords?.length
      ? `Missing ATS Keywords: ${workspace.ats.missingKeywords.slice(0, 5).join(', ')}`
      : '',
  ].filter(Boolean).join('\n');

  let raw;
  try {
    const completion = await getClient().chat.completions.create({
      model:           'gpt-4o-mini',
      messages: [
        { role: 'system', content: NEXT_ACTIONS_SYSTEM },
        { role: 'user',   content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature:     0.3,
      max_tokens:      600,
    });
    raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  } catch {
    raw = {
      nextActions:   [{ action: 'Review application details and prepare your materials', category: 'prepare', priority: 'high', timeEstimate: '30 min', reasoning: 'Get started on preparation' }],
      urgencyLevel:  'medium',
      overallAdvice: 'Focus on completing your preparation before applying.',
    };
  }

  const actions = Array.isArray(raw.nextActions) ? raw.nextActions : [];

  // Cache next actions
  ApplicationWorkspace.findByIdAndUpdate(workspaceId, {
    $set: { aiNextActions: actions.map(x => x.action).filter(Boolean), aiQueueComputedAt: new Date() },
  }).catch(() => {});

  await WorkflowHistory.create({
    user:        userId,
    workspace:   workspaceId,
    application: workspace.application?._id,
    event:       'next_actions_generated',
    metadata:    { count: actions.length, urgencyLevel: raw.urgencyLevel },
    actor:       'ai',
  });

  return {
    nextActions:   actions,
    urgencyLevel:  raw.urgencyLevel  ?? 'medium',
    overallAdvice: raw.overallAdvice ?? '',
  };
}

// ── updateWorkflowState ───────────────────────────────────────────────────

export async function updateWorkflowState(userId, workspaceId, newState) {
  const workspace = await ApplicationWorkspace.findOne({ _id: workspaceId, user: userId });
  if (!workspace) throw Object.assign(new Error('Workspace not found'), { status: 404 });

  const oldState = workspace.workflowState;
  workspace.workflowState = newState;
  await workspace.save();

  await WorkflowHistory.create({
    user:        userId,
    workspace:   workspaceId,
    application: workspace.application,
    event:       'state_changed',
    from:        oldState,
    to:          newState,
    actor:       'user',
  });

  return workspace;
}
