/**
 * adzuna.provider.js
 * ─────────────────────────────────────────────────────────────────────────
 * Adzuna Job Search API adapter.
 * https://developer.adzuna.com/apis/
 *
 * Env vars required:
 *   ADZUNA_APP_ID    — your Adzuna application ID
 *   ADZUNA_APP_KEY   — your Adzuna API key
 *   ADZUNA_COUNTRY   — 2-letter country code (default: "us")
 *
 * Free tier: 250 requests/day  |  50 results per request
 *
 * This provider issues one request per search keyword so the daily
 * limit is respected.  Adjust ADZUNA_KEYWORDS to taste.
 */

import { BaseProvider } from './base.provider.js';

const ADZUNA_BASE      = 'https://api.adzuna.com/v1/api/jobs';
const RESULTS_PER_PAGE = 50;

const DEFAULT_KEYWORDS = [
  'software engineer',
  'frontend developer',
  'backend developer',
  'full stack developer',
  'devops engineer',
  'data scientist',
  'product manager',
  'ui ux designer',
];

const COMMON_SKILLS = [
  'javascript','typescript','python','java','go','rust','c++','c#','php','ruby','swift','kotlin',
  'react','vue','angular','next.js','node.js','express','django','flask','spring',
  'aws','azure','gcp','docker','kubernetes','terraform','ci/cd','git',
  'postgresql','mysql','mongodb','redis','elasticsearch','graphql','rest api',
  'machine learning','tensorflow','pytorch','data science','sql',
  'html','css','tailwind','webpack','vite',
];

export class AdzunaProvider extends BaseProvider {
  constructor() {
    super('adzuna', Boolean(
      process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY
    ));
  }

  isEnabled() {
    return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
  }

  async fetchJobs(params = {}) {
    const appId   = process.env.ADZUNA_APP_ID;
    const appKey  = process.env.ADZUNA_APP_KEY;
    const country = process.env.ADZUNA_COUNTRY ?? 'us';
    const keywords = params.keywords ?? DEFAULT_KEYWORDS;

    const allJobs = [];

    for (const keyword of keywords) {
      try {
        const url = `${ADZUNA_BASE}/${country}/search/1` +
          `?app_id=${appId}` +
          `&app_key=${appKey}` +
          `&results_per_page=${RESULTS_PER_PAGE}` +
          `&what=${encodeURIComponent(keyword)}` +
          `&content-type=application/json`;

        const resp = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal:  AbortSignal.timeout(10_000),
        });

        if (!resp.ok) {
          console.warn(`[adzuna] ${resp.status} for keyword "${keyword}"`);
          continue;
        }

        const data = await resp.json();
        if (Array.isArray(data.results)) {
          allJobs.push(...data.results);
        }
      } catch (err) {
        console.warn(`[adzuna] fetch error for "${keyword}":`, err.message);
      }
    }

    return allJobs;
  }

  normalize(raw) {
    if (!raw?.redirect_url || !raw?.title || !raw?.company?.display_name) return null;

    const description = raw.description ?? '';

    return {
      title:           raw.title.trim(),
      company:         raw.company.display_name.trim(),
      location:        raw.location?.display_name ?? 'Remote',
      description,
      url:             raw.redirect_url,
      applyUrl:        raw.redirect_url,
      externalId:      String(raw.id),
      source:          'adzuna',
      external:        true,
      remote:          /remote/i.test(raw.location?.display_name ?? '') || /remote/i.test(description),
      type:            BaseProvider.mapEmploymentType(raw.contract_type ?? ''),
      experienceLevel: BaseProvider.mapExperienceLevel(raw.title + ' ' + (raw.category?.label ?? '')),
      skills:          BaseProvider.parseSkillsFromText(description, COMMON_SKILLS),
      tags:            raw.category?.label ? [raw.category.label] : [],
      salaryMin:       raw.salary_min ? Math.round(raw.salary_min) : 0,
      salaryMax:       raw.salary_max ? Math.round(raw.salary_max) : 0,
      salary:          raw.salary_min && raw.salary_max
        ? `$${Math.round(raw.salary_min / 1000)}k–$${Math.round(raw.salary_max / 1000)}k`
        : '',
      isActive:        true,
      postedAt:        raw.created ? new Date(raw.created) : new Date(),
    };
  }
}
