/**
 * LinkedInProvider
 * ─────────────────────────────────────────────────────────────────────────
 * Adapter stub for LinkedIn Jobs integration.
 *
 * ⚠️  IMPORTANT — TERMS OF SERVICE:
 * LinkedIn's Terms of Use prohibit automated scraping of job listings.
 * To ingest LinkedIn jobs legally you must use one of:
 *
 *   1. LinkedIn Jobs API (Partner Program)
 *      https://developer.linkedin.com/product-catalog
 *      Requires: approved partnership application (enterprise tier).
 *
 *   2. LinkedIn Apply Connect (for ATS vendors)
 *      https://business.linkedin.com/talent-solutions/apply-connect
 *      Requires: ATS vendor agreement.
 *
 *   3. RapidAPI JSearch (unofficial aggregator, own ToS)
 *      https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 *      Set LINKEDIN_API_KEY to your RapidAPI key and uncomment the
 *      implementation below.
 *
 * This provider is DISABLED by default. Enable by:
 *   1. Obtaining API credentials from one of the above.
 *   2. Setting LINKEDIN_API_KEY in backend/.env
 *   3. Uncommenting the implementation in fetchJobs() below.
 *
 * .env key: LINKEDIN_API_KEY  (RapidAPI key for JSearch or partner key)
 */

import { BaseProvider } from './base.provider.js';

export class LinkedInProvider extends BaseProvider {
  constructor() {
    // Disabled until LINKEDIN_API_KEY is configured
    super('linkedin', !!process.env.LINKEDIN_API_KEY);
  }

  async fetchJobs({ search = 'software engineer', location = '', limit = 50 } = {}) {
    /* ── Option A: RapidAPI JSearch ─────────────────────────────────────────
    const params = new URLSearchParams({
      query:             `${search} ${location}`.trim(),
      num_pages:         '1',
      date_posted:       'week',
    });

    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key':  process.env.LINKEDIN_API_KEY,
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`LinkedIn (JSearch) HTTP ${res.status}`);
    const data = await res.json();
    return data.data ?? [];
    ── End Option A ─────────────────────────────────────────────────────── */

    // Provider disabled — return empty until credentials are configured
    console.info('[linkedin] Provider is disabled. Configure LINKEDIN_API_KEY to enable.');
    return [];
  }

  normalize(raw) {
    // Matches the JSearch response shape — adjust for your chosen API
    if (!raw?.job_title || !raw?.employer_name) return null;

    return {
      title:          String(raw.job_title).trim(),
      company:        String(raw.employer_name).trim(),
      companyLogo:    raw.employer_logo || '',
      location:       raw.job_city ? `${raw.job_city}, ${raw.job_country ?? ''}`.trim().replace(/,$/, '') : 'Worldwide',
      salary:         raw.job_salary_period ? `${raw.job_min_salary ?? ''}–${raw.job_max_salary ?? ''} ${raw.job_salary_currency ?? ''}`.trim() : '',
      salaryMin:      raw.job_min_salary   ? Number(raw.job_min_salary)   : 0,
      salaryMax:      raw.job_max_salary   ? Number(raw.job_max_salary)   : 0,
      type:           BaseProvider.mapEmploymentType(raw.job_employment_type),
      department:     '',
      description:    raw.job_description || '',
      requirements:   raw.job_highlights?.Qualifications ?? [],
      url:            raw.job_apply_link || '',
      source:         'linkedin',
      externalId:     raw.job_id ? String(raw.job_id) : '',
      remote:         raw.job_is_remote ?? false,
      experienceLevel:BaseProvider.mapExperienceLevel(raw.job_required_experience?.required_experience_in_months ? `${Math.round(raw.job_required_experience.required_experience_in_months / 12)} years` : ''),
      skills:         raw.job_required_skills ?? [],
      tags:           raw.job_required_skills ?? [],
      isActive:       true,
      postedAt:       raw.job_posted_at_datetime_utc ? new Date(raw.job_posted_at_datetime_utc) : new Date(),
    };
  }
}
