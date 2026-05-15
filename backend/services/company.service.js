/**
 * company.service.js
 * Business logic for Company profile management.
 */

import Company  from '../models/Company.js';
import User     from '../models/User.js';
import ApiError from '../utils/ApiError.js';

/**
 * getCompanyByRecruiter(recruiterId)
 * Returns the company the recruiter belongs to.
 */
export async function getCompanyByRecruiter(recruiterId) {
  const company = await Company.findOne({ recruiters: recruiterId })
    .populate('createdBy', 'name email');
  return company; // null if recruiter hasn't set up a company yet
}

/**
 * createCompany(recruiterId, fields)
 * Creates a new Company and links the recruiter to it.
 * Also updates User.company reference.
 */
export async function createCompany(recruiterId, fields) {
  const existing = await Company.findOne({ recruiters: recruiterId });
  if (existing) throw ApiError.conflict('You already have a company profile');

  const company = await Company.create({
    ...fields,
    createdBy:  recruiterId,
    recruiters: [recruiterId],
  });

  await User.findByIdAndUpdate(recruiterId, { company: company._id });
  return company;
}

/**
 * updateCompany(recruiterId, fields)
 * Updates the recruiter's company profile.
 * Only recruiters belonging to the company can update it.
 */
export async function updateCompany(recruiterId, fields) {
  const ALLOWED = ['name', 'logo', 'website', 'industry', 'size', 'description', 'location'];
  const safe = Object.fromEntries(
    Object.entries(fields).filter(([k]) => ALLOWED.includes(k))
  );

  const company = await Company.findOneAndUpdate(
    { recruiters: recruiterId },
    safe,
    { new: true, runValidators: true }
  );
  if (!company) throw ApiError.notFound('Company not found — create one first');
  return company;
}

/**
 * getCompanyById(id)
 * Public lookup — returns company info for job listings.
 */
export async function getCompanyById(id) {
  const company = await Company.findById(id);
  if (!company) throw ApiError.notFound('Company not found');
  return company;
}

/**
 * listAllCompanies()  — admin use
 */
export async function listAllCompanies() {
  return Company.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
}
