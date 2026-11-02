#!/usr/bin/env node
/**
 * Indonesian Linguist — Deterministic i18n & Prose Auditor
 * Zero-dependency CLI and library for auditing Indonesian localization files (.json, .js)
 * and prose (.md, .txt) against EYD V, UI polysemy traps, SMS slang, and AI slop.
 */

const fs = require('fs');
const path = require('path');

const SMS_SLANG_REGEX = /\b(yg|dgn|utk|krn|tdk|bgt|dlm|spt)\b/i;

const NON_STANDARD_WORDS = [
  { regex: /\bsilahkan\b/i, fix: 'silakan' },
  { regex: /\bsekedar\b/i, fix: 'sekadar' },
  { regex: /\bresiko\b/i, fix: 'risiko' },
  { regex: /\bpraktek\b/i, fix: 'praktik' },
  { regex: /\banalisa\b/i, fix: 'analisis' },
  { regex: /\bmerubah\b/i, fix: 'mengubah' },
  { regex: /\baktifitas\b/i, fix: 'aktivitas' },
  { regex: /\bmempengaruhi\b/i, fix: 'memengaruhi' },
  { regex: /\bhutang\b/i, fix: 'utang' },
  { regex: /\bhandal\b/i, fix: 'andal' },
  { regex: /\bhimbau(an)?\b/i, fix: 'imbau / imbauan' },
  { regex: /\bketrampilan\b/i, fix: 'keterampilan' },
  { regex: /\bdikarenakan\b/i, fix: 'karena / disebabkan oleh' },
  { regex: /\bapapun\b/i, fix: 'apa pun' },
  { regex: /\bsiapapun\b/i, fix: 'siapa pun' },
  { regex: /\bkapanpun\b/i, fix: 'kapan pun' },
  { regex: /\bdimanapun\b/i, fix: 'di mana pun' },
  { regex: /\bcemilan\b/i, fix: 'camilan' },
  { regex: /\bkreatifitas\b/i, fix: 'kreativitas' },
  { regex: /\bproduktifitas\b/i, fix: 'produktivitas' },
  { regex: /\befektifitas\b/i, fix: 'efektivitas' },
];

const SLOP_AND_PLEONASM_PATTERNS = [
  { regex: /\bhiruk[- ]pikuk\b/i, reason: 'AI slop tell ("hiruk pikuk")' },
  { regex: /\bdi era digital\b/i, reason: 'AI cliché opener ("di era digital")' },
  { regex: /\btidak dapat dipungkiri\b/i, reason: 'AI cliché opener ("tidak dapat dipungkiri")' },
  { regex: /\badalah merupakan\b/i, reason: 'Double copula pleonasm ("adalah merupakan")' },
  { regex: /\bagar supaya\b/i, reason: 'Pleonasm ("agar supaya")' },
  { regex: /\bdalam rangka untuk\b/i, reason: 'Pleonasm ("dalam rangka untuk"); use "untuk"' },
  { regex: /\bpara hadirin\b/i, reason: 'Pleonasm ("para hadirin")' },
  { regex: /\bbukan hanya\b[^.!?]{1,80}\btetapi juga\b/i, reason: 'AI negative parallelism ("bukan hanya X, tetapi juga Y")' },
  { regex: /—/, reason: 'Stylistic em dash (—) banned; use comma, colon, parentheses, or "sampai"' },
];

const KNOWN_CALQUE_TRAPS = [
  { keyMatch: /^Back$/, badVal: /\bpunggung\b/i, fix: 'Kembali' },
  { keyMatch: /clear rating/i, badVal: /\bperingkat yang jelas\b/i, fix: 'Hapus penilaian' },
  { keyMatch: /^light$/i, badVal: /\b(lampu|ringan)\b/i, fix: 'Terang' },
  { keyMatch: /^right$/i, badVal: /\bbenar\b/i, fix: 'Kanan' },
  { keyMatch: /running workout/i, badVal: /\blatihan lari\b/i, fix: 'sesi latihan yang sedang berjalan' },
  { keyMatch: /sets are drawn/i, badVal: /\bdiundi\b/i, fix: 'ditampilkan di grafik' },
  { keyMatch: /logged workout/i, badVal: /\blogin\b/i, fix: 'sesi latihan yang dicatat' },
  { keyMatch: /hop over/i, badVal: /\b(lanjutkan|meneruskan)\b/i, fix: 'melewati / melompati' },
  { keyMatch: /signs.*out/i, badVal: /\bmenandakan\b/i, fix: 'mengeluarkan' },
  { keyMatch: /^abductors$/i, badVal: /\bpenculik\b/i, fix: 'Abduktor' },
  { keyMatch: /^landmine$/i, badVal: /\branjau darat\b/i, fix: 'Landmine' },
  { keyMatch: /^traps$/i, badVal: /\bperangkap\b/i, fix: 'Traps' },
  { keyMatch: /form[- ]check/i, badVal: /\bpemeriksaan formulir\b/i, fix: 'Cek form' },
  { keyMatch: /add exercise/i, badVal: /\btambahkan olahraga\b/i, fix: 'Tambahkan latihan' },
];

// Full-string anchored patterns for complete retained loanwords, exercise names, Latin muscle names,
// and official product/OS proper nouns. Never matches arbitrary English sentences containing these words.
const RETAINED_LOANWORD_PATTERNS = [
  /^(?:Drop-set\s*\/\s*rest-pause|Drop-set|Superset(?:\s+\{[0-9]+\}(?:\s*\/\s*\{[0-9]+\}|\s*:\s*\{[0-9]+\}\s*\(\{[0-9]+\}\))?)?|Rest-pause|Deload|Bodyweight|Thibaudeau\s*\(Powerlifting\))$/i,
  /^(?:(?:incline|decline|flat|barbell|dumbbell|ez-bar|cable|smith machine|seated|standing|close-grip|wide-grip|romanian|sumo|conventional|deficit|pause|paused|single-arm|one-arm)\s+){0,3}(?:bench press|barbell curl|back squat|front squat|deadlift|overhead press|leverage machine)(?:\s*\([A-Za-z0-9 -]+\))?$/i,
  /^(?:serratus anterior|latissimus dorsi|sternocleidomastoid|pectoralis(?:\s+major|\s+minor)?|gluteus(?:\s+maximus|\s+medius)?|gastrocnemius)$/i,
  /^(?:Face ID(?:\s*\/\s*Touch ID)?|Touch ID|iCloud Keychain|Google Password Manager|Health Connect|Apple Health|Apple Watch|Cloudflare Access)$/i,
  /^(?:API key|endpoint|reverse proxy|source code|webhook)$/i,
];

/**
 * Extract all placeholders from a string, preserving duplicate counts and supporting
 * `{0}`, `{name}`, `{{name}}`, and printf (`%s`, `%d`, `%1$s`) tokens.
 * @param {string} str
 * @returns {string[]}
 */
function extractPlaceholders(str) {
  const matches =
    String(str).match(/\{\{[0-9a-zA-Z_.-]+\}\}|\{[0-9a-zA-Z_.-]+\}|%(?:\d+\$)?[sdif]/g) || [];
  return [...matches].sort();
}

/**
 * Strip Markdown 4-space or tab-indented code blocks while preserving indented list continuations
 * and nested list items (e.g., `- Petunjuk\n\n    - Silahkan...`).
 * @param {string} text
 * @returns {string}
 */
function stripIndentedCodeBlocks(text) {
  const lines = String(text || '').split('\n');
  const out = [];
  let inListContext = false;
  let inIndentedCodeBlock = false;
  let afterBlankLine = true;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      out.push('');
      afterBlankLine = true;
      continue;
    }

    const isListItem = /^\s*(?:[-*+]|\d+\.)\s+/.test(line);
    const isIndented = /^(?: {4}|\t)/.test(line);

    if (isIndented && (inIndentedCodeBlock || (afterBlankLine && !isListItem && !inListContext))) {
      inIndentedCodeBlock = true;
      afterBlankLine = false;
      out.push('');
      continue;
    }

    inIndentedCodeBlock = false;
    if (isListItem) {
      inListContext = true;
    } else if (!isIndented) {
      inListContext = false;
    }

    afterBlankLine = false;
    out.push(line);
  }

  return out.join('\n');
}

/**
 * Audit a prose string for Indonesian AI slop, SMS slang, and non-standard spelling.
 * Automatically strips protected Markdown fenced code blocks (backticks and tildes),
 * 4-space/tab-indented code blocks, and inline code spans.
 * @param {string} text
 * @returns {Array<{rule: string, message: string}>}
 */
function auditText(text) {
  const issues = [];
  const withoutFences = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ');
  const str = stripIndentedCodeBlocks(withoutFences).replace(/`[^`\n]+`/g, ' ');

  const smsMatch = str.match(SMS_SLANG_REGEX);
  if (smsMatch) {
    issues.push({
      rule: 'sms-abbreviation',
      message: `Banned chat/SMS abbreviation "${smsMatch[0]}" found; use full word or lexical compaction.`,
    });
  }

  for (const item of NON_STANDARD_WORDS) {
    const m = str.match(item.regex);
    if (m) {
      issues.push({
        rule: 'kata-tidak-baku',
        message: `Non-standard word "${m[0]}" found; use KBBI standard "${item.fix}".`,
      });
    }
  }

  for (const pat of SLOP_AND_PLEONASM_PATTERNS) {
    if (pat.regex.test(str)) {
      issues.push({
        rule: 'slop-or-pleonasm',
        message: pat.reason,
      });
    }
  }

  return issues;
}

/**
 * Audit a key-value i18n dictionary object (including nested namespace objects).
 * @param {Record<string, unknown>} dict
 * @param {{ minFallbackLength?: number, allowlistKeys?: Set<string> }} [options]
 * @returns {Array<{key: string, rule: string, message: string}>}
 */
function auditDictionary(dict, options = {}) {
  const minFallbackLength = options.minFallbackLength ?? 16;
  const allowlistKeys = options.allowlistKeys ?? new Set();
  const findings = [];

  for (const [key, value] of Object.entries(dict || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const nested of auditDictionary(value, options)) {
        findings.push({
          ...nested,
          key: `${key}.${nested.key}`,
        });
      }
      continue;
    }
    if (typeof value !== 'string') continue;

    // 1. Silent English identity fallback check
    if (
      key === value &&
      key.length >= minFallbackLength &&
      !allowlistKeys.has(key) &&
      !RETAINED_LOANWORD_PATTERNS.some((rx) => rx.test(key)) &&
      /[a-zA-Z]{3,}/.test(key) &&
      !/^https?:\/\//.test(key)
    ) {
      findings.push({
        key,
        rule: 'silent-fallback',
        message: `Untranslated identity fallback (key === value, ${key.length} chars).`,
      });
    }

    // 2. Placeholder parity check (preserves duplicate counts & printf tokens)
    const keyPh = extractPlaceholders(key);
    const valPh = extractPlaceholders(value);
    if (keyPh.join(',') !== valPh.join(',')) {
      findings.push({
        key,
        rule: 'placeholder-mismatch',
        message: `Placeholders in key [${keyPh.join(', ')}] do not match value [${valPh.join(', ')}].`,
      });
    }

    // 3. Known UI/domain polysemy & calque traps
    for (const trap of KNOWN_CALQUE_TRAPS) {
      if (trap.keyMatch.test(key) && trap.badVal.test(value)) {
        findings.push({
          key,
          rule: 'polysemy-calque',
          message: `Literal calque trap in "${value}"; use "${trap.fix}".`,
        });
      }
    }

    // 4. Text-level checks (SMS slang, kata tidak baku, slop)
    for (const issue of auditText(value)) {
      findings.push({
        key,
        rule: issue.rule,
        message: issue.message,
      });
    }
  }

  return findings;
}

/**
 * Parse a flat JavaScript locale dictionary (`export default { ... }` or `module.exports = { ... }`)
 * supporting both quoted keys (`'key'` / `"key"`) and unquoted identifier keys (`Back: 'Punggung'`)
 * without executing the file. Throws if the file cannot be parsed into at least one key-value entry
 * or contains unsupported property values.
 * @param {string} content
 * @returns {Record<string, string>}
 */
function parseSimpleJsLocale(content) {
  const src = String(content || '').replace(
    /(['"])(?:\\.|(?!\1)[^\\])*\1|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
    (match, quote) => (quote ? match : ''),
  );
  const openBrace = src.indexOf('{');
  const closeBrace = src.lastIndexOf('}');
  if (openBrace === -1 || closeBrace === -1 || closeBrace <= openBrace) {
    throw new Error('Unsupported JS locale format: missing object literal braces "{ ... }".');
  }

  const body = src.slice(openBrace + 1, closeBrace);
  const dict = {};
  const tokenRegex =
    /\/\*[\s\S]*?\*\/|\/\/[^\n]*|(?:(['"])((?:\\.|(?!\1)[^\\])*)\1|([A-Za-z_$][A-Za-z0-9_$]*))\s*:\s*(['"])((?:\\.|(?!\4)[^\\])*)\4\s*,?/g;

  let match;
  let count = 0;
  while ((match = tokenRegex.exec(body)) !== null) {
    if (match[1] || match[3]) {
      const rawKey = match[1] ? match[2].replace(/\\(['"\\])/g, '$1') : match[3];
      const rawVal = match[5].replace(/\\(['"\\])/g, '$1');
      dict[rawKey] = rawVal;
      count++;
    }
  }

  const leftover = body.replace(tokenRegex, '').trim();
  if (leftover.length > 0) {
    throw new Error(
      `Unsupported JS locale syntax near: ${leftover.slice(0, 80).replace(/\s+/g, ' ')}`,
    );
  }
  if (count === 0) {
    throw new Error('No key-value string entries found in JS locale object.');
  }

  return dict;
}

if (require.main === module) {
  const targets = process.argv.slice(2);
  if (targets.length === 0) {
    console.log('Usage: node scripts/audit-id.js <path-to-locale.json|locale.js|text.md> [...]');
    process.exit(0);
  }

  let hasFailures = false;

  for (const target of targets) {
    const absPath = path.resolve(process.cwd(), target);
    let raw;
    try {
      raw = fs.readFileSync(absPath, 'utf8');
    } catch (err) {
      console.error(`❌ Error reading ${target}: ${err.message}`);
      hasFailures = true;
      continue;
    }

    let findings = [];
    try {
      if (absPath.endsWith('.json')) {
        findings = auditDictionary(JSON.parse(raw));
      } else if (absPath.endsWith('.js') || absPath.endsWith('.mjs')) {
        findings = auditDictionary(parseSimpleJsLocale(raw));
      } else {
        findings = auditText(raw).map((f) => ({ key: path.basename(absPath), ...f }));
      }
    } catch (err) {
      console.error(`❌ Error parsing ${target}: ${err.message}`);
      hasFailures = true;
      continue;
    }

    if (findings.length === 0) {
      console.log(`✅ Clean: 0 findings in ${target}`);
    } else {
      hasFailures = true;
      console.error(`❌ Found ${findings.length} issue(s) in ${target}:`);
      for (const f of findings) {
        console.error(`  - [${f.rule}] (${f.key}): ${f.message}`);
      }
    }
  }

  process.exit(hasFailures ? 1 : 0);
}

module.exports = {
  auditText,
  auditDictionary,
  extractPlaceholders,
  parseSimpleJsLocale,
};
