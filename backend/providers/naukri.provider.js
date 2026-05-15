/**
 * NaukriProvider
 * ─────────────────────────────────────────────────────────────────────────
 * Adapter stub for Naukri.com job integration.
 *
 * ⚠️  IMPORTANT — TERMS OF SERVICE:
 * Naukri.com's Terms of Use explicitly prohibit scraping or automated
 * data extraction of any kind.
 *
 * There is currently no official public API for third-party aggregation.
 *
 * Legal options:
 *
 *   1. Naukri Campus API / Naukri for Corporates
 *      Requires a signed enterprise agreement with Info Edge (Naukri's parent).
 *      Contact: https://www.naukri.com/naukri-campus/api
 *
 *   2. Apify Naukri Scraper (unofficial, own ToS risk)
 *      Only for personal/research use — not for production aggregation.
 *
 *   3. Partner Integration
 *      If you are building an ATS or HR platform, contact Naukri
 *      for partnership integration at: https://www.naukricampus.com/
 *
 * This provider is DISABLED and will remain a stub until an official
 * integration path is established.
 *
 * .env key: NAUKRI_API_KEY  (enterprise partner key, if obtained)
 */

import { BaseProvider } from './base.provider.js';

export class NaukriProvider extends BaseProvider {
  constructor() {
    super('naukri', !!process.env.NAUKRI_API_KEY);
  }

  async fetchJobs(_params = {}) {
    /* ── Partner API integration placeholder ────────────────────────────────
    // Replace this block with the official Naukri partner API call
    // once credentials are obtained.
    //
    // Example shape (hypothetical):
    // const res = await fetch('https://api.naukri.com/v1/jobs', {
    //   headers: { 'Authorization': `Bearer ${process.env.NAUKRI_API_KEY}` },
    //   signal:  AbortSignal.timeout(15_000),
    // });
    // const data = await res.json();
    // return data.jobDetails ?? [];
    ── End placeholder ─────────────────────────────────────────────────── */

    console.info('[naukri] Provider is disabled. Obtain a Naukri partner API key to enable.');
    return [];
  }

  normalize(raw) {
    if (!raw?.title || !raw?.companyName) return null;

    return {
      title:          String(raw.title).trim(),
      company:        String(raw.companyName).trim(),
      companyLogo:    raw.companyLogo || '',
      location:       raw.location || 'India',
      salary:         raw.salary || '',
      salaryMin:      raw.minSalary ? Number(raw.minSalary) : 0,
      salaryMax:      raw.maxSalary ? Number(raw.maxSalary) : 0,
      type:           BaseProvider.mapEmploymentType(raw.jobType),
      department:     raw.industry || '',
      description:    raw.jobDescription || '',
      requirements:   raw.keySkills ? raw.keySkills.split(',').map(s => s.trim()) : [],
      url:            raw.jdUrl || '',
      source:         'naukri',
      externalId:     raw.jobId ? String(raw.jobId) : '',
      remote:         String(raw.location || '').toLowerCase().includes('work from home'),
      experienceLevel:BaseProvider.mapExperienceLevel(raw.experience || ''),
      skills:         raw.keySkills ? raw.keySkills.split(',').map(s => s.trim()) : [],
      tags:           raw.functionalArea ? [raw.functionalArea] : [],
      isActive:       true,
      postedAt:       raw.createdDate ? new Date(raw.createdDate) : new Date(),
    };
  }
}
