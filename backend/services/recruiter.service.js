/**
 * recruiter.service.js
 * Job management + applicant tracking for the Recruiter Portal.
 */

import mongoose    from 'mongoose';
import Job         from '../models/Job.js';
import Application from '../models/Application.js';
import Resume      from '../models/Resume.js';
import User        from '../models/User.js';
import ApiError    from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';

const ALL_STATUSES = ['pending', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'];

// ── Job CRUD ──────────────────────────────────────────────────────────────

/**
 * listRecruiterJobs(recruiterId, query)
 * Returns all jobs posted by this recruiter (active + inactive).
 */
export async function listRecruiterJobs(recruiterId, { page = 1, limit = 20, search, active } = {}) {
  const filter = { recruiterOwner: recruiterId };
  if (active === 'true')  filter.isActive = true;
  if (active === 'false') filter.isActive = false;
  if (search) filter.$text = { $search: search };

  const base = Job.find(filter)
    .populate('companyRef', 'name logo slug')
    .sort({ postedAt: -1 });

  return paginate(base, Job.countDocuments(filter), { page, limit });
}

/**
 * createRecruiterJob(recruiterId, companyId, fields)
 */
export async function createRecruiterJob(recruiterId, companyId, fields) {
  return Job.create({
    ...fields,
    recruiterOwner:   recruiterId,
    companyRef:       companyId ?? null,
    source:           'recruiter',
    applicationCount: 0,
  });
}

/**
 * getRecruiterJob(recruiterId, jobId)
 * Returns one job owned by the recruiter.
 */
export async function getRecruiterJob(recruiterId, jobId) {
  const job = await Job.findOne({ _id: jobId, recruiterOwner: recruiterId })
    .populate('companyRef', 'name logo slug');
  if (!job) throw ApiError.notFound('Job not found or access denied');
  return job;
}

/**
 * updateRecruiterJob(recruiterId, jobId, fields)
 */
export async function updateRecruiterJob(recruiterId, jobId, fields) {
  const ALLOWED = [
    'title', 'company', 'companyLogo', 'location', 'salary', 'salaryMin', 'salaryMax',
    'type', 'department', 'description', 'requirements', 'url',
  ];
  const safe = Object.fromEntries(
    Object.entries(fields).filter(([k]) => ALLOWED.includes(k))
  );

  const job = await Job.findOneAndUpdate(
    { _id: jobId, recruiterOwner: recruiterId },
    safe,
    { new: true, runValidators: true }
  );
  if (!job) throw ApiError.notFound('Job not found or access denied');
  return job;
}

/**
 * setJobStatus(recruiterId, jobId, isActive)
 * Opens or closes a job posting.
 */
export async function setJobStatus(recruiterId, jobId, isActive) {
  const job = await Job.findOneAndUpdate(
    { _id: jobId, recruiterOwner: recruiterId },
    { isActive },
    { new: true }
  );
  if (!job) throw ApiError.notFound('Job not found or access denied');
  return job;
}

/**
 * deleteRecruiterJob(recruiterId, jobId)
 * Soft-deletes by setting isActive: false (preserves application history).
 */
export async function deleteRecruiterJob(recruiterId, jobId) {
  const job = await Job.findOneAndUpdate(
    { _id: jobId, recruiterOwner: recruiterId },
    { isActive: false },
    { new: true }
  );
  if (!job) throw ApiError.notFound('Job not found or access denied');
  return job;
}

// ── Applicant Tracking ────────────────────────────────────────────────────

/**
 * listJobApplicants(recruiterId, jobId, query)
 * Returns all applications for a job owned by the recruiter.
 * Includes the applicant's resume AI score if available.
 */
export async function listJobApplicants(recruiterId, jobId, { status, page = 1, limit = 20 } = {}) {
  // Verify recruiter owns the job
  const job = await Job.findOne({ _id: jobId, recruiterOwner: recruiterId });
  if (!job) throw ApiError.notFound('Job not found or access denied');

  const filter = { job: jobId };
  if (status) filter.status = status;

  const base = Application.find(filter)
    .populate('user', 'name email avatar createdAt')
    .sort({ appliedAt: -1 });

  const result = await paginate(base, Application.countDocuments(filter), { page, limit });

  // Attach last ATS score for each applicant from their Resume doc
  const userIds = result.data.map(a => a.user?._id).filter(Boolean);
  const resumes  = await Resume.find({ user: { $in: userIds } })
    .select('user lastAtsScore')
    .lean();

  const scoreMap = {};
  resumes.forEach(r => { scoreMap[String(r.user)] = r.lastAtsScore; });

  result.data = result.data.map(app => {
    const plain = app.toJSON();
    plain.atsScore = scoreMap[String(app.user?._id)] ?? null;
    return plain;
  });

  return result;
}

/**
 * updateApplicantStatus(recruiterId, applicationId, status, note)
 * Recruiter updates the status of an application.
 * Enforces that the job belongs to the recruiter.
 */
export async function updateApplicantStatus(recruiterId, applicationId, status, note = '') {
  if (!ALL_STATUSES.includes(status)) {
    throw ApiError.badRequest(`Invalid status: ${status}`);
  }

  // Load application + verify job ownership
  const app = await Application.findById(applicationId).populate('job');
  if (!app) throw ApiError.notFound('Application not found');

  if (app.job && String(app.job.recruiterOwner) !== String(recruiterId)) {
    throw ApiError.forbidden('You do not have permission to update this application');
  }

  const prevStatus = app.status;
  app.status = status;
  app.statusHistory.push({ status, changedAt: new Date(), note });
  await app.save();

  return { application: app, prevStatus };
}

/**
 * getApplicantDetail(recruiterId, applicationId)
 * Returns full application detail including resume AI analyses.
 */
export async function getApplicantDetail(recruiterId, applicationId) {
  const app = await Application.findById(applicationId)
    .populate('user', 'name email avatar createdAt')
    .populate('job', 'title company recruiterOwner');

  if (!app) throw ApiError.notFound('Application not found');

  if (app.job && String(app.job.recruiterOwner) !== String(recruiterId)) {
    throw ApiError.forbidden('Access denied');
  }

  // Attach resume + AI analyses
  const resume = await Resume.findOne({ user: app.user._id })
    .select('url fileName lastAtsScore analyses uploadedAt');

  return { application: app.toJSON(), resume: resume?.toJSON() ?? null };
}

// ── Analytics ─────────────────────────────────────────────────────────────

/**
 * getRecruiterAnalytics(recruiterId)
 * Dashboard stats for the recruiter's pipeline.
 */
export async function getRecruiterAnalytics(recruiterId) {
  const jobIds = await Job.find({ recruiterOwner: recruiterId }).distinct('_id');

  const [
    totalJobs,
    activeJobs,
    totalApplicants,
    byStatus,
    recentApplicants,
    topJobs,
  ] = await Promise.all([
    Job.countDocuments({ recruiterOwner: recruiterId }),
    Job.countDocuments({ recruiterOwner: recruiterId, isActive: true }),
    Application.countDocuments({ job: { $in: jobIds } }),
    Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.find({ job: { $in: jobIds } })
      .sort({ appliedAt: -1 }).limit(5)
      .populate('user', 'name email')
      .populate('job', 'title'),
    Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: '$job', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      { $project: { 'job.title': 1, 'job.isActive': 1, count: 1 } },
    ]),
  ]);

  const statusMap = { pending: 0, shortlisted: 0, interview: 0, offer: 0, hired: 0, rejected: 0 };
  byStatus.forEach(({ _id, count }) => { statusMap[_id] = count; });

  return {
    overview: { totalJobs, activeJobs, totalApplicants },
    pipeline: statusMap,
    recentApplicants,
    topJobs,
  };
}
