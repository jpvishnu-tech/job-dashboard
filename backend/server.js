import 'dotenv/config';

import { createServer } from 'http';
import express    from 'express';
import cors       from 'cors';
import helmet     from 'helmet';
import morgan     from 'morgan';
import rateLimit  from 'express-rate-limit';

import connectDB             from './config/db.js';
import authRoutes            from './routes/auth.js';
import userRoutes            from './routes/users.js';
import jobRoutes             from './routes/jobs.js';
import adminRoutes           from './routes/admin.js';
import resumeRoutes          from './routes/resume.js';
import analyticsRoutes       from './routes/analytics.js';
import aiRoutes              from './routes/ai.js';
import recruiterRoutes       from './routes/recruiter.js';
import notificationRoutes    from './routes/notifications.js';
import stripeRoutes          from './routes/stripe.js';
import applicationRoutes     from './routes/applications.js';
import automationRoutes      from './routes/automation.js';
import careerRoutes          from './routes/career.js';
import workflowRoutes        from './routes/workflow.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { initSocket }        from './services/socket.service.js';
import { startScheduler }    from './services/jobScheduler.service.js';
import { startReminderScheduler } from './services/reminderScheduler.service.js';

// ── Database ──────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet());

// ── Stripe webhook — raw body BEFORE express.json() ──────────
// The /api/stripe/webhook route uses its own express.raw() middleware
// (declared inside stripeRoutes), but we mount the entire stripeRoutes
// here early so that the raw handler is registered before express.json().
app.use('/api/stripe', stripeRoutes);

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(Object.assign(new Error(`Origin "${origin}" not allowed`), { status: 403 }));
  },
  credentials: true,
}));

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Logger ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests — try again later.' },
}));

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message:  { success: false, message: 'Too many auth requests — try again later.' },
}));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV, ts: new Date().toISOString() })
);

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/jobs',      jobRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/resume',    resumeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/recruiter',     recruiterRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/applications',   applicationRoutes);
app.use('/api/automation',     automationRoutes);
app.use('/api/career',         careerRoutes);
app.use('/api/workflow',       workflowRoutes);
// Note: /api/stripe already mounted above (before express.json) for webhook raw body

// ── Fallthrough handlers ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}  (${process.env.NODE_ENV ?? 'development'})`);
  // Start job aggregation scheduler after server is ready
  if (process.env.NODE_ENV !== 'test') {
    startScheduler();
    startReminderScheduler();
  }
});

export default app;
