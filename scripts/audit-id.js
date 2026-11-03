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
  {
    keyMatch: {
      test(key) {
        const idx = String(key || '').search(/\bsigns\b/i);
        return idx !== -1 && /\bouts?\b/i.test(key.slice(idx + 5));
      },
    },
    badVal: /\bmenandakan\b/i,
    fix: 'mengeluarkan',
  },
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
  /^(?:(?:(?:single|one|two)-(?:leg|arm)|(?:reverse|close|wide|neutral|narrow|overhand|underhand|hammer|snatch)-grip|incline|decline|flat|barbell|dumbbell|ez-bar|cable|smith machine|seated|standing|close-grip|wide-grip|romanian|sumo|conventional|deficit|pause|paused|single-arm|one-arm)\s+){0,3}(?:bench press|barbell curl|back squat|front squat|deadlift|overhead press|leverage machine)(?:\s*\([A-Za-z0-9 -]+\))?$/i,
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
  let listContentIndent = 0;
  let inIndentedCodeBlock = false;
  let afterBlankLine = true;

  // Width in columns of a whitespace/marker prefix, using 4-column tab stops.
  const columns = (prefix) => {
    let col = 0;
    for (const ch of prefix) col += ch === '\t' ? 4 - (col % 4) : 1;
    return col;
  };

  for (const line of lines) {
    if (line.trim() === '') {
      out.push('');
      afterBlankLine = true;
      continue;
    }

    const indent = columns(line.match(/^[ \t]*/)[0]);
    const listMatch = line.match(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/);
    // Inside a list, content only becomes code when indented 4+ columns past the item's content.
    const codeThreshold = inListContext ? listContentIndent + 4 : 4;

    if (indent >= codeThreshold && (inIndentedCodeBlock || afterBlankLine)) {
      inIndentedCodeBlock = true;
      afterBlankLine = false;
      out.push('');
      continue;
    }

    inIndentedCodeBlock = false;
    if (listMatch) {
      inListContext = true;
      listContentIndent = columns(listMatch[0]);
    } else if (indent < 4) {
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
 * @param {{ stripIndentedCode?: boolean }} [options] Set `stripIndentedCode: false` for plain-text input (e.g., dictionary values) where indentation does not mark code.
 * @returns {Array<{rule: string, message: string}>}
 */
function auditText(text, options = {}) {
  const stripIndentedCode = options.stripIndentedCode ?? true;
  const issues = [];
  const withoutFences = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ');
  const str = (stripIndentedCode ? stripIndentedCodeBlocks(withoutFences) : withoutFences).replace(/`[^`\n]+`/g, ' ');

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
 * Maximum allowed nesting depth for i18n dictionaries to prevent resource exhaustion.
 */
const MAX_DICTIONARY_DEPTH = 32;

/**
 * Maximum allowed findings collected during a dictionary audit before bounding output.
 */
const MAX_DICTIONARY_FINDINGS = 5000;

/**
 * Maximum total entries (keys + sub-objects) traversed across an entire dictionary audit.
 */
const MAX_DICTIONARY_ENTRIES = 50_000;

/**
 * Maximum character length for nested dictionary key paths to prevent amplification attacks.
 */
const MAX_PATH_LENGTH = 1024;

/**
 * Maximum cumulative diagnostic bytes printed by the CLI for findings per file.
 */
const MAX_CLI_DIAGNOSTIC_BYTES = 500_000;

/**
 * Audit a key-value i18n dictionary object (including nested namespace objects).
 * Collects findings in a single accumulator with explicit depth, size, and traversal bounds.
 * Tracks visited object references to prevent exponential work on compact shared-reference graphs,
 * and tracks active ancestors to immediately break cycles.
 * @param {Record<string, unknown>} dict
 * @param {{ minFallbackLength?: number, allowlistKeys?: Set<string>, prefix?: string, depth?: number, accumulator?: Array<{key: string, rule: string, message: string}>, visited?: Map<object, number>, activeStack?: Set<object>, counter?: { entries: number } }} [options]
 * @returns {Array<{key: string, rule: string, message: string}>}
 */
function auditDictionary(dict, options = {}) {
  const minFallbackLength = options.minFallbackLength ?? 16;
  const allowlistKeys = options.allowlistKeys ?? new Set();
  const currentPrefix = options.prefix ?? '';
  const currentDepth = options.depth ?? 0;
  const findings = options.accumulator ?? [];
  const visited = options.visited ?? new Map();
  const activeStack = options.activeStack ?? new Set();
  const counter = options.counter ?? { entries: 0 };

  const isObject = dict && typeof dict === 'object';
  if (isObject && activeStack.has(dict)) {
    return findings;
  }

  if (currentDepth > MAX_DICTIONARY_DEPTH) {
    findings.push({
      key: currentPrefix || 'root',
      rule: 'nesting-limit-exceeded',
      message: `Dictionary nesting depth exceeded safety limit of ${MAX_DICTIONARY_DEPTH}.`,
    });
    return findings;
  }

  if (isObject) {
    const deepestVisited = visited.get(dict);
    if (deepestVisited !== undefined && currentDepth <= deepestVisited) {
      return findings;
    }
    visited.set(dict, currentDepth);
    activeStack.add(dict);
  }

  const keys = isObject ? Object.keys(dict) : [];

  for (const key of keys) {
    counter.entries++;
    if (counter.entries > MAX_DICTIONARY_ENTRIES) {
      findings.push({
        key: currentPrefix || 'root',
        rule: 'traversal-limit-exceeded',
        message: `Total dictionary traversal work exceeded safety limit of ${MAX_DICTIONARY_ENTRIES} entries.`,
      });
      break;
    }

    if (findings.length >= MAX_DICTIONARY_FINDINGS) {
      findings.push({
        key: currentPrefix || 'root',
        rule: 'findings-limit-exceeded',
        message: `Total dictionary findings exceeded safety limit of ${MAX_DICTIONARY_FINDINGS}.`,
      });
      break;
    }

    const value = dict[key];
    const rawKey = currentPrefix ? `${currentPrefix}.${key}` : key;
    const fullKey =
      rawKey.length > MAX_PATH_LENGTH
        ? `${rawKey.slice(0, MAX_PATH_LENGTH)}...[truncated]`
        : rawKey;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      auditDictionary(value, {
        ...options,
        prefix: fullKey,
        depth: currentDepth + 1,
        accumulator: findings,
        visited,
        activeStack,
        counter,
      });
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
        key: fullKey,
        rule: 'silent-fallback',
        message: `Untranslated identity fallback (key === value, ${key.length} chars).`,
      });
    }

    // 2. Placeholder parity check (preserves duplicate counts & printf tokens)
    const keyPh = extractPlaceholders(key);
    const valPh = extractPlaceholders(value);
    if (keyPh.join(',') !== valPh.join(',')) {
      findings.push({
        key: fullKey,
        rule: 'placeholder-mismatch',
        message: `Placeholders in key [${keyPh.join(', ')}] do not match value [${valPh.join(', ')}].`,
      });
    }

    // 3. Known UI/domain polysemy & calque traps
    for (const trap of KNOWN_CALQUE_TRAPS) {
      if (trap.keyMatch.test(key) && trap.badVal.test(value)) {
        findings.push({
          key: fullKey,
          rule: 'polysemy-calque',
          message: `Literal calque trap in "${value}"; use "${trap.fix}".`,
        });
      }
    }

    // 4. Text-level checks (SMS slang, kata tidak baku, slop)
    for (const issue of auditText(value, { stripIndentedCode: false })) {
      findings.push({
        key: fullKey,
        rule: issue.rule,
        message: issue.message,
      });
    }
  }

  if (isObject) {
    activeStack.delete(dict);
  }

  return findings;
}

/**
 * Sanitize diagnostic strings to prevent log injection and terminal control sequence tampering.
 * Escapes C0/C1 control characters, Unicode line/paragraph separators, and bidirectional controls.
 * @param {string} str
 * @returns {string}
 */
function sanitizeDiagnostic(str) {
  return String(str || '').replace(/[\x00-\x1f\x7f-\x9f\u061c\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g, (c) => {
    if (c === '\n') return '\\n';
    if (c === '\r') return '\\r';
    if (c === '\t') return '\\t';
    const code = c.charCodeAt(0);
    return code > 0xff
      ? '\\u' + code.toString(16).padStart(4, '0')
      : '\\x' + code.toString(16).padStart(2, '0');
  });
}

/**
 * Maximum allowed source length for simple JavaScript locale files (1 MB).
 */
const MAX_JS_LOCALE_LENGTH = 1_000_000;

/**
 * Parse a flat JavaScript locale dictionary (`export default { ... }` or `module.exports = { ... }`)
 * supporting both quoted keys (`'key'` / `"key"`) and unquoted identifier keys (`Back: 'Punggung'`)
 * without executing the file. Uses a linear single-pass forward scanner to prevent ReDoS.
 * Throws if the file cannot be parsed into at least one key-value entry or contains unsupported syntax.
 * @param {string} content
 * @returns {Record<string, string>}
 */
function parseSimpleJsLocale(content) {
  const src = String(content || '');
  if (src.length > MAX_JS_LOCALE_LENGTH) {
    throw new Error(`JS locale source exceeds maximum length of ${MAX_JS_LOCALE_LENGTH} characters.`);
  }

  // Linear single-pass strip of comments while preserving string literals
  let stripped = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === '"' || ch === '\'') {
      const quote = ch;
      stripped += quote;
      i++;
      let closed = false;
      while (i < n) {
        const c = src[i];
        stripped += c;
        if (c === '\\') {
          i++;
          if (i < n) {
            stripped += src[i];
            i++;
          }
          continue;
        } else if (c === quote) {
          closed = true;
          i++;
          break;
        }
        i++;
      }
      if (!closed) throw new Error('Unterminated string literal in JS locale.');
    } else if (ch === '/' && src[i + 1] === '/') {
      i += 2;
      while (i < n && src[i] !== '\n') i++;
    } else if (ch === '/' && src[i + 1] === '*') {
      i += 2;
      let closed = false;
      while (i < n) {
        if (src[i] === '*' && src[i + 1] === '/') {
          i += 2;
          closed = true;
          break;
        }
        i++;
      }
      if (!closed) throw new Error('Unterminated block comment in JS locale.');
    } else {
      stripped += ch;
      i++;
    }
  }

  const openBrace = stripped.indexOf('{');
  const closeBrace = stripped.lastIndexOf('}');
  if (openBrace === -1 || closeBrace === -1 || closeBrace <= openBrace) {
    throw new Error('Unsupported JS locale format: missing object literal braces "{ ... }".');
  }

  const body = stripped.slice(openBrace + 1, closeBrace);
  const dict = {};

  let pos = 0;
  const len = body.length;
  let count = 0;

  function skipWhitespaceAndCommas() {
    while (pos < len && (/\s/.test(body[pos]) || body[pos] === ',')) {
      pos++;
    }
  }

  while (pos < len) {
    skipWhitespaceAndCommas();
    if (pos >= len) break;

    // Parse key: quoted string or identifier
    let key = null;
    const startChar = body[pos];
    if (startChar === '"' || startChar === '\'') {
      const quote = startChar;
      pos++;
      let rawKey = '';
      let closed = false;
      while (pos < len) {
        const c = body[pos];
        if (c === '\\') {
          pos++;
          if (pos < len) {
            const esc = body[pos];
            rawKey += (esc === quote || esc === '\\') ? esc : ('\\' + esc);
          }
        } else if (c === quote) {
          closed = true;
          pos++;
          break;
        } else {
          rawKey += c;
        }
        pos++;
      }
      if (!closed) throw new Error('Unterminated key string in JS locale object.');
      key = rawKey;
    } else if (/[A-Za-z_$]/.test(startChar)) {
      const idStart = pos;
      while (pos < len && /[A-Za-z0-9_$]/.test(body[pos])) {
        pos++;
      }
      key = body.slice(idStart, pos);
    } else {
      throw new Error(`Unsupported JS locale syntax near: ${body.slice(pos, pos + 80).replace(/\s+/g, ' ')}`);
    }

    skipWhitespaceAndCommas();
    if (pos >= len || body[pos] !== ':') {
      throw new Error(`Unsupported JS locale syntax near: ${body.slice(pos, pos + 80).replace(/\s+/g, ' ')}`);
    }
    pos++; // skip ':'

    skipWhitespaceAndCommas();
    if (pos >= len) {
      throw new Error(`Unexpected end of input after key "${key}".`);
    }

    // Parse value: must be quoted string
    const valQuote = body[pos];
    if (valQuote !== '"' && valQuote !== '\'') {
      throw new Error(`Unsupported JS locale syntax near: ${body.slice(pos, pos + 80).replace(/\s+/g, ' ')}`);
    }
    pos++;
    let val = '';
    let valClosed = false;
    while (pos < len) {
      const c = body[pos];
      if (c === '\\') {
        pos++;
        if (pos < len) {
          const esc = body[pos];
          val += (esc === valQuote || esc === '\\') ? esc : ('\\' + esc);
        }
      } else if (c === valQuote) {
        valClosed = true;
        pos++;
        break;
      } else {
        val += c;
      }
      pos++;
    }
    if (!valClosed) throw new Error(`Unterminated value string for key "${key}".`);

    dict[key] = val;
    count++;
    skipWhitespaceAndCommas();
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
      console.error(`❌ Error reading ${sanitizeDiagnostic(target)}: ${sanitizeDiagnostic(err.message)}`);
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
      console.error(`❌ Error parsing ${sanitizeDiagnostic(target)}: ${sanitizeDiagnostic(err.message)}`);
      hasFailures = true;
      continue;
    }

    if (findings.length === 0) {
      console.log(`✅ Clean: 0 findings in ${sanitizeDiagnostic(target)}`);
    } else {
      hasFailures = true;
      console.error(`❌ Found ${findings.length} issue(s) in ${sanitizeDiagnostic(target)}:`);
      let printedBytes = 0;
      let truncated = false;
      for (const f of findings) {
        const line = `  - [${sanitizeDiagnostic(f.rule)}] (${sanitizeDiagnostic(f.key)}): ${sanitizeDiagnostic(f.message)}\n`;
        printedBytes += Buffer.byteLength(line, 'utf8');
        if (printedBytes > MAX_CLI_DIAGNOSTIC_BYTES) {
          truncated = true;
          break;
        }
        process.stderr.write(line);
      }
      if (truncated) {
        console.error(
          `  ... remaining findings truncated (cumulative output exceeded ${MAX_CLI_DIAGNOSTIC_BYTES} bytes limit)`,
        );
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
  sanitizeDiagnostic,
};
