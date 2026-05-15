/**
 * rapidapi.provider.js
 * ─────────────────────────────────────────────────────────────────────────
 * RapidAPI JSearch adapter.
 * https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 *
 * Env vars required:
 *   RAPIDAPI_KEY — your RapidAPI subscription key
 *
 * Free tier: 200 requests/month
 *
 * This provider queries JSearch with several tech job titles to build a
 * diverse feed.  Reduce RAPIDAPI_QUERIES to stay within free-tier limits.
 */

import { BaseProvider } from './base.provider.js';

const JSEARCH_URL  = 'https://jsearch.p.rapidapi.com/search';
const JSEARCH_HOST = 'jsearch.p.rapidapi.com';

// Reduce to 2–3 queries on free tier (200 req/month)
const RAPIDAPI_QUERIES = [
  'software engineer remote',
  'frontend developer react',
  'backend developer node.js',
  'devops engineer aws',
  'data scientist python',
  'full stack developer',
];

const COMMON_SKILLS = [
  'javascript','typescript','python','java','go','rust','c++','c#','php','ruby','swift','kotlin',
  'react','vue','angular','next.js','node.js','express','django','flask','spring',
  'aws','azure','gcp','docker','kubernetes','terraform','ci/cd','git',
  'postgresql','mysql','mongodb','redis','elasticsearch','graphql','rest api',
  'machine learning','tensorflow','pytorch','data science','sql',
  'html','css','tailwind','webpack','vite',
];

export class RapidApiProvider extends BaseProvider {
  constructor() {
    super('rapidapi', Boolean(process.env.RAPIDAPI_KEY));
  }

  isEnabled() {
    return Boolean(process.env.RAPIDAPI_KEY);
  }

  async fetchJobs(params = {}) {
    const apiKey  = process.env.RAPIDAPI_KEY;
    const queries = params.queries ?? RAPIDAPI_QUERIES;
    const allJobs = [];

    for (const query of queries) {
      try {
        const url = `${JSEARCH_URL}?query=${encodeURIComponent(query)}&num_pages=1&page=1&date_posted=month`;
        const resp = await fetch(url, {
          method:  'GET',
          headers: {
            'x-rapidapi-host': JSEARCH_HOST,
            'x-rapidapi-key':  apiKey,
            Accept:            'application/json',
          },
          signal: AbortSignal.timeout(12_000),
        });

        if (!resp.ok) {
          console.warn(`[rapidapi] ${resp.status} for query "${query}"`);
          continue;
        }

        const data = await resp.json();
        if (Array.isArray(data.data)) {
          allJobs.push(...data.data);
        }
      } catch (err) {
        console.warn(`[rapidapi] fetch error for "${query}":`, err.message);
      }
    }

    return allJobs;
  }

  normalize(raw) {
    if (!raw?.job_apply_link || !raw?.job_title || !raw?.employer_name) return null;

    const city        = raw.job_city    ?? '';
    const state       = raw.job_state   ?? '';
    const country     = raw.job_country ?? '';
    const locationParts = [city, state, country].filter(Boolean);
    const location    = locationParts.length ? locationParts.join(', ') : 'Remote';

    const description = raw.job_description ?? '';
    const apiSkills   = Array.isArray(raw.job_required_skills) ? raw.job_required_skills : [];

    // Convert experience in months to level
    const expMonths   = raw.job_required_experience?.required_experience_in_months ?? 0;
    const expLevel    = expMonths === 0  ? 'any'
                      : expMonths <= 12  ? 'entry'
                      : expMonths <= 36  ? 'mid'
                      : expMonths <= 72  ? 'senior'
                      : 'lead';

    return {
      title:           String(raw.job_title).trim(),
      company:         String(raw.employer_name).trim(),
      companyLogo:     raw.employer_logo ?? '',
      location,
      description:     description.slice(0, 4000),
      url:             raw.job_apply_link,
      applyUrl:        raw.job_apply_link,
      externalId:      String(raw.job_id),
      source:          'rapidapi',
      external:        true,
      remote:          raw.job_is_remote === true || /remote/i.test(location),
      type:            BaseProvider.mapEmploymentType(raw.job_employment_type ?? ''),
      experienceLevel: expLevel,
      skills:          [
        ...apiSkills.map(s => s.toLowerCase()).filter(s => COMMON_SKILLS.includes(s)),
        ...BaseProvider.parseSkillsFromText(description, COMMON_SKILLS),
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 15),
      tags:            raw.job_required_skills?.slice(0, 5) ?? [],
      salaryMin:       raw.job_min_salary ? Math.round(Number(raw.job_min_salary)) : 0,
      salaryMax:       raw.job_max_salary ? Math.round(Number(raw.job_max_salary)) : 0,
      salary:          raw.job_min_salary && raw.job_max_salary
        ? `$${Math.round(raw.job_min_salary / 1000)}k–$${Math.round(raw.job_max_salary / 1000)}k`
        : '',
      isActive:        true,
      postedAt:        raw.job_posted_at_datetime_utc
        ? new Date(raw.job_posted_at_datetime_utc)
        : new Date(),
    };
  }
}
