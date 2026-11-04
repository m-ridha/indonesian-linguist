// @ts-check
/**
 * Indonesian Linguist Client Engine Bundle
 * AUTOMATICALLY GENERATED from scripts/audit-id.js — DO NOT EDIT DIRECTLY.
 * Run "npm run build:space" to regenerate.
 */

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
  { keyMatch: /assist(ance|ed) machine/i, badVal: /\bmesin bantuan\b/i, fix: 'mesin assisted / mesin berbeban bantuan' },
  {
    keyMatch: {
      test(key, sourceVal) {
        const raw = typeof sourceVal === 'string' ? sourceVal : key;
        const text = typeof raw === 'string' ? raw.trim() : raw;
        return text !== 'App Store' && /^app stores?$/i.test(text);
      },
    },
    badVal: /^(?:app stores?|toko app)$/i,
    fix: 'Toko aplikasi',
  },
  {
    keyMatch: {
      test(key, sourceVal) {
        const raw = typeof sourceVal === 'string' ? sourceVal : key;
        const text = typeof raw === 'string' ? raw.trim() : raw;
        return text === 'App Store';
      },
    },
    badVal: /^(?:toko app|toko aplikasi)$/i,
    fix: 'App Store',
  },
  { keyMatch: /^lengths in\s*:?$/i, badVal: /^panjang dalam\s*:?$/i, fix: 'Satuan panjang / Satuan ukuran' },
  { keyMatch: /^weights in\s*:?$/i, badVal: /^(?:beban|berat) dalam\s*:?$/i, fix: 'Satuan beban / Satuan berat badan' },
  { keyMatch: /^distance in\s*:?$/i, badVal: /^jarak dalam\s*:?$/i, fix: 'Satuan jarak' },
  { keyMatch: /end of a hold/i, badVal: /\b(akhir|ujung)\s+tahanan\b/i, fix: 'Akhir durasi tahan / Waktu tahan selesai' },
];

// Full-string anchored patterns for complete retained loanwords, exercise names, Latin muscle names,
// and official product/OS proper nouns. Never matches arbitrary English sentences containing these words.
const RETAINED_LOANWORD_PATTERNS = [
  /^(?:Drop-set\s*\/\s*rest-pause|Drop-set|Superset(?:\s+\{[0-9]+\}(?:\s*\/\s*\{[0-9]+\}|\s*:\s*\{[0-9]+\}\s*\(\{[0-9]+\}\))?)?|Rest-pause|Deload|Bodyweight|Thibaudeau\s*\(Powerlifting\))$/i,
  /^(?:(?:(?:single|one|two)-(?:leg|arm)|(?:reverse|close|wide|neutral|narrow|overhand|underhand|hammer|snatch)-grip|incline|decline|flat|barbell|dumbbell|ez-bar|cable|smith machine|seated|standing|close-grip|wide-grip|romanian|sumo|conventional|deficit|pause|paused|single-arm|one-arm|high-bar|low-bar|safety-bar|zercher|hack|belt|box|bulgarian)\s+){0,3}(?:bench press|barbell curl|back squat|front squat|split squat|squat|deadlift|overhead press|leverage machine)(?:\s*\([A-Za-z0-9 -]+\))?$/i,
  /^(?:serratus anterior|latissimus dorsi|sternocleidomastoid|pectoralis(?:\s+major|\s+minor)?|gluteus(?:\s+maximus|\s+medius)?|gastrocnemius)$/i,
  /^(?:Face ID(?:\s*\/\s*Touch ID)?|Touch ID|iCloud Keychain|Google Password Manager|Health Connect|Apple Health|Apple Watch|Google Play(?:\s+Store)?|App Store|Cloudflare Access)$/i,
  /^(?:API key|endpoint|reverse proxy|source code|webhook)$/i,
  /^(?:Bahasa Indonesia(?:\s*\([A-Za-z0-9_-]+\))?|Bahasa Melayu(?:\s*\([A-Za-z0-9_-]+\))?|English(?:\s*\([A-Za-z0-9_-]+\))?|[a-z]{2}(?:[-_][A-Z]{2,4})?)$/i,
];

const RULE_CATEGORIES = {
  'kata-tidak-baku': 'grammar',
  'slop-or-pleonasm': 'grammar',
  'merged-preposition': 'grammar',
  'polysemy-calque': 'terminology',
  'retained-loanword-calque': 'terminology',
  'pronoun-mismatch': 'style',
  'inverted-quantitative-placeholder': 'style',
  'sms-abbreviation': 'style',
  'silent-fallback': 'parity',
  'placeholder-mismatch': 'parity',
  'malformed-placeholder': 'parity',
  'nesting-limit-exceeded': 'structure',
  'traversal-limit-exceeded': 'structure',
  'findings-limit-exceeded': 'structure',
};

/**
 * Maps a diagnostic rule identifier to its high-level audit category.
 * @param {string} rule - The rule identifier string.
 * @returns {string} The categorized domain (grammar, terminology, style, parity, structure, or general).
 */
function getRuleCategory(rule) {
  return RULE_CATEGORIES[rule] || 'general';
}

/**
 * Checks if a given key path is excluded by exact match or wildcard prefix.
 * @param {string} keyPath - The dot-separated key path being checked.
 * @param {Set<string>|Array<string>|null|undefined} ignoreKeys - Collection of ignored keys or wildcards.
 * @returns {boolean} True if the key path is ignored.
 */
function isKeyIgnored(keyPath, ignoreKeys) {
  if (!ignoreKeys) return false;
  const set = ignoreKeys instanceof Set ? ignoreKeys : new Set(Array.isArray(ignoreKeys) ? ignoreKeys : [ignoreKeys]);
  if (set.has(keyPath)) return true;
  for (const pattern of set) {
    if (pattern === keyPath) return true;
    if (pattern.endsWith('*') && keyPath.startsWith(pattern.slice(0, -1))) return true;
  }
  return false;
}

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
 * Detect unmatched, improperly nested, or misplaced curly braces in template placeholders.
 * Handles both single-brace ({name}) and double-brace ({{name}}) placeholder syntax.
 * @param {string} str
 * @returns {boolean}
 */
function hasMalformedBraces(str) {
  let i = 0;
  const n = str.length;
  while (i < n) {
    const ch = str[i];
    if (ch === '}') {
      return true; // Unmatched closing brace outside any placeholder
    }
    if (ch === '{') {
      if (i + 1 < n && str[i + 1] === '{') {
        // Double brace placeholder {{ ... }}
        i += 2;
        let closed = false;
        while (i < n) {
          if (str[i] === '{') {
            return true; // Nested opening brace
          }
          if (str[i] === '}' && i + 1 < n && str[i + 1] === '}') {
            i += 2;
            closed = true;
            break;
          }
          if (str[i] === '}') {
            return true; // Single closing brace inside double-brace placeholder
          }
          i++;
        }
        if (!closed) return true; // Unclosed double-brace placeholder
      } else {
        // Single brace placeholder { ... }
        i++;
        let closed = false;
        while (i < n) {
          if (str[i] === '{' || str[i] === '}') {
            if (str[i] === '}') {
              i++;
              closed = true;
              break;
            }
            return true; // Nested opening brace inside single-brace placeholder
          }
          i++;
        }
        if (!closed) return true; // Unclosed single-brace placeholder
      }
    } else {
      i++;
    }
  }
  return false;
}

/**
 * Non-pronoun words ending in "-mu" that should not be flagged as informal enclitic pronouns.
 */
const NON_PRONOUN_MU_EXCEPTIONS =
  /^(?:kamu|ilmu|berilmu|tamu|bertamu|temu|bertemu|ketemu|ditemu|menemu|jamu|ramu|meramu|diramu|semu|bersemu|jemu)$/i;

/**
 * Helper to preserve original casing (TitleCase, UPPERCASE, lowercase) on replacements.
 * @param {string} original
 * @param {string} replacement
 * @returns {string}
 */
function preserveCase(original, replacement) {
  if (!replacement || !original) return replacement;
  if (original === original.toUpperCase() && original !== original.toLowerCase()) {
    return replacement.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Check a string against an explicit pronoun policy ('Anda' or 'kamu').
 * Automatically excludes URLs and supported placeholders before evaluating pronoun occurrences.
 * @param {string} text
 * @param {string} pronoun
 * @returns {Array<{rule: string, category: string, message: string, startIndex?: number, endIndex?: number, original?: string, replacement?: string, confidence?: string}>}
 */
function checkPronounPolicy(text, pronoun) {
  if (!pronoun || (pronoun !== 'Anda' && pronoun !== 'kamu')) {
    return [];
  }

  const maskSpan = (match) => match.replace(/[^\n]/g, ' ');
  const textWithoutTokens = String(text || '')
    .replace(/https?:\/\/[^\s<>"'`()]+/g, maskSpan)
    .replace(/\{\{[0-9a-zA-Z_.-]+\}\}|\{[0-9a-zA-Z_.-]+\}|%(?:\d+\$)?[sdif]/g, maskSpan);

  const findings = [];
  if (pronoun === 'Anda') {
    const informalRx = /\b(?:kamu|kau)\b/gi;
    for (const m of textWithoutTokens.matchAll(informalRx)) {
      findings.push({
        rule: 'pronoun-mismatch',
        category: getRuleCategory('pronoun-mismatch'),
        message: `Informal pronoun found in "${text}"; formal "Anda" is enforced by project policy.`,
        startIndex: m.index,
        endIndex: m.index + m[0].length,
        original: m[0],
        replacement: 'Anda',
        confidence: 'contextual',
      });
    }
    const encliticRx = /\b[a-zA-Z\u00C0-\u024F]{2,}-?mu\b/gi;
    for (const m of textWithoutTokens.matchAll(encliticRx)) {
      if (!NON_PRONOUN_MU_EXCEPTIONS.test(m[0])) {
        findings.push({
          rule: 'pronoun-mismatch',
          category: getRuleCategory('pronoun-mismatch'),
          message: `Informal pronoun found in "${text}"; formal "Anda" is enforced by project policy.`,
          startIndex: m.index,
          endIndex: m.index + m[0].length,
          original: m[0],
          confidence: 'contextual',
        });
      }
    }
  } else if (pronoun === 'kamu') {
    const formalRx = /\bAnda\b/gi;
    for (const m of textWithoutTokens.matchAll(formalRx)) {
      findings.push({
        rule: 'pronoun-mismatch',
        category: getRuleCategory('pronoun-mismatch'),
        message: `Formal pronoun "Anda" found in "${text}"; informal "kamu" is enforced by project policy.`,
        startIndex: m.index,
        endIndex: m.index + m[0].length,
        original: m[0],
        replacement: 'kamu',
        confidence: 'contextual',
      });
    }
  }

  return findings;
}

/**
 * Strip Markdown 4-space or tab-indented code blocks while preserving indented list continuations
 * and nested list items (e.g., `- Petunjuk\n\n    - Silahkan...`).
 * Uses length-preserving whitespace masking so line lengths and character coordinates remain 1:1.
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
      out.push(line);
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
      out.push(line.replace(/[^\n]/g, ' '));
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
 * Audit a prose string for Indonesian AI slop, SMS slang, non-standard spelling, and pronoun policy.
 * Automatically masks protected Markdown fenced code blocks (backticks and tildes),
 * 4-space/tab-indented code blocks, inline code spans, and URLs with length-preserving whitespace.
 * @param {string} text
 * @param {{ stripIndentedCode?: boolean, pronoun?: string }} [options] Set `stripIndentedCode: false` for plain-text input (e.g., dictionary values) where indentation does not mark code.
 * @returns {Array<{rule: string, category: string, message: string, startIndex?: number, endIndex?: number, original?: string, replacement?: string, confidence?: string}>}
 */
function auditText(text, options = {}) {
  const stripIndentedCode = options.stripIndentedCode ?? true;
  const pronoun = options.pronoun ?? null;
  const issues = [];
  const maskSpan = (match) => match.replace(/[^\n]/g, ' ');

  const withoutFences = String(text || '')
    .replace(/```[\s\S]*?```/g, maskSpan)
    .replace(/~~~[\s\S]*?~~~/g, maskSpan);
  const withoutIndented = stripIndentedCode ? stripIndentedCodeBlocks(withoutFences) : withoutFences;
  const str = withoutIndented
    .replace(/`[^`\n]+`/g, maskSpan)
    .replace(/https?:\/\/[^\s<>"'`()]+/g, maskSpan);

  const smsRx = new RegExp(SMS_SLANG_REGEX.source, (SMS_SLANG_REGEX.flags || 'i').replace(/g/g, '') + 'g');
  for (const m of str.matchAll(smsRx)) {
    const original = m[0];
    const startIndex = m.index;
    const endIndex = startIndex + original.length;
    issues.push({
      rule: 'sms-abbreviation',
      category: getRuleCategory('sms-abbreviation'),
      message: `Banned chat/SMS abbreviation "${original}" found; use full word or lexical compaction.`,
      startIndex,
      endIndex,
      original,
      confidence: 'contextual',
    });
  }

  for (const item of NON_STANDARD_WORDS) {
    const rx = new RegExp(item.regex.source, (item.regex.flags || 'i').replace(/g/g, '') + 'g');
    for (const m of str.matchAll(rx)) {
      const original = m[0];
      const startIndex = m.index;
      const endIndex = startIndex + original.length;

      let replacement = undefined;
      let confidence = 'high';

      if (!item.fix.includes('/') && !item.fix.includes('(')) {
        replacement = preserveCase(original, item.fix);
      } else if (item.regex.source.includes('(disini|disana|disitu)')) {
        const lower = original.toLowerCase();
        const rep = lower === 'disini' ? 'di sini' : lower === 'disana' ? 'di sana' : 'di situ';
        replacement = preserveCase(original, rep);
      } else if (item.regex.source.includes('(diatas|dibawah|didalam|diluar)')) {
        const lower = original.toLowerCase();
        const rep = lower === 'diatas' ? 'di atas' : lower === 'dibawah' ? 'di bawah' : lower === 'didalam' ? 'di dalam' : 'di luar';
        replacement = preserveCase(original, rep);
      } else if (item.regex.source.includes('(kesana|kesini)')) {
        const lower = original.toLowerCase();
        const rep = lower === 'kesana' ? 'ke sana' : 'ke sini';
        replacement = preserveCase(original, rep);
      } else if (item.regex.source.includes('himbau(an)?')) {
        const lower = original.toLowerCase();
        const rep = lower.endsWith('an') ? 'imbauan' : 'imbau';
        replacement = preserveCase(original, rep);
      } else {
        confidence = 'contextual';
      }

      issues.push({
        rule: 'kata-tidak-baku',
        category: getRuleCategory('kata-tidak-baku'),
        message: `Non-standard word "${original}" found; use KBBI standard "${item.fix}".`,
        startIndex,
        endIndex,
        original,
        replacement,
        confidence,
      });
    }
  }

  for (const pat of SLOP_AND_PLEONASM_PATTERNS) {
    const rx = new RegExp(pat.regex.source, (pat.regex.flags || 'i').replace(/g/g, '') + 'g');
    for (const m of str.matchAll(rx)) {
      const original = m[0];
      const startIndex = m.index;
      const endIndex = startIndex + original.length;
      let replacement = undefined;
      let confidence = 'contextual';

      if (pat.reason.includes('dalam rangka untuk')) {
        replacement = preserveCase(original, 'untuk');
        confidence = 'high';
      } else if (pat.reason.includes('para hadirin')) {
        replacement = preserveCase(original, 'hadirin');
        confidence = 'high';
      }

      issues.push({
        rule: 'slop-or-pleonasm',
        category: getRuleCategory('slop-or-pleonasm'),
        message: pat.reason,
        startIndex,
        endIndex,
        original,
        replacement,
        confidence,
      });
    }
  }

  if (pronoun) {
    for (const pIssue of checkPronounPolicy(str, pronoun)) {
      issues.push({
        rule: pIssue.rule,
        category: getRuleCategory(pIssue.rule),
        message: pIssue.message,
        startIndex: pIssue.startIndex,
        endIndex: pIssue.endIndex,
        original: pIssue.original,
        replacement: pIssue.replacement,
        confidence: pIssue.confidence,
      });
    }
  }

  issues.sort((a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0));
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
      category: getRuleCategory('nesting-limit-exceeded'),
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
        category: getRuleCategory('traversal-limit-exceeded'),
        message: `Total dictionary traversal work exceeded safety limit of ${MAX_DICTIONARY_ENTRIES} entries.`,
      });
      break;
    }

    if (findings.length >= MAX_DICTIONARY_FINDINGS) {
      findings.push({
        key: currentPrefix || 'root',
        rule: 'findings-limit-exceeded',
        category: getRuleCategory('findings-limit-exceeded'),
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

    if (isKeyIgnored(fullKey, options.ignoreKeys)) {
      continue;
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
        ignoreKeys: options.ignoreKeys,
      });
      continue;
    }
    if (typeof value !== 'string') continue;

    const sourceValue = (source && typeof source === 'object') ? source[key] : undefined;

    // 1. Silent English identity fallback check
    const trimmedVal = value.trim();
    const isUntranslated = typeof sourceValue === 'string' ? (trimmedVal === sourceValue.trim()) : (key === value);
    const textOutsidePlaceholders = value.replace(/\{\{[0-9a-zA-Z_.-]+\}\}|\{[0-9a-zA-Z_.-]+\}|%(?:\d+\$)?[sdif]/g, '');
    if (
      isUntranslated &&
      value.length >= minFallbackLength &&
      !allowlistKeys.has(key) &&
      !allowlistKeys.has(fullKey) &&
      !RETAINED_LOANWORD_PATTERNS.some((rx) => rx.test(trimmedVal) || rx.test(value)) &&
      /[a-zA-Z]{3,}/.test(textOutsidePlaceholders) &&
      !/^https?:\/\//i.test(trimmedVal)
    ) {
      findings.push({
        key: fullKey,
        rule: 'silent-fallback',
        category: getRuleCategory('silent-fallback'),
        message: `Untranslated identity fallback (${typeof sourceValue === 'string' ? 'source === value' : 'key === value'}, ${value.length} chars).`,
      });
    }

    // 2. Placeholder parity and well-formedness check
    const valPh = extractPlaceholders(value);

    // 2a. Malformed placeholder check (unmatched or improperly ordered curly braces)
    if (hasMalformedBraces(value)) {
      findings.push({
        key: fullKey,
        rule: 'malformed-placeholder',
        category: getRuleCategory('malformed-placeholder'),
        message: `Unmatched or improperly ordered curly braces in placeholder for "${value}".`,
      });
    }

    // 2b. Placeholder parity check
    if (typeof sourceValue === 'string') {
      const srcPh = extractPlaceholders(sourceValue);
      if (srcPh.join(',') !== valPh.join(',')) {
        findings.push({
          key: fullKey,
          rule: 'placeholder-mismatch',
          category: getRuleCategory('placeholder-mismatch'),
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
          category: getRuleCategory('placeholder-mismatch'),
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
            category: getRuleCategory('inverted-quantitative-placeholder'),
            message: `Quantitative placeholder inverted: "${sourceTemplate}" (${ph} count) translated with placeholder placed after noun ("${value}"); in Indonesian, quantity must precede the noun (${ph} ${invertedMatch[1]}).`,
          });
        }
      }
    }

    // 3. Known UI/domain polysemy & calque traps
    const trimmedValue = value.trim();
    for (const trap of KNOWN_CALQUE_TRAPS) {
      const isKeyMatch =
        trap.keyMatch.test(key, sourceValue) ||
        (typeof sourceValue === 'string' && trap.keyMatch.test(sourceValue));
      if (isKeyMatch && (trap.badVal.test(trimmedValue) || trap.badVal.test(value))) {
        findings.push({
          key: fullKey,
          rule: 'polysemy-calque',
          category: getRuleCategory('polysemy-calque'),
          message: `Literal calque trap in "${value}"; use "${trap.fix}".`,
        });
      }
    }

    // 4. Pronoun policy check (when explicit project override is specified)
    if (pronoun) {
      for (const pIssue of checkPronounPolicy(value, pronoun)) {
        findings.push({
          key: fullKey,
          rule: pIssue.rule,
          category: getRuleCategory(pIssue.rule),
          message: pIssue.message,
        });
      }
    }

    // 5. Text-level checks (SMS slang, kata tidak baku, slop)
    for (const issue of auditText(value, { stripIndentedCode: false })) {
      findings.push({
        key: fullKey,
        rule: issue.rule,
        category: issue.category || getRuleCategory(issue.rule),
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
 * Detect indentation style from JSON string (2 spaces, 4 spaces, or tabs).
 * @param {string} str
 * @returns {string | number}
 */
export function detectJsonIndent(str) {
  const match = str.match(/^[\t ]*(?="[^"]+"\s*:)/m);
  if (!match) return 2;
  const indent = match[0];
  if (indent.includes('\t')) return '\t';
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
 * Checks if the text appears to be formatted as key-value pairs (JSON / JS object snippet).
 * @param {string} str
 * @returns {boolean}
 */
export function isKeyValueSnippet(str) {
  const trimmed = String(str || '').trim();
  return /^(?:"(?:[^"\\]|\\.)*"|[a-zA-Z_$][0-9a-zA-Z_$]*)s*:/m.test(trimmed);
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
    const withoutTrailing = trimmed.replace(/,(s*)$/, '$1');
    const wrapped = '{\n' + withoutTrailing + '\n}';
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

  const stats = {
    totalFindings: findings.length,
    highConfidence: 0,
    byCategory: {},
  };
  for (const f of findings) {
    const cat = f.category || 'general';
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
  }

  let cleanText = raw;
  try {
    const fixedObj = fixJsonValues(parsed, options.pronoun || null);
    const fullJson = JSON.stringify(fixedObj, null, indent);
    if (isSnippet) {
      const lines = fullJson.split('\n');
      if (lines.length >= 2 && lines[0].trim() === '{' && lines[lines.length - 1].trim() === '}') {
        const innerLines = lines.slice(1, -1);
        const indentStr = typeof indent === 'number' ? ' '.repeat(indent) : '\t';
        cleanText = innerLines
          .map((l) => (l.startsWith(indentStr) ? l.slice(indentStr.length) : l))
          .join('\n');
      } else {
        cleanText = fullJson;
      }
    } else {
      cleanText = fullJson;
    }
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

  if (trimmed.startsWith('{') || trimmed.startsWith('[') || isKeyValueSnippet(trimmed)) {
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
