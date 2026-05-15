/**
 * resumeOptimizer.service.js
 * Job-specific resume optimization: keyword alignment, skill gap detection,
 * section-level tailoring suggestions, and optimization score.
 */

import OpenAI from 'openai';

const OPTIMIZER_SYSTEM = `You are a professional resume strategist specializing in tech hiring. Given a resume and a target job description, produce tailored optimization guidance. Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "optimizationScore": <integer 0-100>,
  "targetRole": "<inferred job title from description>",
  "overallFeedback": "<3-4 sentence assessment of the resume's fit for this specific role>",
  "tailoredRecommendations": ["<specific, role-targeted action>"],
  "keywordsToAdd": {
    "mustHave":    [{ "keyword": "<term>", "context": "<where/how to add it in resume>" }],
    "shouldHave":  [{ "keyword": "<term>", "context": "<where/how to add it in resume>" }],
    "niceToHave":  ["<keyword>"]
  },
  "missingSkills": {
    "technical":   ["<hard skill required by JD, absent from resume>"],
    "soft":        ["<soft skill or competency required by JD>"],
    "tools":       ["<specific tool, platform, or technology required>"]
  },
  "missingTechnologies": ["<specific technology stack item>"],
  "sectionSuggestions": {
    "summary":    { "action": "<rewrite|enhance|add>", "tip": "<specific guidance>", "example": "<optional example snippet>" },
    "experience": { "action": "<improve|add_metrics|add_keywords>", "tip": "<specific guidance>" },
    "skills":     { "action": "<reorganize|add|remove_generic>", "tip": "<specific guidance>" },
    "projects":   { "action": "<add|expand|remove_irrelevant>", "tip": "<specific guidance>" }
  },
  "strengthsForRole": ["<existing resume element that strongly supports this role>"],
  "gapsForRole":      ["<specific qualification gap relative to the JD>"]
}

Optimization score guide:
- 85-100: Resume is well-optimized for this role already
- 65-84:  Good fit with 3-5 improvements needed
- 45-64:  Moderate fit — significant tailoring required
- 0-44:   Poor alignment — major rewrite recommended

Rules:
- tailoredRecommendations: 5-8 role-specific, immediately actionable items
- keywordsToAdd.mustHave: 4-8 keywords critical for ATS to pass this role
- keywordsToAdd.shouldHave: 3-6 beneficial keywords
- missingSkills: only list skills EXPLICITLY required or strongly implied by the JD
- sectionSuggestions: every section must have an action and a tip`;

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
      max_tokens:      2000,
    });
    raw = completion.choices[0]?.message?.content ?? '{}';
  } catch (err) {
    if (err.status === 429) throw Object.assign(new Error('AI rate-limited. Try again shortly.'), { status: 429 });
    throw Object.assign(new Error('Optimization analysis failed. Please try again.'), { status: 500 });
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(new Error('AI returned unexpected format.'), { status: 500 });
  }
}

function clamp(n) { return typeof n === 'number' ? Math.min(100, Math.max(0, Math.round(n))) : 50; }
function arr(v)   { return Array.isArray(v) ? v : []; }
function obj(v, fallback = {}) { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : fallback; }

/**
 * optimizeResume(resumeText, jobDescription)
 * Returns job-specific optimization plan.
 */
export async function optimizeResume(resumeText, jobDescription) {
  const content = `RESUME:\n${resumeText.trim()}\n\nJOB DESCRIPTION:\n${jobDescription.trim()}`;
  const raw = await callAI(OPTIMIZER_SYSTEM, content);

  const keywordsToAdd = obj(raw.keywordsToAdd);
  const missingSkills = obj(raw.missingSkills);

  return {
    optimizationScore:       clamp(raw.optimizationScore),
    targetRole:              raw.targetRole              || '',
    overallFeedback:         raw.overallFeedback         || '',
    tailoredRecommendations: arr(raw.tailoredRecommendations),
    keywordsToAdd: {
      mustHave:   arr(keywordsToAdd.mustHave),
      shouldHave: arr(keywordsToAdd.shouldHave),
      niceToHave: arr(keywordsToAdd.niceToHave),
    },
    missingSkills: {
      technical: arr(missingSkills.technical),
      soft:      arr(missingSkills.soft),
      tools:     arr(missingSkills.tools),
    },
    missingTechnologies: arr(raw.missingTechnologies),
    sectionSuggestions:  obj(raw.sectionSuggestions),
    strengthsForRole:    arr(raw.strengthsForRole),
    gapsForRole:         arr(raw.gapsForRole),
  };
}
