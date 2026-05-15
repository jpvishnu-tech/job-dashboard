/**
 * keywordEngine.service.js
 * Keyword density analysis, power word detection, ATS keyword scoring.
 * Runs purely with OpenAI — no third-party NLP libraries required.
 */

import OpenAI from 'openai';

const KEYWORD_SYSTEM = `You are an ATS keyword optimization expert. Analyze the resume text for keyword density, power words, and ATS optimization. Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "keywordDensityScore": <integer 0-100>,
  "powerWordScore": <integer 0-100>,
  "industryAlignmentScore": <integer 0-100>,
  "topKeywords": [
    { "keyword": "<term>", "count": <integer>, "relevance": "<high|medium|low>" }
  ],
  "powerWordsFound": ["<strong action verb or impactful word found>"],
  "weakWordsFound":  ["<weak or vague word found — e.g. 'helped', 'worked on'>"],
  "powerWordSuggestions": [
    { "weak": "<current weak word>", "strong": "<suggested replacement>" }
  ],
  "industryKeywords": {
    "present":  ["<industry-standard term found>"],
    "missing":  ["<common industry term absent>"]
  },
  "atsKeywords": {
    "highValue": ["<keyword that ATS heavily weights for tech roles>"],
    "medValue":  ["<mid-tier ATS keyword>"]
  },
  "actionableInsights": ["<specific keyword optimization tip>"]
}

Scoring guides:
- keywordDensityScore: appropriate keyword repetition without stuffing (ideal: 3-5% density)
- powerWordScore: ratio of strong action verbs to total bullets
- industryAlignmentScore: presence of current industry-standard terms

Rules:
- topKeywords: 8-15 most impactful terms, sorted by relevance desc then count desc
- powerWordsFound: 5-12 strong action verbs like "Engineered", "Architected", "Delivered"
- weakWordsFound: 3-8 problematic words to replace
- powerWordSuggestions: must match a word from weakWordsFound
- actionableInsights: 4-6 concrete keyword improvement tips`;

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('AI service not configured'), { status: 503 });
  _client = new OpenAI({ apiKey });
  return _client;
}

async function callAI(systemPrompt, userContent) {
  const client = getClient();
  let raw;
  try {
    const completion = await client.chat.completions.create({
      model:           'gpt-4o-mini',
      messages:        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
      response_format: { type: 'json_object' },
      temperature:     0.2,
      max_tokens:      1500,
    });
    raw = completion.choices[0]?.message?.content ?? '{}';
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate-limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('Keyword analysis failed. Please try again.'), { status: 500 });
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(new Error('AI returned unexpected format.'), { status: 500 });
  }
}

function clamp(n) { return typeof n === 'number' ? Math.min(100, Math.max(0, Math.round(n))) : 0; }
function arr(v)   { return Array.isArray(v) ? v : []; }
function obj(v, fallback = {}) { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : fallback; }

/**
 * analyzeKeywords(resumeText)
 * Returns keyword density, power word analysis, and ATS keyword data.
 */
export async function analyzeKeywords(resumeText) {
  const raw = await callAI(KEYWORD_SYSTEM, `RESUME:\n${resumeText.trim()}`);
  const industry = obj(raw.industryKeywords);
  const ats      = obj(raw.atsKeywords);

  return {
    keywordDensityScore:    clamp(raw.keywordDensityScore),
    powerWordScore:         clamp(raw.powerWordScore),
    industryAlignmentScore: clamp(raw.industryAlignmentScore),
    topKeywords:            arr(raw.topKeywords),
    powerWordsFound:        arr(raw.powerWordsFound),
    weakWordsFound:         arr(raw.weakWordsFound),
    powerWordSuggestions:   arr(raw.powerWordSuggestions),
    industryKeywords: {
      present: arr(industry.present),
      missing: arr(industry.missing),
    },
    atsKeywords: {
      highValue: arr(ats.highValue),
      medValue:  arr(ats.medValue),
    },
    actionableInsights: arr(raw.actionableInsights),
  };
}
