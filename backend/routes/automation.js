import { Router }   from 'express';
import { protectAny } from '../middleware/auth.js';
import {
  getDashboard,
  getTasks, postTask, patchTask, removeTask, postGenerateTasks,
  getReminders, postReminder, patchReminder, removeReminder,
  getRecommendations,
  postCoverLetter,
  aiAutoLimit,
} from '../controllers/automation.controller.js';

const router = Router();

// All automation routes require auth
router.use(protectAny);

// ── Dashboard ─────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboard);

// ── Tasks ─────────────────────────────────────────────────────────────────
router.get('/tasks',               getTasks);
router.post('/tasks',              postTask);
// /tasks/generate must be declared BEFORE /tasks/:id to avoid "generate" → ObjectId
router.post('/tasks/generate',     aiAutoLimit, postGenerateTasks);
router.patch('/tasks/:id',         patchTask);
router.delete('/tasks/:id',        removeTask);

// ── Reminders ─────────────────────────────────────────────────────────────
router.get('/reminders',           getReminders);
router.post('/reminders',          postReminder);
router.patch('/reminders/:id',     patchReminder);
router.delete('/reminders/:id',    removeReminder);

// ── AI Endpoints ──────────────────────────────────────────────────────────
router.get('/recommendations',     getRecommendations);
router.post('/cover-letter',       aiAutoLimit, postCoverLetter);

export default router;
