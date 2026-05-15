import rateLimit   from 'express-rate-limit';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  listTasks, createTask, updateTask, deleteTask,
  generateRuleBasedTasks, saveGeneratedTasks,
  listReminders, createReminder, updateReminder, deleteReminder,
  getDashboardStats,
} from '../services/automation.service.js';
import {
  generateAITasks,
  generateCoverLetter,
  getResumeRecommendations,
} from '../services/automationAI.service.js';

// ── Rate limiter for AI endpoints ─────────────────────────────────────────
export const aiAutoLimit = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: req => String(req.user._id),
  message: { success: false, message: 'AI rate limit reached — try again in an hour.' },
});

// ── Dashboard summary ─────────────────────────────────────────────────────

export const getDashboard = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats(req.user._id);
  res.json({ success: true, data: stats });
});

// ── Tasks ─────────────────────────────────────────────────────────────────

export const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, limit } = req.query;
  const tasks = await listTasks(req.user._id, {
    status:   status   || undefined,
    priority: priority || undefined,
    limit:    limit    ? Math.min(Number(limit), 200) : 100,
  });
  res.json({ success: true, tasks });
});

export const postTask = asyncHandler(async (req, res) => {
  const { title, description, type, priority, dueDate, relatedApplication } = req.body;
  if (!title?.trim()) throw ApiError.badRequest('title is required');

  const task = await createTask(req.user._id, {
    title: title.trim(), description, type, priority, dueDate,
    relatedApplication: relatedApplication || undefined,
    aiGenerated: false,
  });
  res.status(201).json({ success: true, data: task });
});

export const patchTask = asyncHandler(async (req, res) => {
  const task = await updateTask(req.user._id, req.params.id, req.body);
  if (!task) throw ApiError.notFound('Task not found');
  res.json({ success: true, data: task });
});

export const removeTask = asyncHandler(async (req, res) => {
  const task = await deleteTask(req.user._id, req.params.id);
  if (!task) throw ApiError.notFound('Task not found');
  res.json({ success: true, message: 'Task deleted' });
});

export const postGenerateTasks = asyncHandler(async (req, res) => {
  // Run rule-based + AI generation in parallel
  const [ruleTaskObjects, aiResult] = await Promise.all([
    generateRuleBasedTasks(req.user._id),
    generateAITasks(req.user._id).catch(() => ({ tasks: [], pipelineHealth: 'good', healthNote: '' })),
  ]);

  // Convert AI tasks to DB-compatible objects with a due date
  const now = Date.now();
  const aiTaskObjects = (aiResult.tasks || []).map(t => ({
    type:        t.type        || 'custom',
    title:       (t.title      || '').slice(0, 200),
    description: t.description || '',
    priority:    ['high','medium','low'].includes(t.priority) ? t.priority : 'medium',
    dueDate:     t.dueInDays ? new Date(now + t.dueInDays * 86_400_000) : null,
  }));

  const allTaskObjects = [...ruleTaskObjects, ...aiTaskObjects];
  const saved = await saveGeneratedTasks(req.user._id, allTaskObjects);

  // Return all current pending tasks (including previously existing ones)
  const allTasks = await listTasks(req.user._id, { status: 'pending' });

  res.json({
    success:        true,
    generated:      saved.length,
    pipelineHealth: aiResult.pipelineHealth,
    healthNote:     aiResult.healthNote,
    tasks:          allTasks,
  });
});

// ── Reminders ─────────────────────────────────────────────────────────────

export const getReminders = asyncHandler(async (req, res) => {
  const { status, limit } = req.query;
  const reminders = await listReminders(req.user._id, {
    status: status || ['pending', 'snoozed'],
    limit:  limit  ? Math.min(Number(limit), 200) : 100,
  });
  res.json({ success: true, reminders });
});

export const postReminder = asyncHandler(async (req, res) => {
  const { title, message, type, scheduledAt, relatedApplication } = req.body;
  if (!title?.trim())  throw ApiError.badRequest('title is required');
  if (!scheduledAt)    throw ApiError.badRequest('scheduledAt is required');
  if (new Date(scheduledAt) < new Date()) throw ApiError.badRequest('scheduledAt must be in the future');

  const reminder = await createReminder(req.user._id, {
    title: title.trim(), message, type, scheduledAt,
    relatedApplication: relatedApplication || undefined,
  });
  res.status(201).json({ success: true, data: reminder });
});

export const patchReminder = asyncHandler(async (req, res) => {
  const reminder = await updateReminder(req.user._id, req.params.id, req.body);
  if (!reminder) throw ApiError.notFound('Reminder not found');
  res.json({ success: true, data: reminder });
});

export const removeReminder = asyncHandler(async (req, res) => {
  const reminder = await deleteReminder(req.user._id, req.params.id);
  if (!reminder) throw ApiError.notFound('Reminder not found');
  res.json({ success: true, message: 'Reminder deleted' });
});

// ── AI Resume Recommendations ─────────────────────────────────────────────

export const getRecommendations = asyncHandler(async (req, res) => {
  const data = await getResumeRecommendations(req.user._id);
  res.json({ success: true, data });
});

// ── Cover Letter Generation ───────────────────────────────────────────────

export const postCoverLetter = asyncHandler(async (req, res) => {
  const { company, role, description, tone, candidateName } = req.body;
  if (!company?.trim()) throw ApiError.badRequest('company is required');
  if (!role?.trim())    throw ApiError.badRequest('role is required');

  const result = await generateCoverLetter(req.user._id, {
    company:       company.trim(),
    role:          role.trim(),
    description:   description?.slice(0, 2000) || '',
    tone:          ['professional', 'enthusiastic', 'concise'].includes(tone) ? tone : 'professional',
    candidateName: candidateName?.trim() || '',
  });

  res.json({ success: true, data: result });
});
