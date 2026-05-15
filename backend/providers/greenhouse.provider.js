/**
 * greenhouse.provider.js
 * ─────────────────────────────────────────────────────────────────────────
 * Greenhouse Job Board API adapter — public, no authentication required.
 * https://developers.greenhouse.io/job-board.html
 *
 * Env vars:
 *   GREENHOUSE_COMPANIES — comma-separated company board tokens
 *                          e.g. "stripe,airbnb,shopify,notion,figma,vercel"
 *
 * Each company token maps to:
 *   GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
 *
 * The provider is enabled when GREENHOUSE_COMPANIES is set.
 */

import { BaseProvider } from './base.provider.js';

const GH_BASE = 'https://boards-api.greenhouse.io/v1/boards';

const DEFAULT_COMPANIES = [
  'stripe', 'shopify', 'notion', 'figma', 'vercel',
  'linear', 'supabase', 'planetscale', 'hashicorp',
];

const COMMON_SKILLS = [
  'javascript','typescript','python','java','go','rust','c++','c#','php','ruby','swift','kotlin',
  'react','vue','angular','next.js','node.js','express','django','flask','spring',
  'aws','azure','gcp','docker','kubernetes','terraform','ci/cd','git',
  'postgresql','mysql','mongodb','redis','elasticsearch','graphql','rest api',
  'machine learning','tensorflow','pytorch','data science','sql',
  'html','css','tailwind','webpack','vite',
];

export class GreenhouseProvider extends BaseProvider {
  constructor() {
    super('greenhouse', Boolean(process.env.GREENHOUSE_COMPANIES));
  }

  isEnabled() {
    return Boolean(process.env.GREENHOUSE_COMPANIES);
  }

  _getCompanies() {
    const raw = process.env.GREENHOUSE_COMPANIES ?? DEFAULT_COMPANIES.join(',');
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  async fetchJobs(_params = {}) {
    const companies = this._getCompanies();
    const allJobs   = [];

    for (const company of companies) {
      try {
        const url  = `${GH_BASE}/${company}/jobs?content=true`;
        const resp = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal:  AbortSignal.timeout(10_000),
        });

        if (!resp.ok) {
          console.warn(`[greenhouse] ${resp.status} for company "${company}"`);
          continue;
        }

        const data = await resp.json();
        const jobs = data.jobs ?? [];

        // Attach company token so normalize() can use it
        jobs.forEach(j => { j._companyToken = company; });
        allJobs.push(...jobs);
      } catch (err) {
        console.warn(`[greenhouse] fetch error for "${company}":`, err.message);
      }
    }

    return allJobs;
  }

  normalize(raw) {
    if (!raw?.absolute_url || !raw?.title) return null;

    const company     = raw._companyToken ?? 'Unknown';
    const content     = raw.content ?? '';
    const departments = (raw.departments ?? []).map(d => d.name).filter(Boolean);
    const location    = raw.location?.name ?? raw.offices?.[0]?.name ?? 'Unknown';

    return {
      title:           raw.title.trim(),
      company:         // Greenhouse doesn't return company display name — use token
                       company.charAt(0).toUpperCase() + company.slice(1),
      location,
      description:     content.replace(/<[^>]+>/g, ' ').trim(), // strip HTML
      url:             raw.absolute_url,
      applyUrl:        raw.absolute_url,
      externalId:      String(raw.id),
      source:          'greenhouse',
      external:        true,
      remote:          /remote/i.test(location),
      type:            'full-time',
      experienceLevel: BaseProvider.mapExperienceLevel(raw.title),
      skills:          BaseProvider.parseSkillsFromText(
        raw.title + ' ' + content, COMMON_SKILLS
      ).slice(0, 15),
      tags:            departments.slice(0, 5),
      salaryMin:       0,
      salaryMax:       0,
      salary:          '',
      isActive:        true,
      postedAt:        raw.updated_at ? new Date(raw.updated_at) : new Date(),
    };
  }
}
