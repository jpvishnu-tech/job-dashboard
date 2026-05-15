/**
 * lever.provider.js
 * ─────────────────────────────────────────────────────────────────────────
 * Lever Postings API adapter — public, no authentication required.
 * https://hire.lever.co/developer/postings
 *
 * Env vars:
 *   LEVER_COMPANIES — comma-separated company slugs
 *                     e.g. "netflix,spotify,uber,airbnb,pinterest"
 *
 * Each company maps to:
 *   GET https://api.lever.co/v0/postings/{slug}?mode=json
 *
 * The provider is enabled when LEVER_COMPANIES is set.
 */

import { BaseProvider } from './base.provider.js';

const LEVER_BASE = 'https://api.lever.co/v0/postings';

const DEFAULT_COMPANIES = [
  'netflix', 'spotify', 'pinterest', 'lyft', 'doordash',
  'robinhood', 'brex', 'figma', 'rippling',
];

const COMMON_SKILLS = [
  'javascript','typescript','python','java','go','rust','c++','c#','php','ruby','swift','kotlin',
  'react','vue','angular','next.js','node.js','express','django','flask','spring',
  'aws','azure','gcp','docker','kubernetes','terraform','ci/cd','git',
  'postgresql','mysql','mongodb','redis','elasticsearch','graphql','rest api',
  'machine learning','tensorflow','pytorch','data science','sql',
  'html','css','tailwind','webpack','vite',
];

export class LeverProvider extends BaseProvider {
  constructor() {
    super('lever', Boolean(process.env.LEVER_COMPANIES));
  }

  isEnabled() {
    return Boolean(process.env.LEVER_COMPANIES);
  }

  _getCompanies() {
    const raw = process.env.LEVER_COMPANIES ?? DEFAULT_COMPANIES.join(',');
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  async fetchJobs(_params = {}) {
    const companies = this._getCompanies();
    const allJobs   = [];

    for (const company of companies) {
      try {
        const url  = `${LEVER_BASE}/${company}?mode=json`;
        const resp = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal:  AbortSignal.timeout(10_000),
        });

        if (!resp.ok) {
          console.warn(`[lever] ${resp.status} for company "${company}"`);
          continue;
        }

        const jobs = await resp.json();
        if (!Array.isArray(jobs)) continue;

        // Attach the company slug for normalize() to use as display name
        jobs.forEach(j => { j._companySlug = company; });
        allJobs.push(...jobs);
      } catch (err) {
        console.warn(`[lever] fetch error for "${company}":`, err.message);
      }
    }

    return allJobs;
  }

  normalize(raw) {
    if (!raw?.hostedUrl || !raw?.text) return null;

    const company      = raw._companySlug ?? '';
    const displayName  = company.charAt(0).toUpperCase() + company.slice(1);
    const location     = raw.categories?.location ?? raw.categories?.allLocations?.[0] ?? 'Remote';
    const team         = raw.categories?.team ?? '';
    const commitment   = raw.categories?.commitment ?? '';
    const description  = (raw.descriptionPlain ?? '')
      .replace(/\n{3,}/g, '\n\n').trim()
      .slice(0, 4000);

    return {
      title:           String(raw.text).trim(),
      company:         displayName,
      location,
      description,
      url:             raw.hostedUrl,
      applyUrl:        raw.applyUrl ?? raw.hostedUrl,
      externalId:      String(raw.id),
      source:          'lever',
      external:        true,
      remote:          /remote/i.test(location) || /remote/i.test(commitment),
      type:            BaseProvider.mapEmploymentType(commitment),
      experienceLevel: BaseProvider.mapExperienceLevel(raw.text + ' ' + commitment),
      skills:          BaseProvider.parseSkillsFromText(
        raw.text + ' ' + description, COMMON_SKILLS
      ).slice(0, 15),
      tags:            [team, commitment].filter(Boolean).slice(0, 5),
      salaryMin:       0,
      salaryMax:       0,
      salary:          '',
      isActive:        true,
      postedAt:        raw.createdAt ? new Date(raw.createdAt) : new Date(),
    };
  }
}
