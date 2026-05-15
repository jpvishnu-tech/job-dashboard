/**
 * scoringEngine.js
 * ─────────────────────────────────────────────────────────────────────────
 * Pure algorithmic multi-dimensional scoring. Zero OpenAI calls.
 * Fast enough to score hundreds of jobs per second.
 *
 * Score dimensions (all 0–100):
 *   matchScore             — from JobMatch AI (passed in, not computed here)
 *   careerRelevanceScore   — title + skills alignment vs user's profile
 *   experienceAlignmentScore — job level vs user's yearsExperience
 *   salaryRelevanceScore   — salary competitiveness for experience level
 *   recencyScore           — job posting freshness
 *
 * Composite weights → overallScore:
 *   matchScore             0.35
 *   careerRelevanceScore   0.25
 *   experienceAlignment    0.20
 *   salaryRelevance        0.10
 *   recencyScore           0.10
 */

// ── Market salary benchmarks (annual USD) ────────────────────────────────
const SALARY_BENCHMARKS = {
  entry:  { min: 50_000,  max: 75_000  },
  mid:    { min: 75_000,  max: 110_000 },
  senior: { min: 110_000, max: 160_000 },
  lead:   { min: 150_000, max: 220_000 },
};

// ── Experience year ranges mapped to level names ──────────────────────────
const EXPERIENCE_RANGES = {
  entry:  [0,  2],
  mid:    [2,  5],
  senior: [5,  9],
  lead:   [8,  30],
};

// ── Helpers ───────────────────────────────────────────────────────────────

function clamp(n) { return Math.min(100, Math.max(0, Math.round(n))); }

function inferLevelFromYears(years) {
  if (years >= 8) return 'lead';
  if (years >= 5) return 'senior';
  if (years >= 2) return 'mid';
  return 'entry';
}

// ── Scoring functions ─────────────────────────────────────────────────────

/**
 * computeCareerRelevanceScore
 * Measures how closely this job maps to the user's career trajectory.
 *
 * Breakdown:
 *   +30  — job title matches at least one of the user's rolePreferences
 *   +15  — department / tags loosely match a role preference
 *   up to +55 — skill overlap ratio (matches / job skills count)
 */
export function computeCareerRelevanceScore(profile, job) {
  const profileSkills = [
    ...(profile.skills        ?? []),
    ...(profile.technologies  ?? []),
  ].map(s => s.toLowerCase().trim());

  const jobSkills = [
    ...(job.skills ?? []),
    ...(job.tags   ?? []),
  ].map(s => s.toLowerCase().trim());

  const rolePreferences = (profile.rolePreferences ?? []).map(r => r.toLowerCase());

  let score = 30; // baseline

  // Role title match
  const titleLower = (job.title ?? '').toLowerCase();
  const titleMatch = rolePreferences.some(r =>
    titleLower.includes(r) || r.includes(titleLower.split(' ').slice(0, 2).join(' '))
  );
  if (titleMatch) score += 30;

  // Department / tags loose match
  const deptLower = (job.department ?? '').toLowerCase();
  const deptMatch = rolePreferences.some(r => deptLower.includes(r.split(' ')[0]));
  if (!titleMatch && deptMatch) score += 15;

  // Skills overlap
  if (jobSkills.length > 0) {
    const matches = profileSkills.filter(ps =>
      jobSkills.some(js => js.includes(ps) || ps.includes(js))
    ).length;
    const ratio = Math.min(1, matches / jobSkills.length);
    score += ratio * 40;
  }

  return clamp(score);
}

/**
 * computeExperienceAlignmentScore
 * Compares the user's years of experience against the job's required level.
 *
 * Perfect range → 100
 * 1 yr under    →  82 (junior can stretch)
 * 2 yrs under   →  62
 * 3+ yrs under  →  40 (stretch goal)
 * 1-2 yrs over  →  88 (slightly over-qualified is fine)
 * 3-4 yrs over  →  72 (may want a bigger role)
 * 5+ yrs over   →  55 (significantly over-qualified)
 */
export function computeExperienceAlignmentScore(profile, job) {
  const years    = profile.yearsExperience ?? 0;
  const jobLevel = job.experienceLevel ?? 'any';

  if (jobLevel === 'any') return 80;

  const [minYrs, maxYrs] = EXPERIENCE_RANGES[jobLevel] ?? [0, 30];

  if (years >= minYrs && years <= maxYrs) return 100;

  const under = minYrs - years;
  const over  = years - maxYrs;

  if (under > 0) return clamp(82 - (under - 1) * 20);
  if (over  > 0) return clamp(88 - (over  - 1) * 12);

  return 80;
}

/**
 * computeSalaryRelevanceScore
 * Compares the job's reported salaryMin against the expected market range
 * for the user's experience level.
 * Returns 62 (neutral) when no salary data is available.
 */
export function computeSalaryRelevanceScore(profile, job) {
  const salary = job.salaryMin ?? 0;
  if (salary === 0) return 62; // neutral — no data

  const userLevel  = inferLevelFromYears(profile.yearsExperience ?? 0);
  const benchmark  = SALARY_BENCHMARKS[userLevel] ?? SALARY_BENCHMARKS.mid;
  const { min: mkt, max: mktMax } = benchmark;

  if (salary >= mktMax * 1.3) return 100;
  if (salary >= mktMax * 1.1) return 92;
  if (salary >= mktMax)       return 84;
  if (salary >= mkt)          return 72;
  if (salary >= mkt * 0.8)    return 58;
  if (salary >= mkt * 0.6)    return 42;
  return 28;
}

/**
 * computeRecencyScore
 * Jobs posted recently get higher priority (low competition, more likely open).
 *
 * Today      → 100
 * 1–3 days   →  90
 * 4–7 days   →  75
 * 8–14 days  →  58
 * 15–30 days →  42
 * 31–60 days →  28
 * > 60 days  →  15
 */
export function computeRecencyScore(job) {
  const postedAt = job.postedAt ? new Date(job.postedAt) : new Date();
  const days     = Math.max(0, (Date.now() - postedAt.getTime()) / 86_400_000);

  if (days < 1)  return 100;
  if (days < 4)  return 90;
  if (days < 8)  return 75;
  if (days < 15) return 58;
  if (days < 31) return 42;
  if (days < 61) return 28;
  return 15;
}

/**
 * computeOverallScore
 * Weighted composite of all scoring dimensions.
 */
export function computeOverallScore(scores) {
  const {
    matchScore             = 0,
    careerRelevanceScore   = 0,
    experienceAlignmentScore = 0,
    salaryRelevanceScore   = 0,
    recencyScore           = 0,
  } = scores;

  return clamp(
    matchScore              * 0.35 +
    careerRelevanceScore    * 0.25 +
    experienceAlignmentScore * 0.20 +
    salaryRelevanceScore    * 0.10 +
    recencyScore            * 0.10,
  );
}

/**
 * getPriorityLevel(overallScore)
 * Maps a composite score to a human-readable priority tier.
 */
export function getPriorityLevel(score) {
  if (score >= 80) return 'apply_now';
  if (score >= 65) return 'strong_fit';
  if (score >= 50) return 'good_match';
  if (score >= 35) return 'consider';
  return 'stretch';
}

/**
 * scoreJob(profile, job, matchScore)
 * Main entry point — runs all dimensions and returns the full score object.
 *
 * @param {object} profile    — Resume.resumeProfile plain object
 * @param {object} job        — Job document (lean)
 * @param {number} matchScore — AI-computed match score from JobMatch
 * @returns {object} All score fields + priorityLevel
 */
export function scoreJob(profile, job, matchScore) {
  const careerRelevanceScore     = computeCareerRelevanceScore(profile, job);
  const experienceAlignmentScore = computeExperienceAlignmentScore(profile, job);
  const salaryRelevanceScore     = computeSalaryRelevanceScore(profile, job);
  const recencyScore             = computeRecencyScore(job);

  const scores = {
    matchScore:              clamp(matchScore),
    careerRelevanceScore,
    experienceAlignmentScore,
    salaryRelevanceScore,
    recencyScore,
  };

  const overallScore  = computeOverallScore(scores);
  const priorityLevel = getPriorityLevel(overallScore);

  return { ...scores, overallScore, priorityLevel };
}
