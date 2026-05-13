import express                 from 'express';
import { body, query, param } from 'express-validator';
import Job                    from '../models/Job.js';
import asyncHandler           from '../utils/asyncHandler.js';
import { protect, adminOnly, validate } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/jobs ─────────────────────────────────────────────
// Public.  Supports search, type/location filter, sort, and pagination.
//
//   ?search=react       full-text across title, company, description
//   ?type=full-time     exact match on job type enum
//   ?location=remote    partial, case-insensitive location match
//   ?minSalary=100000   salaryMin ≥ value
//   ?maxSalary=200000   salaryMin ≤ value
//   ?sort=newest|oldest|salary_asc|salary_desc|title   (default: newest)
//   ?page=1&limit=10    (limit capped at 50)
router.get('/', asyncHandler(async (req, res) => {
  const {
    search, type, location, minSalary, maxSalary,
    sort = 'newest', page = 1, limit = 10,
  } = req.query;

  const filter = { isActive: true };
  if (search)    filter.$text     = { $search: search };
  if (type)      filter.type      = type;
  if (location)  filter.location  = { $regex: location, $options: 'i' };
  if (minSalary || maxSalary) {
    filter.salaryMin = {};
    if (minSalary) filter.salaryMin.$gte = Number(minSalary);
    if (maxSalary) filter.salaryMin.$lte = Number(maxSalary);
  }

  const SORT_MAP = {
    newest:     { postedAt: -1 },
    oldest:     { postedAt:  1 },
    salary_asc: { salaryMin:  1 },
    salary_desc:{ salaryMin: -1 },
    title:      { title:      1 },
  };
  const sortObj    = SORT_MAP[sort] ?? SORT_MAP.newest;
  const projection = search ? { score: { $meta: 'textScore' } } : {};

  const pageNum  = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Job.find(filter, projection)
       .sort(search ? { score: { $meta: 'textScore' }, ...sortObj } : sortObj)
       .skip(skip)
       .limit(limitNum),
    Job.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
}));

// ── GET /api/jobs/:id ─────────────────────────────────────────
router.get('/:id',
  [param('id').isMongoId().withMessage('Invalid job ID')],
  validate,
  asyncHandler(async (req, res) => {
    const job = await Job.findOne({ _id: req.params.id, isActive: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  })
);

// ── Shared validation for create / update ─────────────────────
const jobRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('type').isIn(['full-time', 'part-time', 'contract', 'internship'])
              .withMessage('Invalid job type'),
  body('url').trim().isURL({ require_protocol: true }).withMessage('Valid URL required'),
  body('companyLogo').optional().trim(),
  body('salary').optional().trim(),
  body('salaryMin').optional().isInt({ min: 0 }).withMessage('salaryMin must be ≥ 0'),
  body('salaryMax').optional().isInt({ min: 0 }).withMessage('salaryMax must be ≥ 0'),
  body('department').optional().trim(),
  body('description').optional().trim(),
  body('requirements').optional().isArray().withMessage('requirements must be an array'),
  body('isActive').optional().isBoolean(),
];

// ── POST /api/jobs  (admin) ───────────────────────────────────
router.post('/', protect, adminOnly, jobRules, validate,
  asyncHandler(async (req, res) => {
    const job = await Job.create(req.body);
    res.status(201).json({ success: true, data: job });
  })
);

// ── PUT /api/jobs/:id  (admin) ────────────────────────────────
router.put('/:id',
  protect, adminOnly,
  [param('id').isMongoId().withMessage('Invalid job ID'), ...jobRules.map((r) => r.optional())],
  validate,
  asyncHandler(async (req, res) => {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  })
);

// ── DELETE /api/jobs/:id  (admin — soft delete) ───────────────
router.delete('/:id',
  protect, adminOnly,
  [param('id').isMongoId().withMessage('Invalid job ID')],
  validate,
  asyncHandler(async (req, res) => {
    const job = await Job.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, message: 'Job removed', data: job });
  })
);

export default router;
