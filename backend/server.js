import 'dotenv/config';

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
import { notFound, errorHandler } from './middleware/errorHandler.js';

// ── Database ──────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet());

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
app.use(express.json({ limit: '10kb' }));
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
app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs',  jobRoutes);
app.use('/api/admin', adminRoutes);

// ── Fallthrough handlers ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`[server] http://localhost:${PORT}  (${process.env.NODE_ENV ?? 'development'})`)
);

export default app;
