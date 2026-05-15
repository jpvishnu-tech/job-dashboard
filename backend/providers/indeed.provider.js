/**
 * IndeedProvider
 * ─────────────────────────────────────────────────────────────────────────
 * Adapter stub for Indeed job integration.
 *
 * ⚠️  IMPORTANT — TERMS OF SERVICE:
 * Indeed's Robots.txt and ToS prohibit scraping their website.
 * The old Indeed Publisher API was deprecated in 2022.
 *
 * Legal options for ingesting Indeed job data:
 *
 *   1. Indeed Employer API (for employers posting jobs)
 *      https://developer.indeed.com/ — Access by invitation only.
 *
 *   2. Indeed Job Feed (XML/RSS — for publishers)
 *      Requires a signed Publisher agreement with Indeed.
 *      Endpoint pattern: https://www.indeed.com/rss?q=software+dev&l=remote
 *
 *   3. RapidAPI JSearch (same API used for LinkedIn option)
 *      Aggregates Indeed, LinkedIn, Glassdoor under one API.
 *      Set INDEED_API_KEY to your RapidAPI key and uncomment below.
 *
 * This provider is DISABLED by default.
 * .env key: INDEED_API_KEY  (RapidAPI key for JSearch / publisher key)
 */

import { BaseProvider } from './base.provider.js';

export class IndeedProvider extends BaseProvider {
  constructor() {
    super('indeed', !!process.env.INDEED_API_KEY);
  }

  async fetchJobs({ search = 'software engineer', location = 'remote', limit = 50 } = {}) {
    /* ── Option: RapidAPI JSearch (Indeed jobs subset) ──────────────────────
    const params = new URLSearchParams({
      query:       `${search}`,
      location:    location,
      num_pages:   '1',
      date_posted: 'week',
      site:        'indeed',         // filter to Indeed results
    });

    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key':  process.env.INDEED_API_KEY,
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Indeed (JSearch) HTTP ${res.status}`);
    const data = await res.json();
    return data.data ?? [];
    ── End option ─────────────────────────────────────────────────────────── */

    console.info('[indeed] Provider is disabled. Configure INDEED_API_KEY to enable.');
    return [];
  }

  normalize(raw) {
    if (!raw?.job_title || !raw?.employer_name) return null;

    return {
      title:          String(raw.job_title).trim(),
      company:        String(raw.employer_name).trim(),
      companyLogo:    raw.employer_logo || '',
      location:       raw.job_city ? `${raw.job_city}, ${raw.job_country ?? ''}`.trim().replace(/,$/, '') : 'Worldwide',
      salary:         '',
      salaryMin:      raw.job_min_salary ? Number(raw.job_min_salary) : 0,
      salaryMax:      raw.job_max_salary ? Number(raw.job_max_salary) : 0,
      type:           BaseProvider.mapEmploymentType(raw.job_employment_type),
      department:     '',
      description:    raw.job_description || '',
      requirements:   raw.job_highlights?.Qualifications ?? [],
      url:            raw.job_apply_link || '',
      source:         'indeed',
      externalId:     raw.job_id ? String(raw.job_id) : '',
      remote:         raw.job_is_remote ?? false,
      experienceLevel:'any',
      skills:         raw.job_required_skills ?? [],
      tags:           [],
      isActive:       true,
      postedAt:       raw.job_posted_at_datetime_utc ? new Date(raw.job_posted_at_datetime_utc) : new Date(),
    };
  }
}
