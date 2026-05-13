import express           from 'express';
import { param, body }  from 'express-validator';
import User             from '../models/User.js';
import Job              from '../models/Job.js';
import Application      from '../models/Application.js';
import asyncHandler     from '../utils/asyncHandler.js';
import { protect, adminOnly, validate } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, adminOnly); // every admin route requires JWT + role=admin

// ── GET /api/admin/stats ──────────────────────────────────────
router.get('/stats', asyncHandler(async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    userCount,
    adminCount,
    activeJobCount,
    inactiveJobCount,
    applicationCount,
    appsByStatus,
    jobsByType,
    recentUsers,
    recentApps,
    timelineRaw,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    Job.countDocuments({ isActive: true }),
    Job.countDocuments({ isActive: false }),
    Application.countDocuments(),
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    User.find().sort({ createdAt: -1 }).limit(5)
      .select('name email role createdAt avatar'),
    Application.find().sort({ appliedAt: -1 }).limit(5)
      .select('company role status appliedAt user'),
    Application.aggregate([
      { $match: { appliedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id:        { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
          total:      { $sum: 1 },
          interviews: {
            $sum: { $cond: [{ $in: ['$status', ['interview', 'offer']] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const statusMap = { pending: 0, interview: 0, offer: 0, rejected: 0 };
  appsByStatus.forEach(({ _id, count }) => { statusMap[_id] = count; });

  const typeMap = {};
  jobsByType.forEach(({ _id, count }) => { typeMap[_id] = count; });

  res.json({
    success: true,
    data: {
      users:        { total: userCount, admins: adminCount, regular: userCount - adminCount },
      jobs:         { active: activeJobCount, inactive: inactiveJobCount, total: activeJobCount + inactiveJobCount },
      applications: { total: applicationCount, byStatus: statusMap },
      jobsByType:   typeMap,
      timeline:     timelineRaw,
      recentUsers,
      recentApps,
    },
  });
}));

// ── GET /api/admin/users ──────────────────────────────────────
// ?search=&role=user|admin&page=1&limit=20
router.get('/users', asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) filter.role = role;

  const pageNum  = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
}));

// ── PATCH /api/admin/users/:id ────────────────────────────────
// Body: { role: 'user' | 'admin' }
router.patch('/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role').isIn(['user', 'admin']).withMessage('Role must be "user" or "admin"'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  })
);

// ── DELETE /api/admin/users/:id ───────────────────────────────
router.delete('/users/:id',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  asyncHandler(async (req, res) => {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await Application.deleteMany({ user: req.params.id });
    res.json({ success: true, message: 'User deleted' });
  })
);

// ── GET /api/admin/jobs ───────────────────────────────────────
// All jobs including inactive. ?search=&type=&active=&page=1&limit=20
router.get('/jobs', asyncHandler(async (req, res) => {
  const { search, type, active, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (search)             filter.$text    = { $search: search };
  if (type)               filter.type     = type;
  if (active === 'true')  filter.isActive = true;
  if (active === 'false') filter.isActive = false;

  const projection = search ? { score: { $meta: 'textScore' } } : {};
  const sortObj    = search ? { score: { $meta: 'textScore' } } : { postedAt: -1 };

  const pageNum  = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Job.find(filter, projection).sort(sortObj).skip(skip).limit(limitNum),
    Job.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
}));

// ── PATCH /api/admin/jobs/:id/toggle ─────────────────────────
// Flip isActive (restore a soft-deleted job or deactivate an active one)
router.patch('/jobs/:id/toggle',
  [param('id').isMongoId().withMessage('Invalid job ID')],
  validate,
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    job.isActive = !job.isActive;
    await job.save();
    res.json({ success: true, data: job });
  })
);

export default router;
