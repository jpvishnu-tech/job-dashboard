import rateLimit    from 'express-rate-limit';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getCareerPlan, generateRoadmap, updateLearningProgress } from '../services/roadmapEngine.service.js';
import { getSkillsGap }    from '../services/careerAssistant.service.js';
import { getSalaryInsights } from '../services/salaryInsights.service.js';
import {
  generateSession,
  getSessionHistory,
  getSession,
  submitAnswerFeedback,
} from '../services/interviewPrep.service.js';

// ── Rate limiter for AI-heavy endpoints (20/hr per user) ──────────────────
export const careerAILimit = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: req => String(req.user._id),
  message: { success: false, message: 'Career AI rate limit reached — try again in an hour.' },
});

// ── Roadmap ───────────────────────────────────────────────────────────────

export const getRoadmap = asyncHandler(async (req, res) => {
  const plan = await getCareerPlan(req.user._id);
  res.json({ success: true, data: plan ?? null });
});

export const postRoadmap = asyncHandler(async (req, res) => {
  const { targetRole, currentRole, experienceLevel, goals, timelineMonths } = req.body;
  if (!targetRole?.trim()) throw ApiError.badRequest('targetRole is required');

  const plan = await generateRoadmap(req.user._id, {
    targetRole:     targetRole.trim(),
    currentRole:    currentRole?.trim() || '',
    experienceLevel: experienceLevel || 'mid',
    goals:          Array.isArray(goals) ? goals.filter(Boolean) : [],
    timelineMonths: Math.min(Math.max(Number(timelineMonths) || 12, 3), 36),
  });
  res.status(201).json({ success: true, data: plan });
});

export const patchProgress = asyncHandler(async (req, res) => {
  const { skill, status } = req.body;
  if (!skill)  throw ApiError.badRequest('skill is required');
  if (!status) throw ApiError.badRequest('status is required');
  if (!['not_started', 'in_progress', 'completed'].includes(status)) {
    throw ApiError.badRequest('status must be not_started | in_progress | completed');
  }
  const progress = await updateLearningProgress(req.user._id, skill, status);
  res.json({ success: true, data: progress });
});

// ── Skills Gap ────────────────────────────────────────────────────────────

export const getSkillsGapHandler = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const data = await getSkillsGap(req.user._id, role?.trim() || null);
  res.json({ success: true, data });
});

export const postSkillsGap = asyncHandler(async (req, res) => {
  const { targetRole } = req.body;
  const data = await getSkillsGap(req.user._id, targetRole?.trim() || null);
  res.json({ success: true, data });
});

// ── Salary Insights ───────────────────────────────────────────────────────

export const getSalaryHandler = asyncHandler(async (req, res) => {
  const { role, location, experience } = req.query;
  if (!role?.trim()) throw ApiError.badRequest('role query param is required');

  const data = await getSalaryInsights(
    role.trim(),
    location || 'us_national',
    experience || 'mid',
  );
  res.json({ success: true, data });
});

// ── Interview Prep ────────────────────────────────────────────────────────

export const postInterviewSession = asyncHandler(async (req, res) => {
  const { company, role, type, difficulty, count } = req.body;
  if (!role?.trim()) throw ApiError.badRequest('role is required');

  const session = await generateSession(req.user._id, {
    company:    company?.trim() || '',
    role:       role.trim(),
    type:       ['technical','behavioral','system_design','mixed'].includes(type) ? type : 'mixed',
    difficulty: ['easy','medium','hard'].includes(difficulty) ? difficulty : 'medium',
    count:      Math.min(Math.max(Number(count) || 5, 3), 10),
  });
  res.status(201).json({ success: true, data: session });
});

export const getInterviewHistory = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const sessions = await getSessionHistory(req.user._id, Math.min(Number(limit) || 20, 50));
  res.json({ success: true, sessions });
});

export const getInterviewSession = asyncHandler(async (req, res) => {
  const session = await getSession(req.user._id, req.params.id);
  res.json({ success: true, data: session });
});

export const patchInterviewAnswer = asyncHandler(async (req, res) => {
  const { questionIndex, userAnswer } = req.body;
  if (questionIndex == null) throw ApiError.badRequest('questionIndex is required');
  if (!userAnswer?.trim())   throw ApiError.badRequest('userAnswer is required');

  const feedback = await submitAnswerFeedback(
    req.user._id,
    req.params.id,
    Number(questionIndex),
    userAnswer.trim(),
  );
  res.json({ success: true, data: feedback });
});
