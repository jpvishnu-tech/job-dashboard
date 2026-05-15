/**
 * job.service.js
 * ─────────────────────────────────────────────────────────────
 * Business logic for job board operations.
 * Encapsulates filter building, full-text search, and CRUD so
 * the controller stays thin.
 */

import Job      from '../models/Job.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';

// ── Filter builder ────────────────────────────────────────────

function buildJobFilter({
  search, type, location, department,
  minSalary, maxSalary,
  remote, experienceLevel, skills, source,
  isActive = true,
} = {}) {
  const filter = {};

  if (isActive !== undefined) filter.isActive = isActive;
  if (search)         filter.$text          = { $search: search };
  if (type)           filter.type           = type;
  if (department)     filter.department     = { $regex: department,     $options: 'i' };
  if (location)       filter.location       = { $regex: location,       $options: 'i' };
  if (source)         filter.source         = source;
  if (remote === 'true'  || remote === true)  filter.remote = true;
  if (remote === 'false' || remote === false) filter.remote = false;
  if (experienceLevel && experienceLevel !== 'any') filter.experienceLevel = experienceLevel;

  if (skills) {
    const skillArr = Array.isArray(skills)
      ? skills
      : skills.split(',').map(s => s.trim()).filter(Boolean);
    if (skillArr.length) filter.skills = { $in: skillArr.map(s => new RegExp(s, 'i')) };
  }

  if (minSalary || maxSalary) {
    filter.salaryMin = {};
    if (minSalary) filter.salaryMin.$gte = Number(minSalary);
    if (maxSalary) filter.salaryMin.$lte = Number(maxSalary);
  }

  return filter;
}

const SORT_MAP = {
  newest:     { postedAt: -1 },
  oldest:     { postedAt:  1 },
  salary_asc: { salaryMin: 1 },
  salary_desc:{ salaryMin: -1 },
  title:      { title:     1 },
};

// ── Public listing ────────────────────────────────────────────

/**
 * listJobs(queryParams)
 * Paginated, filterable, sortable listing of active jobs.
 */
export async function listJobs({
  search, type, location, department, minSalary, maxSalary,
  remote, experienceLevel, skills, source,
  sort = 'newest', page = 1, limit = 20,
} = {}) {
  const filter     = buildJobFilter({
    search, type, location, department, minSalary, maxSalary,
    remote, experienceLevel, skills, source,
    isActive: true,
  });
  const sortObj    = SORT_MAP[sort] ?? SORT_MAP.newest;
  const projection = search ? { score: { $meta: 'textScore' } } : {};
  const finalSort  = search ? { score: { $meta: 'textScore' }, ...sortObj } : sortObj;

  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const base     = Job.find(filter, projection).sort(finalSort);

  return paginate(base, Job.countDocuments(filter), { page, limit: limitNum });
}

/**
 * getJob(id)
 * Returns a single active job by ID.
 */
export async function getJob(id) {
  const job = await Job.findOne({ _id: id, isActive: true });
  if (!job) throw ApiError.notFound('Job not found');
  return job;
}

// ── Admin operations ──────────────────────────────────────────

/**
 * listAllJobs(queryParams)
 * Admin view — includes inactive jobs.
 */
export async function listAllJobs({
  search, type, active, page = 1, limit = 20,
} = {}) {
  const isActive = active === 'true' ? true : active === 'false' ? false : undefined;
  const filter   = buildJobFilter({ search, type, isActive });

  const projection = search ? { score: { $meta: 'textScore' } } : {};
  const sortObj    = search ? { score: { $meta: 'textScore' } } : { postedAt: -1 };
  const base       = Job.find(filter, projection).sort(sortObj);

  return paginate(base, Job.countDocuments(filter), { page, limit });
}

/**
 * createJob(fields)  — admin
 */
export async function createJob(fields) {
  return Job.create(fields);
}

/**
 * updateJob(id, fields)  — admin
 */
export async function updateJob(id, fields) {
  const job = await Job.findByIdAndUpdate(id, fields, { new: true, runValidators: true });
  if (!job) throw ApiError.notFound('Job not found');
  return job;
}

/**
 * toggleJobActive(id)
 * Flips isActive — admin soft-delete / restore.
 */
export async function toggleJobActive(id) {
  const job = await Job.findById(id);
  if (!job) throw ApiError.notFound('Job not found');
  job.isActive = !job.isActive;
  await job.save();
  return job;
}

/**
 * softDeleteJob(id)
 * Sets isActive: false (soft delete).
 */
export async function softDeleteJob(id) {
  const job = await Job.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!job) throw ApiError.notFound('Job not found');
  return job;
}
