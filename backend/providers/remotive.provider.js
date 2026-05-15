/**
 * RemotiveProvider
 * ─────────────────────────────────────────────────────────────────────────
 * Ingests remote jobs from the Remotive public API.
 *
 * API docs: https://remotive.com/api/
 * Rate limits: None documented, but keep reasonable.
 * ToS: Publicly accessible JSON feed — safe to aggregate.
 *
 * .env key (optional): none required (public endpoint).
 */

import { BaseProvider } from './base.provider.js';

const REMOTIVE_API = 'https://remotive.com/api/remote-jobs';

const CATEGORIES = [
  'software-dev',
  'devops',
  'data',
  'design',
  'product',
  'marketing',
  'customer-support',
];

export class RemotiveProvider extends BaseProvider {
  constructor() {
    super('remotive', true);
  }

  /**
   * fetchJobs({ category, search, limit })
   * Fetches one or all categories. When no category is given, iterates all
   * categories and merges (up to limit jobs per category).
   */
  async fetchJobs({ category, search, limit = 50 } = {}) {
    const categories = category ? [category] : CATEGORIES;
    const all        = [];

    for (const cat of categories) {
      try {
        const params = new URLSearchParams({ limit: String(limit) });
        params.set('category', cat);
        if (search) params.set('search', search);

        const res = await fetch(`${REMOTIVE_API}?${params}`, {
          signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) {
          console.warn(`[remotive] HTTP ${res.status} for category "${cat}"`);
          continue;
        }
        const data = await res.json();
        all.push(...(data.jobs ?? []));
      } catch (err) {
        console.warn(`[remotive] fetch error for category "${cat}":`, err.message);
      }
    }

    return all;
  }

  normalize(raw) {
    if (!raw?.title || !raw?.company_name || !raw?.url) return null;

    const skills = Array.isArray(raw.tags)
      ? raw.tags.map(t => String(t).trim()).filter(Boolean)
      : [];

    return {
      title:          String(raw.title).trim(),
      company:        String(raw.company_name).trim(),
      companyLogo:    raw.company_logo || '',
      location:       raw.candidate_required_location || 'Remote',
      salary:         raw.salary || '',
      salaryMin:      0,
      salaryMax:      0,
      type:           BaseProvider.mapEmploymentType(raw.job_type),
      department:     raw.category || '',
      description:    raw.description || '',
      requirements:   [],
      url:            raw.url,
      source:         'remotive',
      externalId:     String(raw.id),
      remote:         true,
      experienceLevel:'any',
      skills,
      tags:           skills,
      isActive:       true,
      postedAt:       raw.publication_date ? new Date(raw.publication_date) : new Date(),
    };
  }
}
