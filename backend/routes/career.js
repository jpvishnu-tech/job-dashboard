import { Router }    from 'express';
import { protectAny } from '../middleware/auth.js';
import {
  careerAILimit,
  getRoadmap, postRoadmap, patchProgress,
  getSkillsGapHandler, postSkillsGap,
  getSalaryHandler,
  postInterviewSession, getInterviewHistory,
  getInterviewSession, patchInterviewAnswer,
} from '../controllers/career.controller.js';

const router = Router();

router.use(protectAny);

// ── Career Roadmap ────────────────────────────────────────────────────────
router.get('/roadmap',           getRoadmap);
router.post('/roadmap',          careerAILimit, postRoadmap);
router.patch('/roadmap/progress',patchProgress);

// ── Skills Gap ────────────────────────────────────────────────────────────
router.get('/skills-gap',        careerAILimit, getSkillsGapHandler);
router.post('/skills-gap',       careerAILimit, postSkillsGap);

// ── Salary Insights ───────────────────────────────────────────────────────
router.get('/salary-insights',   careerAILimit, getSalaryHandler);

// ── Interview Prep  — /history before /:id to avoid ObjectId parse ────────
router.get('/interview-prep/history',      getInterviewHistory);
router.post('/interview-prep',             careerAILimit, postInterviewSession);
router.get('/interview-prep/:id',          getInterviewSession);
router.patch('/interview-prep/:id/answer', careerAILimit, patchInterviewAnswer);

export default router;
