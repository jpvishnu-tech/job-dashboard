/**
 * CustomCompanyProvider
 * ─────────────────────────────────────────────────────────────────────────
 * Accepts manually-supplied job arrays (e.g. from POST /api/jobs/import
 * or a private company careers-page feed) and normalises them into the
 * unified Job schema.
 *
 * Unlike the external providers, this one does not fetch from a remote URL.
 * Instead it receives raw jobs passed in from the import controller.
 *
 * Expected input shape (flexible — missing fields are defaulted):
 * {
 *   title, company, location?, salary?, type?, description?,
 *   requirements? (array), url, skills? (array), remote?, experienceLevel?,
 *   tags? (array), logo?, externalId?
 * }
 *
 * Always enabled — no API key needed.
 */

import { BaseProvider } from './base.provider.js';

export class CustomCompanyProvider extends BaseProvider {
  constructor() {
    super('custom', true);
  }

  /**
   * fetchJobs is not used for this provider.
   * Instead, call normalize(raw) directly for each imported job,
   * or use the inherited sync() which accepts an array via params.jobs.
   */
  async fetchJobs({ jobs = [] } = {}) {
    return jobs;
  }

  normalize(raw) {
    if (!raw?.title || !raw?.company) return null;
    if (!raw?.url)                    return null;

    const skills = Array.isArray(raw.skills)
      ? raw.skills.map(s => String(s).trim()).filter(Boolean)
      : [];

    const tags   = Array.isArray(raw.tags)
      ? raw.tags.map(t => String(t).trim()).filter(Boolean)
      : [];

    return {
      title:          String(raw.title).trim(),
      company:        String(raw.company).trim(),
      companyLogo:    raw.logo || raw.companyLogo || '',
      location:       raw.location || 'Remote',
      salary:         raw.salary || '',
      salaryMin:      raw.salaryMin  ? Number(raw.salaryMin)  : 0,
      salaryMax:      raw.salaryMax  ? Number(raw.salaryMax)  : 0,
      type:           BaseProvider.mapEmploymentType(raw.type || raw.employmentType || ''),
      department:     raw.department || '',
      description:    raw.description || '',
      requirements:   Array.isArray(raw.requirements) ? raw.requirements : [],
      url:            String(raw.url).trim(),
      source:         'custom',
      externalId:     raw.externalId ? String(raw.externalId) : '',
      remote:         raw.remote ?? String(raw.location || '').toLowerCase().includes('remote'),
      experienceLevel:BaseProvider.mapExperienceLevel(raw.experienceLevel || raw.experience || ''),
      skills,
      tags,
      isActive:       raw.isActive !== false,
      postedAt:       raw.postedAt ? new Date(raw.postedAt) : new Date(),
    };
  }
}
