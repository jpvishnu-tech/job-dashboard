import express            from 'express';
import { body, param }   from 'express-validator';
import Application       from '../models/Application.js';
import asyncHandler      from '../utils/asyncHandler.js';
import { protect, validate } from '../middleware/auth.js';
import { sendMail }      from '../services/email.js';
import {
  applicationConfirmation,
  interviewUpdate,
} from '../emails/templates.js';

const router = express.Router();

const FRONTEND_URL   = process.env.FRONTEND_URL || 'http://localhost:5173';
const DASHBOARD_URL  = `${FRONTEND_URL}/applications`;

router.use(protect); // every user route requires auth

// ── GET /api/users/profile ────────────────────────────────────
router.get('/profile', asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
}));

// ── PUT /api/users/profile ────────────────────────────────────
router.put('/profile',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
                .isLength({ max: 80 }).withMessage('Name cannot exceed 80 characters'),
    body('avatar').optional().trim().isURL().withMessage('Avatar must be a valid URL'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, avatar } = req.body;
    const updates = {};
    if (name   !== undefined) updates.name   = name;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await req.user.set(updates).save();
    res.json({ success: true, user });
  })
);

// ── GET /api/users/applications ───────────────────────────────
// ?status=pending|interview|offer|rejected  &  ?page=1&limit=20
router.get('/applications', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [applications, total] = await Promise.all([
    Application.find(filter).sort({ appliedAt: -1 }).skip(skip).limit(Number(limit)),
    Application.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data:    applications,
    pagination: {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}));

// ── POST /api/users/applications ──────────────────────────────
router.post('/applications',
  [
    body('company').trim().notEmpty().withMessage('Company is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
    body('url').trim().isURL({ require_protocol: true }).withMessage('Valid URL required'),
    body('status').optional().isIn(['pending', 'interview', 'offer', 'rejected'])
                  .withMessage('Invalid status'),
    body('notes').optional().trim().isLength({ max: 2000 })
                 .withMessage('Notes cannot exceed 2000 characters'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { company, role, location, salary, type, url, status, notes } = req.body;
    const application = await Application.create({
      user: req.user._id,
      company, role, location, salary, type, url,
      status: status || 'pending',
      notes:  notes  || '',
    });

    res.status(201).json({ success: true, data: application });

    // Fire-and-forget confirmation email
    const { subject, html } = applicationConfirmation({
      userName:  req.user.name,
      company,
      role,
      location:  location || '',
      appliedAt: application.appliedAt,
      dashboardUrl: DASHBOARD_URL,
    });
    sendMail({ to: req.user.email, subject, html })
      .catch((err) => console.error('[email] application confirmation failed:', err.message));
  })
);

// ── PUT /api/users/applications/:id ───────────────────────────
router.put('/applications/:id',
  [
    param('id').isMongoId().withMessage('Invalid application ID'),
    body('status').optional().isIn(['pending', 'interview', 'offer', 'rejected'])
                  .withMessage('Invalid status value'),
    body('notes').optional().trim().isLength({ max: 2000 })
                 .withMessage('Notes cannot exceed 2000 characters'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const allowed = ['status', 'notes', 'company', 'role', 'location', 'salary', 'type'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const prev = await Application.findOne({ _id: req.params.id, user: req.user._id });
    if (!prev) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: application });

    // Send interview notification when status first moves to 'interview'
    if (updates.status === 'interview' && prev.status !== 'interview') {
      const { subject, html } = interviewUpdate({
        userName:     req.user.name,
        company:      application.company,
        role:         application.role,
        dashboardUrl: DASHBOARD_URL,
      });
      sendMail({ to: req.user.email, subject, html })
        .catch((err) => console.error('[email] interview update failed:', err.message));
    }
  })
);

// ── DELETE /api/users/applications/:id ────────────────────────
router.delete('/applications/:id',
  [param('id').isMongoId().withMessage('Invalid application ID')],
  validate,
  asyncHandler(async (req, res) => {
    const application = await Application.findOneAndDelete({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ success: true, message: 'Application deleted' });
  })
);

export default router;
