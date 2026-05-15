/**
 * BaseProvider
 * ─────────────────────────────────────────────────────────────────────────
 * Abstract base class for all job source adapters.
 *
 * Concrete providers extend this class and implement:
 *   fetchJobs(params)  → Promise<RawJob[]>
 *   normalize(raw)     → NormalizedJob | null
 *
 * The sync(params) method calls both and returns an array of normalised
 * job objects ready for upsert into MongoDB.
 */
export class BaseProvider {
  /**
   * @param {string}  name     — machine-readable provider name (stored in Job.source)
   * @param {boolean} enabled  — set false to disable without removing the provider
   */
  constructor(name, enabled = true) {
    this.name    = name;
    this.enabled = enabled;
  }

  isEnabled() { return this.enabled; }

  // Must be overridden ─────────────────────────────────────────────────────

  // eslint-disable-next-line no-unused-vars
  async fetchJobs(_params = {}) {
    throw new Error(`${this.name}.fetchJobs() must be implemented`);
  }

  // eslint-disable-next-line no-unused-vars
  normalize(_raw) {
    throw new Error(`${this.name}.normalize() must be implemented`);
  }

  // ─── Orchestration ───────────────────────────────────────────────────────

  /**
   * sync(params)
   * Fetches raw jobs, normalises them, and returns only valid entries.
   * Null returned from normalize() is treated as "skip this job".
   */
  async sync(params = {}) {
    const raw  = await this.fetchJobs(params);
    const jobs = [];
    for (const item of raw) {
      try {
        const normalized = this.normalize(item);
        if (normalized) jobs.push(normalized);
      } catch (err) {
        console.warn(`[${this.name}] normalize error for item:`, err.message);
      }
    }
    return jobs;
  }

  // ─── Shared helpers ──────────────────────────────────────────────────────

  /**
   * mapEmploymentType(raw) — maps free-text job type strings to our enum.
   * Enum: full-time | part-time | contract | internship
   */
  static mapEmploymentType(raw = '') {
    const s = String(raw).toLowerCase();
    if (s.includes('contract') || s.includes('freelance')) return 'contract';
    if (s.includes('part'))                                 return 'part-time';
    if (s.includes('intern'))                               return 'internship';
    return 'full-time';
  }

  /**
   * mapExperienceLevel(raw) — maps raw strings to our enum.
   * Enum: entry | mid | senior | lead | any
   */
  static mapExperienceLevel(raw = '') {
    const s = String(raw).toLowerCase();
    if (s.includes('entry') || s.includes('junior') || s.includes('0') || s.includes('fresher')) return 'entry';
    if (s.includes('mid')   || s.includes('2') || s.includes('3'))                               return 'mid';
    if (s.includes('senior') || s.includes('sr.') || s.includes('5+'))                           return 'senior';
    if (s.includes('lead')   || s.includes('principal') || s.includes('staff'))                  return 'lead';
    return 'any';
  }

  /**
   * parseSkillsFromText(text, knownSkills)
   * Extracts skill keywords from a free-text description.
   * knownSkills is an optional array to filter against.
   */
  static parseSkillsFromText(text = '', knownSkills = []) {
    if (!knownSkills.length) return [];
    const lower = text.toLowerCase();
    return knownSkills.filter(s => lower.includes(s.toLowerCase()));
  }
}
