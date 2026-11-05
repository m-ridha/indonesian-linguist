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

function getPackageVersion() {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function generateSpaceEngine() {
  const version = getPackageVersion();
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

export const VERSION = '${version}';

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

  const kept = [];
  let lastStart = Infinity;
  for (const f of eligible) {
    if (f.endIndex <= lastStart) {
      kept.push(f);
      lastStart = f.startIndex;
    }
  }
  if (kept.length === 0) return text;
  const parts = [];
  let cursor = 0;
  for (let i = kept.length - 1; i >= 0; i--) {
    const f = kept[i];
    parts.push(text.slice(cursor, f.startIndex), f.replacement);
    cursor = f.endIndex;
  }
  parts.push(text.slice(cursor));
  return parts.join('');
}

/**
 * Maximum allowed findings collected during a prose audit before bounding output.
 */
export const MAX_PROSE_FINDINGS = 5000;

/**
 * Analyze freeform Indonesian prose string.
 * @param {string} text
 * @param {{ pronoun?: string, stripIndentedCode?: boolean, maxFindings?: number }} [options]
 * @returns {{ mode: 'prose', valid: true, findings: Array<any>, stats: any, cleanText: string }}
 */
export function analyzeText(text, options = {}) {
  const maxFindings = options.maxFindings ?? MAX_PROSE_FINDINGS;
  const findings = auditText(text, { ...options, maxFindings });
  const isCapped = findings.length >= maxFindings;
  const stats = {
    totalFindings: findings.length,
    highConfidence: findings.filter((f) => f.confidence === 'high').length,
    byCategory: /** @type {Record<string, number>} */ ({}),
    isCapped,
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
 * Scans a JSON string and extracts all string value positions (excluding object keys).
 * Preserves numbers, booleans, null, keys, comments, and formatting exactly as written.
 * @param {string} jsonStr
 * @returns {Array<{ start: number, end: number, raw: string, keyPath: string }>}
 */
function findJsonStringValues(jsonStr) {
  const spans = [];
  const stack = [];
  let inValue = false;
  let i = 0;
  const n = jsonStr.length;

  while (i < n) {
    const ch = jsonStr[i];
    if (/\\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '{' || ch === '[') {
      stack.push({
        type: ch === '{' ? 'object' : 'array',
        currentKey: null,
        index: ch === '[' ? 0 : undefined,
      });
      inValue = stack[stack.length - 1].type === 'array';
      i++;
      continue;
    }
    if (ch === '}' || ch === ']') {
      stack.pop();
      inValue = stack.length > 0 && stack[stack.length - 1].type === 'array';
      i++;
      continue;
    }
    if (ch === ':') {
      inValue = true;
      i++;
      continue;
    }
    if (ch === ',') {
      const top = stack[stack.length - 1];
      if (top?.type === 'array') {
        top.index++;
        inValue = true;
      } else {
        inValue = false;
      }
      i++;
      continue;
    }
    if (ch === '\"') {
      i++;
      const startContent = i;
      while (i < n) {
        if (jsonStr[i] === '\\\\') {
          i += 2;
        } else if (jsonStr[i] === '\"') {
          break;
        } else {
          i++;
        }
      }
      const endContent = i;
      i++;
      const top = stack[stack.length - 1];
      const isKey = (!top || top.type === 'object' || top.type === 'root-snippet') && !inValue;
      if (isKey) {
        let lastKey;
        try {
          lastKey = JSON.parse('\"' + jsonStr.slice(startContent, endContent) + '\"');
        } catch {
          lastKey = jsonStr.slice(startContent, endContent);
        }
        if (stack.length > 0) stack[stack.length - 1].currentKey = lastKey;
        else stack.push({ type: 'root-snippet', currentKey: lastKey });
      } else {
        const keyParts = [];
        for (const frame of stack) {
          if (frame.currentKey !== null && frame.currentKey !== undefined) {
            keyParts.push(frame.currentKey);
          } else if (frame.type === 'array' && frame.index !== undefined) {
            keyParts.push(frame.index);
          }
        }
        spans.push({
          start: startContent,
          end: endContent,
          raw: jsonStr.slice(startContent, endContent),
          // Dotted join: a nested path "a.b" and a literal key "a.b" share this identity.
          // Callers that use keyPath as a cleanup allowlist must reject paths that are not unique.
          keyPath: keyParts.join('.'),
        });
        inValue = false;
        if (stack.length === 1 && stack[0].type === 'root-snippet') {
          stack.pop();
        }
      }
      continue;
    }
    i++;
  }
  return spans;
}

/**
 * Directly cleans string values in raw JSON text without rewriting numbers or formatting.
 * When a cleanup scope is provided (bounded audit scope), only values with a recorded
 * finding are touched, and only the fixes matching those recorded findings are applied.
 * @param {string} raw
 * @param {string | null} pronoun
 * @param {Map<string, Set<string>> | null} [cleanupScope]
 * @param {Array<{ start: number, end: number, raw: string, keyPath: string }> | null} [spans]
 * @returns {string}
 */
function cleanJsonRaw(raw, pronoun, cleanupScope = null, spans = null) {
  const stringSpans = spans || findJsonStringValues(raw);
  if (stringSpans.length === 0) return raw;
  const parts = [];
  let cursor = 0;
  let changed = false;
  for (const span of stringSpans) {
    if (cleanupScope && !cleanupScope.has(span.keyPath)) {
      continue;
    }
    let decoded;
    try {
      decoded = JSON.parse('\"' + span.raw + '\"');
    } catch {
      continue;
    }
    let issues = auditText(decoded, { stripIndentedCode: false, pronoun, maxFindings: MAX_PROSE_FINDINGS });
    if (cleanupScope) {
      const recorded = cleanupScope.get(span.keyPath);
      issues = issues.filter((issue) => recorded?.has(issue.rule + '\\u0000' + issue.message));
    }
    const fixed = applyBatchFixes(decoded, issues, { highOnly: true });
    if (fixed !== decoded) {
      changed = true;
      const encodedFixed = JSON.stringify(fixed).slice(1, -1);
      parts.push(raw.slice(cursor, span.start), encodedFixed);
      cursor = span.end;
    }
  }
  if (!changed) return raw;
  parts.push(raw.slice(cursor));
  return parts.join('');
}

/**
 * Checks if the text appears to be formatted as key-value pairs (JSON / JS object snippet).
 * Matches lines starting with a quoted string key followed by a colon.
 * @param {string} str
 * @returns {boolean}
 */
export function isKeyValueSnippet(str) {
  const trimmed = String(str || '').trim();
  return /^"(?:[^"\\\\]|\\\\.)*"\\s*:/.test(trimmed);
}

/**
 * Analyze a JSON localization catalog string or snippet.
 * @param {string} jsonString
 * @param {{ pronoun?: string }} [options]
 * @returns {{ mode: 'json', isSnippet?: boolean, valid: boolean, error: string | null, findings: Array<any>, stats: any, cleanText: string }}
 */
export function analyzeJson(jsonString, options = {}) {
  const raw = String(jsonString || '');
  const trimmed = raw.trim();
  const indent = detectJsonIndent(raw);

  let isSnippet = false;
  let hasTrailingComma = false;
  let parsed = null;
  let parseError = null;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      parseError = err instanceof Error ? err.message : String(err);
    }
  } else {
    isSnippet = true;
    hasTrailingComma = /,(\\s*)$/.test(trimmed);
    const withoutTrailing = trimmed.replace(/,(\\s*)$/, '$1');
    const wrapped = '{\\n' + withoutTrailing + '\\n}';
    try {
      parsed = JSON.parse(wrapped);
    } catch (err) {
      parseError = err instanceof Error ? err.message : String(err);
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      mode: 'json',
      isSnippet,
      valid: false,
      error: parseError || 'Sintaks JSON tidak valid.',
      findings: [],
      stats: { totalFindings: 0, highConfidence: 0, byCategory: {} },
      cleanText: raw,
    };
  }

  const rawFindings = auditDictionary(parsed, { pronoun: options.pronoun });
  const findings = rawFindings.map((f) => ({
    rule: f.rule,
    category: f.category || getRuleCategory(f.rule),
    message: f.message,
    keyPath: f.key,
  }));

  const isCapped = rawFindings.some((f) => f.rule === 'findings-limit-exceeded' || f.rule === 'traversal-limit-exceeded');
  const stats = {
    totalFindings: findings.length,
    highConfidence: 0,
    byCategory: /** @type {Record<string, number>} */ ({}),
    isCapped,
  };
  for (const f of findings) {
    const cat = f.category || 'general';
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
  }

  let cleanupScope = null;
  let spans = null;
  if (isCapped) {
    spans = findJsonStringValues(raw);
    // keyPath is a dotted join, so a nested path and a literal dotted key can collide.
    // Only clean paths that identify exactly one value, so no unaudited value is touched.
    const pathCounts = new Map();
    for (const span of spans) {
      pathCounts.set(span.keyPath, (pathCounts.get(span.keyPath) || 0) + 1);
    }
    cleanupScope = new Map();
    for (const f of findings) {
      if (!f.keyPath) continue;
      if (f.rule === 'findings-limit-exceeded' || f.rule === 'traversal-limit-exceeded') continue;
      if (pathCounts.get(f.keyPath) !== 1) continue;
      let recorded = cleanupScope.get(f.keyPath);
      if (!recorded) cleanupScope.set(f.keyPath, (recorded = new Set()));
      recorded.add(f.rule + '\\u0000' + f.message);
    }
  }

  let cleanText = raw;
  try {
    cleanText = cleanJsonRaw(raw, options.pronoun || null, cleanupScope, spans);
  } catch (_) {
    cleanText = raw;
  }

  return {
    mode: 'json',
    isSnippet,
    valid: true,
    error: null,
    findings,
    stats,
    cleanText,
  };
}

/**
 * Detects if a bracketed string is Markdown prose (links, references, task lists) rather than JSON.
 * @param {string} str
 * @returns {boolean}
 */
export function isMarkdownProse(str) {
  if (!str.startsWith('[')) return false;
  return /^\\[[^\\]\\n]+\\](?:\\([^\\s)]+\\)|:\\s*\\S+)/.test(str) || /^\\[[ xX]\\]\\s/.test(str);
}

/**
 * Detects if a brace-headed string is a template placeholder rather than a JSON object.
 * @param {string} str
 * @returns {boolean}
 */
export function isProsePlaceholder(str) {
  if (!str.startsWith('{')) return false;
  return /^(?:\\{\\{[0-9a-zA-Z_.-]+\\}\\}|\\{[0-9a-zA-Z_.-]+\\}(?!\\s*:))/.test(str);
}

/**
 * Unified entry point: auto-detects JSON vs. Prose and routes analysis.
 * @param {string} input
 * @param {{ pronoun?: string, stripIndentedCode?: boolean, mode?: 'auto' | 'json' | 'prose' }} [options]
 * @returns {any}
 */
export function analyze(input, options = {}) {
  const str = String(input || '');
  const trimmed = str.trim();
  const forcedMode = options.mode;

  if (forcedMode === 'json') {
    return analyzeJson(str, options);
  }
  if (forcedMode === 'prose') {
    return analyzeText(str, options);
  }

  if (!isMarkdownProse(trimmed) && !isProsePlaceholder(trimmed) && (trimmed.startsWith('{') || trimmed.startsWith('[') || isKeyValueSnippet(trimmed))) {
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
  const version = getPackageVersion();
  const targetDir = path.join(__dirname, '..', 'space');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const bundle = generateSpaceEngine();
  const outputPath = path.join(targetDir, 'engine.bundle.js');
  fs.writeFileSync(outputPath, bundle, 'utf8');
  console.log(`Successfully built ${outputPath} (${Buffer.byteLength(bundle, 'utf8')} bytes)`);

  const indexPath = path.join(targetDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const originalHtml = fs.readFileSync(indexPath, 'utf8');
    const updatedHtml = originalHtml.replace(
      /(<span id="app-version"[^>]*>)\s*v[0-9.]+\s*(<\/span>)/,
      `$1v${version}$2`
    );
    if (updatedHtml !== originalHtml) {
      fs.writeFileSync(indexPath, updatedHtml, 'utf8');
      console.log(`Synchronized version v${version} in ${indexPath}`);
    }
  }
}

if (require.main === module) {
  build();
}

module.exports = {
  generateSpaceEngine,
  build,
};
