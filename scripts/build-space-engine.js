#!/usr/bin/env node
/**
 * Build script to generate space/engine.bundle.js from scripts/audit-id.js.
 * Strictly guarantees that scripts/audit-id.js remains the single source of truth
 * for all regex patterns, rules, dictionaries, and analysis logic.
 */

const fs = require('fs');
const path = require('path');

const START_MARKER = '/* ENGINE_EXPORT_START */';
const END_MARKER = '/* ENGINE_EXPORT_END */';

function generateSpaceEngine() {
  const auditPath = path.join(__dirname, 'audit-id.js');
  const source = fs.readFileSync(auditPath, 'utf8');

  const startIndex = source.indexOf(START_MARKER);
  const endIndex = source.indexOf(END_MARKER);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    throw new Error(
      `Failed to find valid engine delimiter comments (${START_MARKER} and ${END_MARKER}) in scripts/audit-id.js.`
    );
  }

  const engineCore = source.slice(startIndex + START_MARKER.length, endIndex).trim();

  return `// @ts-check
/**
 * Indonesian Linguist Client Engine Bundle
 * AUTOMATICALLY GENERATED from scripts/audit-id.js — DO NOT EDIT DIRECTLY.
 * Run "npm run build:space" to regenerate.
 */

${engineCore}

/**
 * Detect indentation style from JSON string (2 spaces, 4 spaces, or tabs).
 * @param {string} str
 * @returns {string | number}
 */
export function detectJsonIndent(str) {
  const match = str.match(/^[\\t ]*(?="[^"]+"\\s*:)/m);
  if (!match) return 2;
  const indent = match[0];
  if (indent.includes('\\t')) return '\\t';
  return indent.length || 2;
}

/**
 * Applies high-confidence replacements in reverse-order by startIndex to prevent coordinate drift.
 * @param {string} text
 * @param {Array<any>} findings
 * @param {{ highOnly?: boolean }} [options]
 * @returns {string}
 */
export function applyBatchFixes(text, findings, options = {}) {
  if (!text || !Array.isArray(findings) || findings.length === 0) return text;
  const highOnly = options.highOnly ?? false;

  const eligible = findings
    .filter(
      (f) =>
        typeof f.replacement === 'string' &&
        typeof f.startIndex === 'number' &&
        typeof f.endIndex === 'number' &&
        f.startIndex < f.endIndex
    )
    .filter((f) => !highOnly || f.confidence === 'high')
    .sort((a, b) => b.startIndex - a.startIndex);

  let result = text;
  let lastStart = Infinity;
  for (const f of eligible) {
    if (f.endIndex <= lastStart) {
      result = result.slice(0, f.startIndex) + f.replacement + result.slice(f.endIndex);
      lastStart = f.startIndex;
    }
  }
  return result;
}

/**
 * Analyze freeform Indonesian prose string.
 * @param {string} text
 * @param {{ pronoun?: string, stripIndentedCode?: boolean }} [options]
 * @returns {{ mode: 'prose', valid: true, findings: Array<any>, stats: any, cleanText: string }}
 */
export function analyzeText(text, options = {}) {
  const findings = auditText(text, options);
  const stats = {
    totalFindings: findings.length,
    highConfidence: findings.filter((f) => f.confidence === 'high').length,
    byCategory: {},
  };
  for (const f of findings) {
    const cat = f.category || 'general';
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
  }
  const cleanText = applyBatchFixes(text, findings, { highOnly: true });
  return {
    mode: 'prose',
    valid: true,
    findings,
    stats,
    cleanText,
  };
}

/**
 * Deeply fixes high-confidence non-standard spelling in parsed JSON values.
 * @param {any} obj
 * @param {string | null} pronoun
 * @returns {any}
 */
function fixJsonValues(obj, pronoun) {
  if (typeof obj === 'string') {
    const issues = auditText(obj, { stripIndentedCode: false, pronoun });
    return applyBatchFixes(obj, issues, { highOnly: true });
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => fixJsonValues(item, pronoun));
  }
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
      out[key] = fixJsonValues(value, pronoun);
    }
    return out;
  }
  return obj;
}

/**
 * Analyze a JSON localization catalog string.
 * @param {string} jsonString
 * @param {{ pronoun?: string }} [options]
 * @returns {{ mode: 'json', valid: boolean, error: string | null, findings: Array<any>, stats: any, cleanText: string }}
 */
export function analyzeJson(jsonString, options = {}) {
  const indent = detectJsonIndent(jsonString);
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return {
      mode: 'json',
      valid: false,
      error: err instanceof Error ? err.message : String(err),
      findings: [],
      stats: { totalFindings: 0, highConfidence: 0, byCategory: {} },
      cleanText: jsonString,
    };
  }

  const rawFindings = auditDictionary(parsed, { pronoun: options.pronoun });
  const findings = rawFindings.map((f) => ({
    rule: f.rule,
    category: f.category || getRuleCategory(f.rule),
    message: f.message,
    keyPath: f.key,
  }));

  const stats = {
    totalFindings: findings.length,
    highConfidence: 0,
    byCategory: {},
  };
  for (const f of findings) {
    const cat = f.category || 'general';
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
  }

  let cleanText = jsonString;
  try {
    const fixedObj = fixJsonValues(parsed, options.pronoun || null);
    cleanText = JSON.stringify(fixedObj, null, indent);
  } catch (_) {
    cleanText = jsonString;
  }

  return {
    mode: 'json',
    valid: true,
    error: null,
    findings,
    stats,
    cleanText,
  };
}

/**
 * Unified entry point: auto-detects JSON vs. Prose and routes analysis.
 * @param {string} input
 * @param {{ pronoun?: string, stripIndentedCode?: boolean }} [options]
 * @returns {any}
 */
export function analyze(input, options = {}) {
  const str = String(input || '');
  const trimmed = str.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return analyzeJson(str, options);
  }
  return analyzeText(str, options);
}

export {
  auditText,
  auditDictionary,
  checkPronounPolicy,
  stripIndentedCodeBlocks,
  NON_STANDARD_WORDS,
  SLOP_AND_PLEONASM_PATTERNS,
  KNOWN_CALQUE_TRAPS,
  RETAINED_LOANWORD_PATTERNS,
  RULE_CATEGORIES,
  getRuleCategory,
};
`;
}

function build() {
  const targetDir = path.join(__dirname, '..', 'space');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const bundle = generateSpaceEngine();
  const outputPath = path.join(targetDir, 'engine.bundle.js');
  fs.writeFileSync(outputPath, bundle, 'utf8');
  console.log(`Successfully built ${outputPath} (${Buffer.byteLength(bundle, 'utf8')} bytes)`);
}

if (require.main === module) {
  build();
}

module.exports = {
  generateSpaceEngine,
  build,
};
