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
  { regex: /\b(disini|disana|disitu)\b/i, fix: 'di sini / di sana / di situ' },
  { regex: /\b(diatas|dibawah|didalam|diluar)\b/i, fix: 'di atas / di bawah / di dalam / di luar' },
  { regex: /\b(kesana|kesini)\b/i, fix: 'ke sana / ke sini' },
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
  /^(?:(?:(?:single|one|two)-(?:leg|arm)|(?:reverse|close|wide|neutral|narrow|overhand|underhand|hammer|snatch)-grip|incline|decline|flat|barbell|dumbbell|ez-bar|cable|smith machine|seated|standing|close-grip|wide-grip|romanian|sumo|conventional|deficit|pause|paused|single-arm|one-arm|high-bar|low-bar|safety-bar|zercher|hack|belt|box|bulgarian)\s+){0,3}(?:bench press|barbell curl|back squat|front squat|split squat|squat|deadlift|overhead press|leverage machine)(?:\s*\([A-Za-z0-9 -]+\))?$/i,
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
 * Maximum cumulative diagnostic bytes printed by the CLI for findings per file (64 KB).
 */
const MAX_CLI_DIAGNOSTIC_BYTES = 64_000;

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
  const source = options.source ?? null;
  const pronoun = options.pronoun ?? null;

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
    let fullKey;
    if (!currentPrefix) {
      const truncationMarker = '...[truncated]';
      fullKey =
        key.length > MAX_PATH_LENGTH
          ? `${key.slice(0, Math.max(0, MAX_PATH_LENGTH - truncationMarker.length))}${truncationMarker}`
          : key;
    } else {
      const combined = `${currentPrefix}.${key}`;
      if (combined.length <= MAX_PATH_LENGTH) {
        fullKey = combined;
      } else {
        const truncationMarker = '...[truncated]';
        const maxLeafLength = Math.min(256, Math.max(16, Math.floor(MAX_PATH_LENGTH / 4)));
        const leaf =
          key.length > maxLeafLength
            ? `${key.slice(0, Math.max(0, maxLeafLength - truncationMarker.length))}${truncationMarker}`
            : key;
        const availableForPrefix = Math.max(0, MAX_PATH_LENGTH - leaf.length - 1 - truncationMarker.length);
        const head = currentPrefix.slice(0, availableForPrefix);
        fullKey = `${head}${truncationMarker}.${leaf}`;
      }
    }

    if (value && typeof value === 'object') {
      auditDictionary(value, {
        ...options,
        prefix: fullKey,
        depth: currentDepth + 1,
        source: (source && typeof source === 'object') ? source[key] : null,
        accumulator: findings,
        visited,
        activeStack,
        counter,
      });
      continue;
    }
    if (typeof value !== 'string') continue;

    const sourceValue = (source && typeof source === 'object') ? source[key] : undefined;

    // 1. Silent English identity fallback check
    const isUntranslated = typeof sourceValue === 'string' ? (value.trim() === sourceValue.trim()) : (key === value);
    const textOutsidePlaceholders = value.replace(/\{\{[0-9a-zA-Z_.-]+\}\}|\{[0-9a-zA-Z_.-]+\}|%(?:\d+\$)?[sdif]/g, '');
    if (
      isUntranslated &&
      value.length >= minFallbackLength &&
      !allowlistKeys.has(key) &&
      !allowlistKeys.has(fullKey) &&
      !RETAINED_LOANWORD_PATTERNS.some((rx) => rx.test(value)) &&
      /[a-zA-Z]{3,}/.test(textOutsidePlaceholders) &&
      !/^https?:\/\//.test(value)
    ) {
      findings.push({
        key: fullKey,
        rule: 'silent-fallback',
        message: `Untranslated identity fallback (${typeof sourceValue === 'string' ? 'source === value' : 'key === value'}, ${value.length} chars).`,
      });
    }

    // 2. Placeholder parity and well-formedness check
    const valPh = extractPlaceholders(value);

    // 2a. Malformed placeholder check (unmatched curly braces)
    const openBraces = (value.match(/\{/g) || []).length;
    const closeBraces = (value.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      findings.push({
        key: fullKey,
        rule: 'malformed-placeholder',
        message: `Unmatched curly braces in placeholder for "${value}".`,
      });
    }

    // 2b. Placeholder parity check
    if (typeof sourceValue === 'string') {
      const srcPh = extractPlaceholders(sourceValue);
      if (srcPh.join(',') !== valPh.join(',')) {
        findings.push({
          key: fullKey,
          rule: 'placeholder-mismatch',
          message: `Placeholders in source [${srcPh.join(', ')}] do not match value [${valPh.join(', ')}].`,
        });
      }
    } else {
      // Standalone mode: only check key placeholders if key itself contains placeholders (flat gettext pattern)
      const keyPh = extractPlaceholders(key);
      if (keyPh.length > 0 && keyPh.join(',') !== valPh.join(',')) {
        findings.push({
          key: fullKey,
          rule: 'placeholder-mismatch',
          message: `Placeholders in key [${keyPh.join(', ')}] do not match value [${valPh.join(', ')}].`,
        });
      }
    }

    // 2c. Inverted quantitative placeholder check
    // Catches when English source has a count/quantity placeholder followed by a noun
    // (e.g., "{0} sets unchecked", "{0} photos", "%d passkeys"),
    // but Indonesian translation flips it to ordinal format after the noun (e.g., "Set {0} belum dicentang", "Foto {0}").
    const sourceTemplate = typeof sourceValue === 'string' ? sourceValue : key;
    const quantMatch = sourceTemplate.match(/^(\{(?:\d+|n|count|total)\}|\{\{(?:\d+|n|count|total)\}\}|%(?:\d+\$)?d)\s+([A-Za-z-]+)/i);
    const isCopulaFollowing = quantMatch && /^(?:is|are|was|were|has|have)$/i.test(quantMatch[2]);
    if (quantMatch && !isCopulaFollowing) {
      const ph = quantMatch[1];
      const escapedPh = ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const followingWordMatch = value.match(new RegExp(`${escapedPh}\\s+([A-Za-z\\u00C0-\\u024F-]+)`, 'i'));
      const followingWord = followingWordMatch !== null ? followingWordMatch[1].toLowerCase() : null;

      const invertedMatch = value.match(
        new RegExp(`^([A-Za-z\\u00C0-\\u024F-]+(?:\\s+[A-Za-z\\u00C0-\\u024F-]+)*)\\s+${escapedPh}`, 'i'),
      );
      if (invertedMatch) {
        const leadingPhrase = invertedMatch[1].toLowerCase();
        const leadingWords = leadingPhrase.split(/\s+/);
        const firstLeading = leadingWords[0];

        const permittedQuantifierWord = /^(sebanyak|total|sekitar|hanya|ada|masih|tersisa|kurang)$/i;
        const isPermittedQuantifier =
          /^(kurang dari|lebih dari|masih ada|masih kurang)$/i.test(leadingPhrase) ||
          leadingWords.every((word) => permittedQuantifierWord.test(word));

        // Exclude common non-verb nouns (e.g. menit, latihan) from matching verb heuristic
        const pseudoVerbNoun = /^(?:menit|detik|jam|hari|minggu|bulan|tahun|set|foto|item|video|kunci|latihan|pesan)$/i;
        const leadingAdverb = /^(?:sudah|telah|akan|sedang|belum|pernah|baru|sempat|kembali)$/i;
        const verbCandidate =
          leadingAdverb.test(firstLeading) && leadingWords.length > 1
            ? leadingWords[1]
            : firstLeading;

        const isPredicate =
          !pseudoVerbNoun.test(verbCandidate) &&
          /^(?:di|ter|ber|me)[a-z\u00C0-\u024F]+/i.test(verbCandidate);

        const isTrailingAdverb = followingWord === 'lagi';
        const isPostState = /^(?:tersisa|belum|sudah|telah|akan|sedang|tidak)$/i.test(followingWord || '');
        const hasObjectOrImplicit =
          (followingWord !== null && !isPostState) || isTrailingAdverb;

        const isLeadingVerbWithObject = isPredicate && hasObjectOrImplicit;

        const eponymousNounPairs = {
          formula: /^rumus$/i,
          law: /^hukum$/i,
          theorem: /^teorema$/i,
          equation: /^persamaan$/i,
          principle: /^prinsip$/i,
        };
        const enNoun = quantMatch[2].toLowerCase();
        // Eponymous concepts strictly name a single formula/law (e.g. "{0} formula" -> "Rumus {0}"),
        // rather than counting items (e.g. "{0} law available" or "{0} laws found").
        const isEponymousPhrase =
          /^(?:\{\{[0-9a-zA-Z_.-]+\}\}|\{[0-9a-zA-Z_.-]+\}|%(?:\d+\$)?[sdif])\s+(?:formula|law|theorem|equation|principle)$/i.test(sourceTemplate.trim()) &&
          Boolean(eponymousNounPairs[enNoun] && eponymousNounPairs[enNoun].test(invertedMatch[1]));

        if (!isPermittedQuantifier && !isLeadingVerbWithObject && !isEponymousPhrase) {
          findings.push({
            key: fullKey,
            rule: 'inverted-quantitative-placeholder',
            message: `Quantitative placeholder inverted: "${sourceTemplate}" (${ph} count) translated with placeholder placed after noun ("${value}"); in Indonesian, quantity must precede the noun (${ph} ${invertedMatch[1]}).`,
          });
        }
      }
    }

    // 3. Known UI/domain polysemy & calque traps
    for (const trap of KNOWN_CALQUE_TRAPS) {
      const isKeyMatch =
        trap.keyMatch.test(key) ||
        (typeof sourceValue === 'string' && trap.keyMatch.test(sourceValue));
      if (isKeyMatch && trap.badVal.test(value)) {
        findings.push({
          key: fullKey,
          rule: 'polysemy-calque',
          message: `Literal calque trap in "${value}"; use "${trap.fix}".`,
        });
      }
    }

    // 4. Pronoun policy check (when explicit project override is specified)
    if (pronoun === 'Anda') {
      const hasEncliticMu = (value.match(/\b[a-zA-Z\u00C0-\u024F]{2,}-?mu\b/gi) || []).some(
        (w) => !/^(?:kamu|ilmu|berilmu|tamu|bertamu|temu|bertemu|ketemu|ditemu|menemu|jamu|ramu|meramu|diramu|semu|bersemu|jemu)$/i.test(w),
      );
      if (/\b(?:kamu|kau)\b/i.test(value) || hasEncliticMu) {
        findings.push({
          key: fullKey,
          rule: 'pronoun-mismatch',
          message: `Informal pronoun found in "${value}"; formal "Anda" is enforced by project policy.`,
        });
      }
    } else if (pronoun === 'kamu') {
      if (/\bAnda\b/.test(value)) {
        findings.push({
          key: fullKey,
          rule: 'pronoun-mismatch',
          message: `Formal pronoun "Anda" found in "${value}"; informal "kamu" is enforced by project policy.`,
        });
      }
    }

    // 5. Text-level checks (SMS slang, kata tidak baku, slop)
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
 * Truncates a string to fit within a given UTF-8 byte budget without breaking UTF-8 code point boundaries.
 * @param {string} str
 * @param {number} maxBytes
 * @returns {string}
 */
function truncateToUtf8ByteLimit(str, maxBytes) {
  if (maxBytes <= 0) return '';
  let sliceLen = Math.min(str.length, maxBytes);
  let candidate = str.slice(0, sliceLen);
  while (true) {
    const bytes = Buffer.byteLength(candidate, 'utf8');
    if (bytes <= maxBytes) break;
    const excess = bytes - maxBytes;
    const charsToTrim = Math.max(1, Math.ceil(excess / 4));
    candidate = candidate.slice(0, -charsToTrim);
  }
  if (/[\uD800-\uDBFF]$/.test(candidate)) {
    candidate = candidate.slice(0, -1);
  }
  return candidate;
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

  // Linear single-pass strip of comments while preserving string literals.
  // Also builds a same-length masked representation with string contents replaced by spaces
  // to prevent matching 'export default' or '{' inside string literals.
  let stripped = '';
  let masked = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === '"' || ch === '\'' || ch === '`') {
      const quote = ch;
      stripped += quote;
      masked += quote;
      i++;
      let closed = false;
      while (i < n) {
        const c = src[i];
        stripped += c;
        masked += c === quote ? c : ' ';
        if (c === '\\') {
          i++;
          if (i < n) {
            stripped += src[i];
            masked += ' ';
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
      masked += ch;
      i++;
    }
  }

  // Prefer export default { ... } if present, otherwise fall back to named export or module.exports = { ... }
  // to avoid confusing leading import statements or preceding helper object declarations with the exported locale
  const defaultExportMatch = masked.match(/export\s+default\s*\{/);
  const namedExportMatch = masked.match(/(?:export\s+(?:const|let|var)\s+[a-zA-Z_$][0-9a-zA-Z_$]*\s*=|module\.exports\s*=)\s*\{/);
  const exportMatch = defaultExportMatch || namedExportMatch;
  const openBrace = exportMatch ? exportMatch.index + exportMatch[0].lastIndexOf('{') : masked.indexOf('{');
  const closeBrace = stripped.lastIndexOf('}');
  if (openBrace === -1 || closeBrace === -1 || closeBrace <= openBrace) {
    throw new Error('Unsupported JS locale format: missing object literal braces "{ ... }".');
  }

  let pos = openBrace + 1;
  const len = closeBrace;

  function skipWhitespaceAndCommas() {
    while (pos < len && (/\s/.test(stripped[pos]) || stripped[pos] === ',')) {
      pos++;
    }
  }

  function parseStringLiteral() {
    const quote = stripped[pos];
    pos++;
    let val = '';
    let closed = false;
    while (pos < len) {
      const c = stripped[pos];
      if (c === '\\') {
        pos++;
        if (pos < len) {
          const esc = stripped[pos];
          val += (esc === quote || esc === '\\') ? esc : ('\\' + esc);
        }
      } else if (c === quote) {
        closed = true;
        pos++;
        break;
      } else if (quote === '`' && c === '$' && stripped[pos + 1] === '{') {
        throw new Error(
          `Unsupported JS locale syntax near: ${stripped.slice(pos, pos + 80).replace(/\s+/g, ' ')}`,
        );
      } else {
        val += c;
      }
      pos++;
    }
    if (!closed) throw new Error('Unterminated string literal in JS locale.');
    return val;
  }

  function parseObjectLiteral() {
    const dict = {};
    let entryCount = 0;

    while (pos < len) {
      skipWhitespaceAndCommas();
      if (pos >= len) break;
      if (stripped[pos] === '}') {
        pos++; // consume '}'
        break;
      }

      // Parse key: quoted string or identifier
      let key = null;
      const startChar = stripped[pos];
      if (startChar === '"' || startChar === '\'' || startChar === '`') {
        key = parseStringLiteral();
      } else if (/[A-Za-z_$]/.test(startChar)) {
        const idStart = pos;
        while (pos < len && /[A-Za-z0-9_$]/.test(stripped[pos])) {
          pos++;
        }
        key = stripped.slice(idStart, pos);
      } else {
        throw new Error(`Unsupported JS locale syntax near: ${stripped.slice(pos, pos + 80).replace(/\s+/g, ' ')}`);
      }

      skipWhitespaceAndCommas();
      if (pos >= len || stripped[pos] !== ':') {
        throw new Error(`Unsupported JS locale syntax near: ${stripped.slice(pos, pos + 80).replace(/\s+/g, ' ')}`);
      }
      pos++; // skip ':'

      skipWhitespaceAndCommas();
      if (pos >= len) {
        throw new Error(`Unexpected end of input after key "${key}".`);
      }

      // Parse value: nested object '{', array '[', string literal, or reject dynamic expressions
      const valChar = stripped[pos];
      if (valChar === '{') {
        pos++; // consume '{'
        const subResult = parseObjectLiteral();
        dict[key] = subResult.dict;
        entryCount++;
      } else if (valChar === '[') {
        pos++; // consume '['
        const arr = [];
        let expectComma = false;
        let arrayClosed = false;
        while (pos < len) {
          while (pos < len && /\s/.test(stripped[pos])) pos++;
          if (pos >= len) break;
          if (stripped[pos] === ']') {
            pos++; // consume ']'
            arrayClosed = true;
            break;
          }
          if (expectComma) {
            if (stripped[pos] === '}') {
              throw new Error(`Unterminated array literal in JS locale near: ${stripped.slice(pos, pos + 80).replace(/\s+/g, ' ')}`);
            }
            if (stripped[pos] !== ',') {
              throw new Error(`Unsupported JS locale syntax in array near: ${stripped.slice(pos, pos + 80).replace(/\s+/g, ' ')}`);
            }
            pos++; // consume ','
            while (pos < len && /\s/.test(stripped[pos])) pos++;
            if (pos < len && stripped[pos] === ']') {
              pos++; // consume ']'
              arrayClosed = true;
              break;
            }
          }
          const itemChar = stripped[pos];
          if (itemChar === '"' || itemChar === '\'' || itemChar === '`') {
            arr.push(parseStringLiteral());
            expectComma = true;
          } else {
            throw new Error(`Unsupported JS locale syntax in array near: ${stripped.slice(pos, pos + 80).replace(/\s+/g, ' ')}`);
          }
        }
        if (!arrayClosed) {
          throw new Error(`Unterminated array literal in JS locale near: ${stripped.slice(pos, pos + 80).replace(/\s+/g, ' ')}`);
        }
        dict[key] = arr;
        entryCount++;
      } else if (valChar === '"' || valChar === '\'' || valChar === '`') {
        const val = parseStringLiteral();
        dict[key] = val;
        entryCount++;
      } else {
        throw new Error(`Unsupported JS locale syntax near: ${stripped.slice(pos, pos + 80).replace(/\s+/g, ' ')}`);
      }

      skipWhitespaceAndCommas();
      if (pos < len && stripped[pos] === '}') {
        pos++; // consume '}'
        break;
      }
    }

    return { dict, entryCount };
  }

  const { dict, entryCount } = parseObjectLiteral();
  if (entryCount === 0) {
    throw new Error('No key-value string entries found in JS locale object.');
  }

  return dict;
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  let showHelp = false;
  let jsonOutput = false;
  let minFallbackLength = 16;
  let sourcePath = null;
  let pronounPolicy = null;
  const targets = [];

  const parseMinFallback = (raw) => {
    const n = Number(raw);
    if (raw === undefined || raw === '' || !Number.isInteger(n) || n < 0) {
      console.error(
        `❌ Invalid value for --min-fallback: ${sanitizeDiagnostic(raw ?? '(missing)')} (expected a non-negative integer)`,
      );
      process.exit(1);
    }
    return n;
  };

  const parsePronoun = (raw) => {
    const val = String(raw || '').toLowerCase();
    if (val === 'anda') return 'Anda';
    if (val === 'kamu') return 'kamu';
    if (val === 'any') return null;
    console.error(
      `❌ Invalid value for --pronoun: ${sanitizeDiagnostic(raw ?? '(missing)')} (expected "Anda", "kamu", or "any")`,
    );
    process.exit(1);
  };

  const parseRegister = (raw) => {
    const val = String(raw || '').toLowerCase();
    if (val === 'formal') return 'Anda';
    if (val === 'casual') return 'kamu';
    if (val === 'any') return null;
    console.error(
      `❌ Invalid value for --register: ${sanitizeDiagnostic(raw ?? '(missing)')} (expected "formal", "casual", or "any")`,
    );
    process.exit(1);
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      showHelp = true;
    } else if (arg === '--json') {
      jsonOutput = true;
    } else if (arg === '--min-fallback') {
      if (i + 1 >= argv.length) {
        console.error('❌ Missing value for --min-fallback (expected a non-negative integer)');
        process.exit(1);
      }
      minFallbackLength = parseMinFallback(argv[++i]);
    } else if (arg.startsWith('--min-fallback=')) {
      minFallbackLength = parseMinFallback(arg.slice(15));
    } else if (arg === '--source') {
      if (i + 1 >= argv.length) {
        console.error('❌ Missing value for --source (expected a file path)');
        process.exit(1);
      }
      sourcePath = argv[++i];
    } else if (arg.startsWith('--source=')) {
      sourcePath = arg.slice(9);
    } else if (arg === '--pronoun') {
      if (i + 1 >= argv.length) {
        console.error('❌ Missing value for --pronoun (expected "Anda", "kamu", or "any")');
        process.exit(1);
      }
      pronounPolicy = parsePronoun(argv[++i]);
    } else if (arg.startsWith('--pronoun=')) {
      pronounPolicy = parsePronoun(arg.slice(10));
    } else if (arg === '--register') {
      if (i + 1 >= argv.length) {
        console.error('❌ Missing value for --register (expected "formal", "casual", or "any")');
        process.exit(1);
      }
      pronounPolicy = parseRegister(argv[++i]);
    } else if (arg.startsWith('--register=')) {
      pronounPolicy = parseRegister(arg.slice(11));
    } else if (arg.startsWith('-')) {
      console.error(`❌ Unknown option: ${sanitizeDiagnostic(arg)}`);
      process.exit(1);
    } else {
      targets.push(arg);
    }
  }

  if (showHelp || targets.length === 0) {
    console.log(`Indonesian Linguist — Deterministic i18n & Prose Auditor

Usage:
  node scripts/audit-id.js [options] <files...>

Options:
  -h, --help            Show this help message and exit
  --json                Output findings in structured JSON format
  --source <file>       Path to source catalog (.json/.js) to compare placeholders and fallbacks
  --min-fallback <n>    Minimum character length for identity fallback check (default: 16)
  --pronoun <name>      Enforce consistent pronoun in .json/.js/.mjs dictionaries: "Anda", "kamu", or "any" (default: any)
  --register <mode>     Alias for pronoun policy (dictionaries only): "formal" (Anda), "casual" (kamu), or "any"
`);
    process.exit(0);
  }

  let sourceCatalog = null;
  if (sourcePath !== null) {
    if (!sourcePath.trim()) {
      console.error('❌ Missing value for --source (expected a file path)');
      process.exit(1);
    }
    const absSourcePath = path.resolve(process.cwd(), sourcePath);
    try {
      const rawSource = fs.readFileSync(absSourcePath, 'utf8');
      if (absSourcePath.endsWith('.json')) {
        sourceCatalog = JSON.parse(rawSource);
      } else if (absSourcePath.endsWith('.js') || absSourcePath.endsWith('.mjs')) {
        sourceCatalog = parseSimpleJsLocale(rawSource);
      } else {
        console.error(
          `❌ Error: --source file must be a .json or .js/.mjs locale dictionary: ${sanitizeDiagnostic(sourcePath)}`,
        );
        process.exit(1);
      }
    } catch (err) {
      console.error(
        `❌ Error loading source catalog ${sanitizeDiagnostic(sourcePath)}: ${sanitizeDiagnostic(err.message)}`,
      );
      process.exit(1);
    }
  }

  let hasFailures = false;
  const jsonReport = {
    totalFiles: targets.length,
    cleanFiles: 0,
    failedFiles: 0,
    totalFindings: 0,
    files: [],
  };

  for (const target of targets) {
    const absPath = path.resolve(process.cwd(), target);
    let raw;
    try {
      raw = fs.readFileSync(absPath, 'utf8');
    } catch (err) {
      if (jsonOutput) {
        jsonReport.failedFiles++;
        jsonReport.files.push({
          file: target,
          error: `Error reading file: ${err.message}`,
          clean: false,
          findings: [],
        });
      } else {
        console.error(`❌ Error reading ${sanitizeDiagnostic(target)}: ${sanitizeDiagnostic(err.message)}`);
      }
      hasFailures = true;
      continue;
    }

    let findings = [];
    try {
      if (absPath.endsWith('.json')) {
        findings = auditDictionary(JSON.parse(raw), {
          minFallbackLength,
          source: sourceCatalog,
          pronoun: pronounPolicy,
        });
      } else if (absPath.endsWith('.js') || absPath.endsWith('.mjs')) {
        findings = auditDictionary(parseSimpleJsLocale(raw), {
          minFallbackLength,
          source: sourceCatalog,
          pronoun: pronounPolicy,
        });
      } else {
        findings = auditText(raw).map((f) => ({ key: path.basename(absPath), ...f }));
      }
    } catch (err) {
      if (jsonOutput) {
        jsonReport.failedFiles++;
        jsonReport.files.push({
          file: target,
          error: `Error parsing file: ${err.message}`,
          clean: false,
          findings: [],
        });
      } else {
        console.error(`❌ Error parsing ${sanitizeDiagnostic(target)}: ${sanitizeDiagnostic(err.message)}`);
      }
      hasFailures = true;
      continue;
    }

    if (jsonOutput) {
      jsonReport.totalFindings += findings.length;
      if (findings.length === 0) {
        jsonReport.cleanFiles++;
        jsonReport.files.push({
          file: target,
          clean: true,
          findings: [],
        });
      } else {
        jsonReport.failedFiles++;
        hasFailures = true;
        jsonReport.files.push({
          file: target,
          clean: false,
          findings,
        });
      }
    } else {
      if (findings.length === 0) {
        console.log(`✅ Clean: 0 findings in ${sanitizeDiagnostic(target)}`);
      } else {
        hasFailures = true;
        console.error(`❌ Found ${findings.length} issue(s) in ${sanitizeDiagnostic(target)}:`);
        let printedBytes = 0;
        let truncated = false;
        for (const f of findings) {
          const line = `  - [${sanitizeDiagnostic(f.rule)}] (${sanitizeDiagnostic(f.key)}): ${sanitizeDiagnostic(f.message)}\n`;
          const lineBytes = Buffer.byteLength(line, 'utf8');
          if (printedBytes + lineBytes > MAX_CLI_DIAGNOSTIC_BYTES) {
            truncated = true;
            const remainingBudget = Math.max(0, MAX_CLI_DIAGNOSTIC_BYTES - printedBytes);
            if (remainingBudget > 0) {
              const truncatedLine = truncateToUtf8ByteLimit(line, remainingBudget);
              process.stderr.write(truncatedLine);
              process.stderr.write('\n');
            }
            break;
          }
          printedBytes += lineBytes;
          process.stderr.write(line);
        }
        if (truncated) {
          console.error(
            `  ... remaining findings truncated (cumulative output exceeded ${MAX_CLI_DIAGNOSTIC_BYTES} bytes limit)`,
          );
        }
      }
    }
  }

  if (jsonOutput) {
    process.stdout.write(JSON.stringify(jsonReport, null, 2) + '\n');
  }

  process.exitCode = hasFailures ? 1 : 0;
}

module.exports = {
  auditText,
  auditDictionary,
  extractPlaceholders,
  parseSimpleJsLocale,
  sanitizeDiagnostic,
  truncateToUtf8ByteLimit,
};
