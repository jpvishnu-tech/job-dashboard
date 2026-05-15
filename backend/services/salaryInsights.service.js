import OpenAI from 'openai';

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('AI service not configured'), { status: 503 });
  _client = new OpenAI({ apiKey });
  return _client;
}

async function callAI(system, user, maxTokens = 1200) {
  try {
    const c = await getClient().chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: { type: 'json_object' },
      temperature:     0.2,
      max_tokens:      maxTokens,
    });
    return JSON.parse(c.choices[0]?.message?.content ?? '{}');
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('Salary analysis failed. Please try again.'), { status: 500 });
  }
}

// ── System prompt ─────────────────────────────────────────────────────────

const SALARY_SYSTEM = `You are a compensation analyst with expertise in tech industry salary data up to your knowledge cutoff. Provide accurate, useful salary insights. Return ONLY a valid JSON object — no markdown, no code fences.

Required JSON structure:
{
  "roleSummary": "<2-sentence overview of compensation landscape for this role>",
  "currency": "USD",
  "salaryBands": {
    "entry":  { "min": <integer thousands>, "median": <integer thousands>, "max": <integer thousands> },
    "mid":    { "min": <integer thousands>, "median": <integer thousands>, "max": <integer thousands> },
    "senior": { "min": <integer thousands>, "median": <integer thousands>, "max": <integer thousands> },
    "lead":   { "min": <integer thousands>, "median": <integer thousands>, "max": <integer thousands> }
  },
  "locationMultipliers": {
    "sf_nyc":    <float, e.g. 1.35>,
    "remote_us": <float, e.g. 1.10>,
    "tier2_us":  <float, e.g. 0.85>,
    "europe":    <float, e.g. 0.75>,
    "india":     <float, e.g. 0.25>
  },
  "trendDirection": "<up | stable | down>",
  "trendNote": "<1-2 sentences on current market direction and why>",
  "topPayingCompanies": ["<company>", ...],
  "totalCompensationNote": "<1-2 sentences on equity / bonus / total comp context>",
  "negotiationTips": ["<concrete, actionable negotiation tip>", ...],
  "dataNote": "<one sentence noting this is based on AI training data as of knowledge cutoff>"
}

Rules:
- salaryBands: all values in thousands USD (e.g. 95 means $95,000); be realistic for current market
- locationMultipliers: multiplier against the base (US national median)
- topPayingCompanies: 5-8 well-known companies that pay top-of-market for this role
- negotiationTips: 4-6 tips specific to this role and market`;

// ── In-memory cache (role+location+experience → data, 6h TTL) ─────────────

const _cache   = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000;

function cacheKey(role, location, experience) {
  return `${role.toLowerCase().trim()}_${location}_${experience}`;
}

// ── Public API ────────────────────────────────────────────────────────────

export async function getSalaryInsights(role, location = 'us_national', experience = 'mid') {
  if (!role?.trim()) throw Object.assign(new Error('role is required'), { status: 400 });

  const key = cacheKey(role, location, experience);
  const hit  = _cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return { ...hit.data, cached: true };

  const lines = [
    `ROLE: ${role}`,
    `PRIMARY LOCATION / MARKET: ${location}`,
    `CANDIDATE EXPERIENCE LEVEL: ${experience}`,
    `\nProvide comprehensive salary insights for this role in the current (2024-2025) tech market.`,
    `All salary values should be in USD thousands (e.g. 120 = $120,000).`,
  ];

  const raw = await callAI(SALARY_SYSTEM, lines.join('\n'), 1200);

  const data = {
    role,
    location,
    experience,
    roleSummary:           raw.roleSummary            || '',
    currency:              'USD',
    salaryBands:           raw.salaryBands            || {},
    locationMultipliers:   raw.locationMultipliers    || {},
    trendDirection:        raw.trendDirection         || 'stable',
    trendNote:             raw.trendNote              || '',
    topPayingCompanies:    Array.isArray(raw.topPayingCompanies)  ? raw.topPayingCompanies  : [],
    totalCompensationNote: raw.totalCompensationNote  || '',
    negotiationTips:       Array.isArray(raw.negotiationTips)     ? raw.negotiationTips     : [],
    dataNote:              raw.dataNote               || 'Salary data is based on AI training data.',
    generatedAt:           new Date(),
  };

  _cache.set(key, { ts: Date.now(), data });
  return data;
}
