/**
 * remoteok.provider.js
 * ─────────────────────────────────────────────────────────────────────────
 * RemoteOK public API adapter — no authentication required.
 * https://remoteok.com/api
 *
 * No env vars required — always enabled.
 *
 * Note: The API array's first element is a metadata object, not a job.
 *       The provider skips it automatically.
 */

import { BaseProvider } from './base.provider.js';

const REMOTEOK_API_URL = 'https://remoteok.com/api';

const COMMON_SKILLS = [
  'javascript','typescript','python','java','go','rust','c++','c#','php','ruby','swift','kotlin',
  'react','vue','angular','next.js','node.js','express','django','flask','spring',
  'aws','azure','gcp','docker','kubernetes','terraform','ci/cd','git',
  'postgresql','mysql','mongodb','redis','elasticsearch','graphql','rest api',
  'machine learning','tensorflow','pytorch','data science','sql',
  'html','css','tailwind','webpack','vite',
];

export class RemoteOkProvider extends BaseProvider {
  constructor() {
    super('remoteok', true); // always enabled
  }

  isEnabled() { return true; }

  async fetchJobs(_params = {}) {
    const resp = await fetch(REMOTEOK_API_URL, {
      headers: {
        Accept:     'application/json',
        // RemoteOK requires a User-Agent header
        'User-Agent': 'JobDashboard/1.0 (job aggregation bot)',
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!resp.ok) throw new Error(`RemoteOK API returned ${resp.status}`);

    const data = await resp.json();

    // First element is metadata ("Remote OK Powered by ..."  etc.) — skip it
    return Array.isArray(data) ? data.slice(1) : [];
  }

  normalize(raw) {
    if (!raw?.url || !raw?.position || !raw?.company) return null;

    const tags        = Array.isArray(raw.tags) ? raw.tags : [];
    const description = raw.description ?? '';

    return {
      title:           String(raw.position).trim(),
      company:         String(raw.company).trim(),
      companyLogo:     raw.company_logo ?? '',
      location:        raw.location || 'Remote (Worldwide)',
      description,
      url:             raw.url,
      applyUrl:        raw.apply_url ?? raw.url,
      externalId:      String(raw.id ?? raw.slug ?? raw.url),
      source:          'remoteok',
      external:        true,
      remote:          true, // RemoteOK is remote-only
      type:            BaseProvider.mapEmploymentType(tags.join(' ')),
      experienceLevel: BaseProvider.mapExperienceLevel(raw.position + ' ' + tags.join(' ')),
      skills:          [
        ...tags.filter(t => COMMON_SKILLS.includes(t.toLowerCase())),
        ...BaseProvider.parseSkillsFromText(description, COMMON_SKILLS),
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 15),
      tags:            tags.slice(0, 10),
      salaryMin:       raw.salary_min ? Number(raw.salary_min) : 0,
      salaryMax:       raw.salary_max ? Number(raw.salary_max) : 0,
      salary:          raw.salary_min && raw.salary_max
        ? `$${Math.round(raw.salary_min / 1000)}k–$${Math.round(raw.salary_max / 1000)}k`
        : '',
      isActive:        true,
      postedAt:        raw.date ? new Date(raw.date) : new Date(),
    };
  }
}
