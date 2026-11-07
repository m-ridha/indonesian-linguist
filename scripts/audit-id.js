#!/usr/bin/env node
/**
 * Indonesian Linguist — Deterministic i18n & Prose Auditor
 * Zero-dependency CLI and library for auditing Indonesian localization files (.json, .js)
 * and prose (.md, .txt) against EYD V, UI polysemy traps, SMS slang, and AI slop.
 */

const fs = require('fs');
const path = require('path');

/* ENGINE_EXPORT_START */
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
  { regex: /\b(daluwarsa|kadaluarsa|kadaluwarsa|kedaluarsa)\b/i, fix: 'kedaluwarsa' },
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

/**
 * @typedef {{ test(key: string, sourceVal?: unknown): boolean }} KeyMatchPredicate
 * @typedef {{ keyMatch: RegExp | KeyMatchPredicate, badVal: RegExp, fix: string }} CalqueTrap
 */
/** @type {CalqueTrap[]} */
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
      /** @param {string} key */
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
      /** @param {string} key @param {unknown} [sourceVal] */
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
      /** @param {string} key @param {unknown} [sourceVal] */
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
  {
    keyMatch: /\b(?:weight\s+plates?|plate[- ]loaded|plate\s+racks?|(?:add|load|put|remove|rack|stack)\s+plates?)\b|^plates?$/i,
    badVal: /\bpiringan(?:\s+beban)?\b/i,
    fix: 'Plat / Plat beban',
  },
  {
    keyMatch: /\bplates?\s+loading\b/i,
    badVal: /\b(?:pemuatan\s+(?:pelat|plat|piringan)|piringan(?:\s+beban)?)\b/i,
    fix: 'Beban plat',
  },
  {
    keyMatch: /\bwork(?:ing)?\s+weights?\b/i,
    badVal: /\b(?:beban|berat)\s+kerja\b/i,
    fix: 'Beban set utama / Beban utama',
  },
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

/** @type {Record<string, string>} */
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
 * @param {Set<string>|Array<string>|string|null|undefined} ignoreKeys - Collection of ignored keys or wildcards.
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
 * Masks URLs in text with length-preserving whitespace.
 * Handles nested parentheses in URLs and stops at Markdown closing parens or trailing punctuation.
 * @param {string} text
 * @returns {string}
 */
function maskUrls(text) {
  if (!text) return '';
  const chars = String(text).split('');
  const urlSchemeRx = /https?:\/\//gi;
  let m;

  while ((m = urlSchemeRx.exec(text)) !== null) {
    const startIndex = m.index;
    let prev = startIndex - 1;
    while (prev >= 0 && (text[prev] === ' ' || text[prev] === '\t')) prev--;
    const isExplicitDest =
      (prev >= 1 && text[prev - 1] === ']' && text[prev] === '(') ||
      (prev >= 1 && text[prev - 1] === ']' && text[prev] === ':') ||
      (prev >= 0 && text[prev] === '<');

    let i = startIndex;
    const n = text.length;
    let parenDepth = 0;

    while (i < n) {
      const ch = text[i];
      if (
        /\s/.test(ch) ||
        ch === '<' ||
        ch === '>' ||
        ch === '"' ||
        ch === "'" ||
        ch === '`' ||
        (!isExplicitDest && ch === '\u2014')
      ) {
        break;
      }
      if (ch === '(') {
        parenDepth++;
        i++;
      } else if (ch === ')') {
        if (parenDepth > 0) {
          parenDepth--;
          i++;
        } else {
          break;
        }
      } else {
        i++;
      }
    }

    while (i > startIndex) {
      const lastChar = text[i - 1];
      if (lastChar === '.' || lastChar === ',' || lastChar === ';' || lastChar === ':' || lastChar === '!' || lastChar === '?') {
        i--;
      } else {
        break;
      }
    }

    for (let j = startIndex; j < i; j++) {
      if (chars[j] !== '\n') chars[j] = ' ';
    }
    urlSchemeRx.lastIndex = Math.max(i, startIndex + 1);
  }

  return chars.join('');
}

/**
 * Check a string against an explicit pronoun policy ('Anda' or 'kamu').
 * Automatically excludes URLs and supported placeholders before evaluating pronoun occurrences.
 * @param {string} text
 * @param {string} pronoun
 * @param {number} [maxFindings]
 * @returns {Array<{rule: string, category: string, message: string, startIndex?: number, endIndex?: number, original?: string, replacement?: string, confidence?: string}>}
 */
function checkPronounPolicy(text, pronoun, maxFindings = Infinity) {
  if (!pronoun || (pronoun !== 'Anda' && pronoun !== 'kamu') || maxFindings <= 0) {
    return [];
  }

  /** @type {(match: string) => string} */
  const maskSpan = (match) => match.replace(/[^\n]/g, ' ');
  const textWithoutTokens = maskUrls(String(text || ''))
    .replace(/\{\{[0-9a-zA-Z_.-]+\}\}|\{[0-9a-zA-Z_.-]+\}|%(?:\d+\$)?[sdif]/g, maskSpan);

  const findings = [];
  if (pronoun === 'Anda') {
    const informalRx = /\b(?:kamu|kau)\b/gi;
    for (const m of textWithoutTokens.matchAll(informalRx)) {
      if (findings.length >= maxFindings) break;
      findings.push({
        rule: 'pronoun-mismatch',
        category: getRuleCategory('pronoun-mismatch'),
        message: `Informal pronoun "${m[0]}" found; formal "Anda" is enforced by project policy.`,
        startIndex: m.index,
        endIndex: m.index + m[0].length,
        original: m[0],
        replacement: 'Anda',
        confidence: 'contextual',
      });
    }
    const encliticRx = /\b[a-zA-Z\u00C0-\u024F]{2,}-?mu\b/gi;
    for (const m of textWithoutTokens.matchAll(encliticRx)) {
      if (findings.length >= maxFindings) break;
      if (!NON_PRONOUN_MU_EXCEPTIONS.test(m[0])) {
        findings.push({
          rule: 'pronoun-mismatch',
          category: getRuleCategory('pronoun-mismatch'),
          message: `Informal pronoun "${m[0]}" found; formal "Anda" is enforced by project policy.`,
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
      if (findings.length >= maxFindings) break;
      findings.push({
        rule: 'pronoun-mismatch',
        category: getRuleCategory('pronoun-mismatch'),
        message: `Formal pronoun "${m[0]}" found; informal "kamu" is enforced by project policy.`,
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
  /** @type {(prefix: string) => number} */
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

    const indent = columns(line.match(/^[ \t]*/)?.[0] ?? '');
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
 * @param {{ stripIndentedCode?: boolean, pronoun?: string|null, maxFindings?: number }} [options] Set `stripIndentedCode: false` for plain-text input (e.g., dictionary values) where indentation does not mark code.
 * @returns {Array<{rule: string, category: string, message: string, startIndex?: number, endIndex?: number, original?: string, replacement?: string, confidence?: string}>}
 */
function auditText(text, options = {}) {
  const stripIndentedCode = options.stripIndentedCode ?? true;
  const pronoun = options.pronoun ?? null;
  const maxFindings = options.maxFindings ?? Infinity;
  if (maxFindings <= 0) return [];
  const issues = [];
  /** @type {(match: string) => string} */
  const maskSpan = (match) => match.replace(/[^\n]/g, ' ');

  const withoutFences = String(text || '')
    .replace(/```[\s\S]*?```/g, maskSpan)
    .replace(/~~~[\s\S]*?~~~/g, maskSpan);
  const withoutIndented = stripIndentedCode ? stripIndentedCodeBlocks(withoutFences) : withoutFences;
  const str = maskUrls(withoutIndented.replace(/`[^`\n]+`/g, maskSpan))
    .replace(/\{\{[0-9a-zA-Z_.-]+\}\}|\{[0-9a-zA-Z_.-]+\}|%(?:\d+\$)?[sdif]/g, maskSpan);

  const smsRx = new RegExp(SMS_SLANG_REGEX.source, (SMS_SLANG_REGEX.flags || 'i').replace(/g/g, '') + 'g');
  for (const m of str.matchAll(smsRx)) {
    if (issues.length >= maxFindings) break;
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
    if (issues.length >= maxFindings) break;
    const rx = new RegExp(item.regex.source, (item.regex.flags || 'i').replace(/g/g, '') + 'g');
    for (const m of str.matchAll(rx)) {
      if (issues.length >= maxFindings) break;
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
    if (issues.length >= maxFindings) break;
    const rx = new RegExp(pat.regex.source, (pat.regex.flags || 'i').replace(/g/g, '') + 'g');
    for (const m of str.matchAll(rx)) {
      if (issues.length >= maxFindings) break;
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

  if (pronoun && issues.length < maxFindings) {
    for (const pIssue of checkPronounPolicy(str, pronoun, maxFindings - issues.length)) {
      if (issues.length >= maxFindings) break;
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
 * @param {{ minFallbackLength?: number, allowlistKeys?: Set<string>, prefix?: string, depth?: number, accumulator?: Array<{key: string, rule: string, category?: string, message: string}>, visited?: Map<object, number>, activeStack?: Set<object>, counter?: { entries: number }, source?: unknown, pronoun?: string|null, ignoreKeys?: Set<string>|Array<string>|string|null }} [options]
 * @returns {Array<{key: string, rule: string, category?: string, message: string}>}
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

  /** @param {{key: string, rule: string, category: string, message: string}|null} finding */
  const pushFinding = (finding) => {
    if (findings.length >= MAX_DICTIONARY_FINDINGS) {
      if (findings[findings.length - 1]?.rule !== 'findings-limit-exceeded') {
        findings.push({
          key: currentPrefix || 'root',
          rule: 'findings-limit-exceeded',
          category: getRuleCategory('findings-limit-exceeded'),
          message: `Total dictionary findings exceeded safety limit of ${MAX_DICTIONARY_FINDINGS}.`,
        });
      }
      return false;
    }
    if (finding) findings.push(finding);
    return true;
  };

  if (currentDepth > MAX_DICTIONARY_DEPTH) {
    pushFinding({
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
      pushFinding(null);
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
      auditDictionary(/** @type {Record<string, unknown>} */(value), {
        ...options,
        prefix: fullKey,
        depth: currentDepth + 1,
        source: (source && typeof source === 'object') ? (/** @type {Record<string, unknown>} */ (source))[key] : null,
        accumulator: findings,
        visited,
        activeStack,
        counter,
        ignoreKeys: options.ignoreKeys,
      });
      if (
        findings[findings.length - 1]?.rule === 'findings-limit-exceeded' ||
        findings[findings.length - 1]?.rule === 'traversal-limit-exceeded'
      ) {
        break;
      }
      continue;
    }
    if (typeof value !== 'string') continue;

    const sourceValue =
      source && typeof source === 'object'
        ? /** @type {Record<string, unknown>} */ (source)[key]
        : undefined;

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
      if (!pushFinding({
        key: fullKey,
        rule: 'silent-fallback',
        category: getRuleCategory('silent-fallback'),
        message: `Untranslated identity fallback (${typeof sourceValue === 'string' ? 'source === value' : 'key === value'}, ${value.length} chars).`,
      })) break;
    }

    // 2. Placeholder parity and well-formedness check
    const valPh = extractPlaceholders(value);

    // 2a. Malformed placeholder check (unmatched or improperly ordered curly braces)
    if (hasMalformedBraces(value)) {
      if (!pushFinding({
        key: fullKey,
        rule: 'malformed-placeholder',
        category: getRuleCategory('malformed-placeholder'),
        message: `Unmatched or improperly ordered curly braces in placeholder for "${value}".`,
      })) break;
    }

    // 2b. Placeholder parity check
    if (typeof sourceValue === 'string') {
      const srcPh = extractPlaceholders(sourceValue);
      if (srcPh.join(',') !== valPh.join(',')) {
        if (!pushFinding({
          key: fullKey,
          rule: 'placeholder-mismatch',
          category: getRuleCategory('placeholder-mismatch'),
          message: `Placeholders in source [${srcPh.join(', ')}] do not match value [${valPh.join(', ')}].`,
        })) break;
      }
    } else {
      // Standalone mode: only check key placeholders if key itself contains placeholders (flat gettext pattern)
      const keyPh = extractPlaceholders(key);
      if (keyPh.length > 0 && keyPh.join(',') !== valPh.join(',')) {
        if (!pushFinding({
          key: fullKey,
          rule: 'placeholder-mismatch',
          category: getRuleCategory('placeholder-mismatch'),
          message: `Placeholders in key [${keyPh.join(', ')}] do not match value [${valPh.join(', ')}].`,
        })) break;
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

        /** @type {Record<string, RegExp>} */
        const eponymousNounPairs = {
          formula: /^rumus$/i,
          law: /^hukum$/i,
          theorem: /^teorema$/i,
          equation: /^persamaan$/i,
          principle: /^prinsip$/i,
        };
        const enNoun = quantMatch[2].toLowerCase();
        // Eponymous concepts strictly name a single formula/law (e.g. "{0} formula" -> "Rumus {0}"
        // or "{0} formula: calculated..." -> "Rumus {0}: dihitung..."),
        // rather than counting items (e.g. "{0} law available" or "{0} laws found").
        const isEponymousPhrase =
          /^(?:\{\{[0-9a-zA-Z_.-]+\}\}|\{[0-9a-zA-Z_.-]+\}|%(?:\d+\$)?[sdif])\s+(?:formula|law|theorem|equation|principle)(?!\s*\(\s*e?s\s*\))(?:$|\s*[:;,.\(\[\-\u2013\u2014\/])/i.test(sourceTemplate.trim()) &&
          Boolean(eponymousNounPairs[enNoun] && eponymousNounPairs[enNoun].test(invertedMatch[1]));

        if (!isPermittedQuantifier && !isLeadingVerbWithObject && !isEponymousPhrase) {
          if (!pushFinding({
            key: fullKey,
            rule: 'inverted-quantitative-placeholder',
            category: getRuleCategory('inverted-quantitative-placeholder'),
            message: `Quantitative placeholder inverted: "${sourceTemplate}" (${ph} count) translated with placeholder placed after noun ("${value}"); in Indonesian, quantity must precede the noun (${ph} ${invertedMatch[1]}).`,
          })) break;
        }
      }
    }

    // 3. Known UI/domain polysemy & calque traps
    let limitHit = false;
    const trimmedValue = value.trim();
    for (const trap of KNOWN_CALQUE_TRAPS) {
      /** @type {(candidate: string) => boolean} */
      const matchesKey = (candidate) =>
        trap.keyMatch instanceof RegExp
          ? trap.keyMatch.test(candidate)
          : trap.keyMatch.test(candidate, sourceValue);
      const isKeyMatch = matchesKey(key) || (typeof sourceValue === 'string' && matchesKey(sourceValue));
      if (isKeyMatch && (trap.badVal.test(trimmedValue) || trap.badVal.test(value))) {
        if (!pushFinding({
          key: fullKey,
          rule: 'polysemy-calque',
          category: getRuleCategory('polysemy-calque'),
          message: `Literal calque trap in "${value}"; use "${trap.fix}".`,
        })) {
          limitHit = true;
          break;
        }
      }
    }
    if (limitHit) break;

    // 4. Pronoun policy check (when explicit project override is specified)
    if (pronoun) {
      const pronounBudget = Math.max(0, MAX_DICTIONARY_FINDINGS - findings.length) + 1;
      for (const pIssue of checkPronounPolicy(value, pronoun, pronounBudget)) {
        if (!pushFinding({
          key: fullKey,
          rule: pIssue.rule,
          category: getRuleCategory(pIssue.rule),
          message: pIssue.message,
        })) {
          limitHit = true;
          break;
        }
      }
      if (limitHit) break;
    }

    // 5. Text-level checks (SMS slang, kata tidak baku, slop)
    const textBudget = Math.max(0, MAX_DICTIONARY_FINDINGS - findings.length) + 1;
    for (const issue of auditText(value, { stripIndentedCode: false, maxFindings: textBudget })) {
      if (!pushFinding({
        key: fullKey,
        rule: issue.rule,
        category: issue.category || getRuleCategory(issue.rule),
        message: issue.message,
      })) {
        limitHit = true;
        break;
      }
    }
    if (limitHit) break;
  }

  if (isObject) {
    activeStack.delete(dict);
  }

  return findings;
}
/* ENGINE_EXPORT_END */

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

/**
 * Maximum allowed source length for Android XML and iOS strings files (2 MB).
 */
const MAX_NATIVE_LOCALE_LENGTH = 2_000_000;

/**
 * Unescapes standard Android XML entities, CDATA sections, and backslash-escapes.
 * Decodes named and numeric character entities in a single pass to prevent double-decoding.
 * @param {string} str
 * @returns {string}
 */
function unescapeAndroidXml(str) {
  if (!str) return '';
  let res = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  res = res.replace(/\\(['"])/g, '$1');
  const named = { quot: '"', apos: "'", lt: '<', gt: '>', amp: '&' };
  res = res.replace(/&(?:(quot|apos|lt|gt|amp)|#(\d+)|#x([0-9a-fA-F]+));/gi, (_, name, dec, hex) => {
    if (name) return named[name.toLowerCase()];
    const code = dec !== undefined ? parseInt(dec, 10) : parseInt(hex, 16);
    return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  });
  return res.trim();
}

/**
 * Parse an Android `strings.xml` resource file into a dictionary object.
 * Extracts:
 * - `<string name="key">value</string>` -> `"key": "value"`
 * - `<string-array name="key"><item>value</item>...</string-array>` -> `"key": ["value", ...]`
 * - `<plurals name="key"><item quantity="qty">value</item>...</plurals>` -> `"key": { "qty": "value", ... }`
 * Handles CDATA, XML entity decoding, and XML comment stripping.
 * Verifies single root <resources> containment and rejects malformed/unclosed tags.
 * @param {string} content
 * @returns {Record<string, unknown>}
 */
/**
 * Strips XML comments (<!-- ... -->) while preserving comment delimiters inside <![CDATA[...]]> blocks.
 * Throws if an unclosed XML comment is encountered outside CDATA.
 * @param {string} src
 * @returns {string}
 */
function stripXmlCommentsPreservingCdata(src) {
  let current = src;
  while (true) {
    let result = '';
    let i = 0;
    const len = current.length;
    let foundComment = false;
    while (i < len) {
      if (current.startsWith('<![CDATA[', i)) {
        const end = current.indexOf(']]>', i + 9);
        if (end === -1) {
          result += current.slice(i);
          break;
        }
        result += current.slice(i, end + 3);
        i = end + 3;
      } else if (current.startsWith('<!--', i)) {
        const end = current.indexOf('-->', i + 4);
        if (end === -1) {
          throw new Error('Malformed Android XML: unclosed XML comment <!--');
        }
        foundComment = true;
        i = end + 3;
      } else {
        result += current[i];
        i++;
      }
    }
    if (!foundComment) {
      return result;
    }
    current = result;
  }
}

/**
 * Parse an Android `strings.xml` resource file into a dictionary object.
 * Extracts:
 * - `<string name="key">value</string>` -> `"key": "value"`
 * - `<string-array name="key"><item>value</item>...</string-array>` -> `"key": ["value", ...]`
 * - `<plurals name="key"><item quantity="qty">value</item>...</plurals>` -> `"key": { "qty": "value", ... }`
 * Handles CDATA, XML entity decoding, and XML comment stripping.
 * Verifies single root <resources> containment, validates child tag structure, and rejects malformed/unclosed tags.
 * Normalizes self-closing string, string-array, plurals, and item elements into empty open/close pairs.
 * @param {string} content
 * @returns {Record<string, unknown>}
 */
function parseAndroidXmlLocale(content) {
  const src = String(content || '');
  if (src.length > MAX_NATIVE_LOCALE_LENGTH) {
    throw new Error(`Android XML source exceeds maximum length of ${MAX_NATIVE_LOCALE_LENGTH} characters.`);
  }

  const clean = stripXmlCommentsPreservingCdata(src);

  const withoutProlog = clean.replace(/^\s*<\?xml[^>]*\?>/i, '').trim();
  const rootMatch = /^\s*<resources\b[^>]*>([\s\S]*?)<\/resources\s*>\s*$/i.exec(withoutProlog);
  if (!rootMatch) {
    throw new Error('Invalid Android strings.xml: document must contain a single root <resources> element enclosing all entries.');
  }

  const innerContent = rootMatch[1];
  if (/<resources\b/i.test(innerContent) || /<\/resources\s*>/i.test(innerContent)) {
    throw new Error('Invalid Android strings.xml: nested or multiple <resources> elements are not allowed.');
  }

  // Normalize self-closing entries into empty open/close pairs before balance checks and extraction
  const normalizedInner = innerContent.replace(
    /<(string-array|string|plurals|item)(\s+[^>]*?|\s*)\/>/gi,
    '<$1$2></$1>'
  );

  const openStringCount = (normalizedInner.match(/<string\s/gi) || []).length;
  const closeStringCount = (normalizedInner.match(/<\/string\s*>/gi) || []).length;
  if (openStringCount !== closeStringCount) {
    throw new Error(`Invalid Android strings.xml: mismatched <string> tags (${openStringCount} open, ${closeStringCount} close).`);
  }

  const openArrayCount = (normalizedInner.match(/<string-array\s/gi) || []).length;
  const closeArrayCount = (normalizedInner.match(/<\/string-array\s*>/gi) || []).length;
  if (openArrayCount !== closeArrayCount) {
    throw new Error(`Invalid Android strings.xml: mismatched <string-array> tags (${openArrayCount} open, ${closeArrayCount} close).`);
  }

  const openPluralsCount = (normalizedInner.match(/<plurals\s/gi) || []).length;
  const closePluralsCount = (normalizedInner.match(/<\/plurals\s*>/gi) || []).length;
  if (openPluralsCount !== closePluralsCount) {
    throw new Error(`Invalid Android strings.xml: mismatched <plurals> tags (${openPluralsCount} open, ${closePluralsCount} close).`);
  }

  const dict = {};

  // 1. Single strings: <string name="key" ...>value</string>
  const stringRegex = /<string\s+[^>]*name\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/string>/gi;
  let match;
  while ((match = stringRegex.exec(normalizedInner)) !== null) {
    dict[match[1]] = unescapeAndroidXml(match[2]);
  }

  // 2. String arrays: <string-array name="key" ...><item>...</item></string-array>
  const arrayRegex = /<string-array\s+[^>]*name\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/string-array>/gi;
  while ((match = arrayRegex.exec(normalizedInner)) !== null) {
    const key = match[1];
    const inner = match[2];
    const openItemCount = (inner.match(/<item(\s|>)/gi) || []).length;
    const closeItemCount = (inner.match(/<\/item\s*>/gi) || []).length;
    if (openItemCount !== closeItemCount) {
      throw new Error(`Invalid Android strings.xml: mismatched <item> tags in <string-array name="${key}"> (${openItemCount} open, ${closeItemCount} close).`);
    }
    const items = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(inner)) !== null) {
      items.push(unescapeAndroidXml(itemMatch[1]));
    }
    const unconsumed = inner.replace(/<item[^>]*>[\s\S]*?<\/item>/gi, '').trim();
    if (unconsumed) {
      throw new Error(`Invalid Android strings.xml: malformed or unconsumed content in <string-array name="${key}">.`);
    }
    dict[key] = items;
  }

  // 3. Plurals: <plurals name="key" ...><item quantity="one">...</item></plurals>
  const pluralsRegex = /<plurals\s+[^>]*name\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/plurals>/gi;
  while ((match = pluralsRegex.exec(normalizedInner)) !== null) {
    const key = match[1];
    const inner = match[2];
    const openItemCount = (inner.match(/<item(\s|>)/gi) || []).length;
    const closeItemCount = (inner.match(/<\/item\s*>/gi) || []).length;
    if (openItemCount !== closeItemCount) {
      throw new Error(`Invalid Android strings.xml: mismatched <item> tags in <plurals name="${key}"> (${openItemCount} open, ${closeItemCount} close).`);
    }
    const pluralsObj = {};
    const itemRegex = /<item\s+[^>]*quantity\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/item>/gi;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(inner)) !== null) {
      pluralsObj[itemMatch[1]] = unescapeAndroidXml(itemMatch[2]);
    }
    const unconsumed = inner.replace(/<item\s+[^>]*quantity\s*=\s*["'][^"']+["'][^>]*>[\s\S]*?<\/item>/gi, '').trim();
    if (unconsumed) {
      throw new Error(`Invalid Android strings.xml: malformed or unconsumed content in <plurals name="${key}">.`);
    }
    dict[key] = pluralsObj;
  }

  return dict;
}

/**
 * Unescapes standard Apple .strings escape sequences in a single pass.
 * Supports standard escapes (\", \\, \n, \r, \t) and Unicode escapes (\Uxxxx, \uxxxx).
 * @param {string} str
 * @returns {string}
 */
function unescapeIosString(str) {
  if (!str) return '';
  return str.replace(/\\(?:(["\\nrt])|[uU]([0-9a-fA-F]{4}))/g, (_, ch, hex) => {
    if (hex) {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) && code >= 0 && code <= 0xffff ? String.fromCharCode(code) : '';
    }
    switch (ch) {
      case '"': return '"';
      case '\\': return '\\';
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      default: return ch;
    }
  });
}

/**
 * Parse an Apple iOS/macOS `.strings` localization file into a dictionary object.
 * Strips C-style multiline comments and line comments, and extracts `"key" = "value";` pairs.
 * Rejects unparsed non-comment, non-whitespace content and malformed entries.
 * @param {string} content
 * @returns {Record<string, string>}
 */
function parseIosStringsLocale(content) {
  const src = String(content || '');
  if (src.length > MAX_NATIVE_LOCALE_LENGTH) {
    throw new Error(`iOS strings source exceeds maximum length of ${MAX_NATIVE_LOCALE_LENGTH} characters.`);
  }

  const dict = {};
  let i = 0;
  const len = src.length;

  while (i < len) {
    // 1. Skip whitespace
    while (i < len && /\s/.test(src[i])) {
      i++;
    }
    if (i >= len) break;

    // 2. Comments
    if (src[i] === '/' && src[i + 1] === '/') {
      i += 2;
      while (i < len && src[i] !== '\n' && src[i] !== '\r') {
        i++;
      }
      continue;
    }
    if (src[i] === '/' && src[i + 1] === '*') {
      const closeIdx = src.indexOf('*/', i + 2);
      if (closeIdx === -1) {
        throw new Error('Malformed iOS .strings catalog: unclosed block comment /*');
      }
      i = closeIdx + 2;
      continue;
    }

    // 3. String key
    if (src[i] === '"') {
      const keyStart = i + 1;
      let keyEnd = -1;
      let escaped = false;
      let j = keyStart;
      while (j < len) {
        if (escaped) {
          escaped = false;
        } else if (src[j] === '\\') {
          escaped = true;
        } else if (src[j] === '"') {
          keyEnd = j;
          break;
        }
        j++;
      }
      if (keyEnd === -1) {
        throw new Error('Malformed iOS .strings catalog: unterminated string key');
      }
      const rawKey = src.slice(keyStart, keyEnd);
      const key = unescapeIosString(rawKey);
      i = keyEnd + 1;

      // Skip whitespace
      while (i < len && /\s/.test(src[i])) i++;

      // Expect '='
      if (i >= len || src[i] !== '=') {
        throw new Error(`Malformed iOS .strings catalog: expected '=' after key "${key}"`);
      }
      i++; // skip '='

      // Skip whitespace
      while (i < len && /\s/.test(src[i])) i++;

      // Expect '"'
      if (i >= len || src[i] !== '"') {
        throw new Error(`Malformed iOS .strings catalog: expected string value for key "${key}"`);
      }
      const valStart = i + 1;
      let valEnd = -1;
      escaped = false;
      j = valStart;
      while (j < len) {
        if (escaped) {
          escaped = false;
        } else if (src[j] === '\\') {
          escaped = true;
        } else if (src[j] === '"') {
          valEnd = j;
          break;
        }
        j++;
      }
      if (valEnd === -1) {
        throw new Error(`Malformed iOS .strings catalog: unterminated string value for key "${key}"`);
      }
      const rawVal = src.slice(valStart, valEnd);
      const val = unescapeIosString(rawVal);
      i = valEnd + 1;

      // Skip whitespace
      while (i < len && /\s/.test(src[i])) i++;

      // Expect ';'
      if (i >= len || src[i] !== ';') {
        throw new Error(`Malformed iOS .strings catalog: expected ';' after value for key "${key}"`);
      }
      i++; // skip ';'

      dict[key] = val;
      continue;
    }

    // If we reached here, there is unexpected non-whitespace, non-comment content
    const snippet = src.slice(i, Math.min(i + 20, len)).replace(/[\r\n]+/g, ' ');
    throw new Error(`Malformed iOS .strings catalog: unexpected content near "${snippet}"`);
  }

  return dict;
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  let showHelp = false;
  let jsonOutput = false;
  let warnOnly = false;
  let minFallbackLength = 16;
  let sourcePath = null;
  let pronounPolicy = null;
  const ignoreKeys = new Set();
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
    } else if (arg === '--warn-only') {
      warnOnly = true;
    } else if (arg === '--ignore-keys') {
      if (i + 1 >= argv.length) {
        console.error('❌ Missing value for --ignore-keys (expected comma-separated keys)');
        process.exit(1);
      }
      argv[++i]
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .forEach((k) => ignoreKeys.add(k));
    } else if (arg.startsWith('--ignore-keys=')) {
      arg
        .slice(14)
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .forEach((k) => ignoreKeys.add(k));
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
  --source <file>       Path to source catalog (.json/.js/.mjs/.xml/.strings) to compare placeholders and fallbacks
  --ignore-keys <keys>  Comma-separated list of keys or wildcard patterns (e.g. "picker.*,app_name") to ignore
  --warn-only           Report audit findings but exit with code 0 (file-read and parse errors still exit with code 1)
  --min-fallback <n>    Minimum character length for identity fallback check (default: 16)
  --pronoun <name>      Enforce consistent pronoun: "Anda", "kamu", or "any" (default: any)
  --register <mode>     Alias for pronoun policy: "formal" (Anda), "casual" (kamu), or "any"
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
      } else if (absSourcePath.endsWith('.xml')) {
        sourceCatalog = parseAndroidXmlLocale(rawSource);
      } else if (absSourcePath.endsWith('.strings')) {
        sourceCatalog = parseIosStringsLocale(rawSource);
      } else {
        console.error(
          `❌ Error: --source file must be a .json, .js/.mjs, .xml, or .strings locale dictionary: ${sanitizeDiagnostic(sourcePath)}`,
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

  let hasFindingFailures = false;
  let hasOperationalErrors = false;
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
      hasOperationalErrors = true;
      continue;
    }

    let findings = [];
    try {
      if (absPath.endsWith('.json')) {
        findings = auditDictionary(JSON.parse(raw), {
          minFallbackLength,
          source: sourceCatalog,
          pronoun: pronounPolicy,
          ignoreKeys,
        });
      } else if (absPath.endsWith('.js') || absPath.endsWith('.mjs')) {
        findings = auditDictionary(parseSimpleJsLocale(raw), {
          minFallbackLength,
          source: sourceCatalog,
          pronoun: pronounPolicy,
          ignoreKeys,
        });
      } else if (absPath.endsWith('.xml')) {
        findings = auditDictionary(parseAndroidXmlLocale(raw), {
          minFallbackLength,
          source: sourceCatalog,
          pronoun: pronounPolicy,
          ignoreKeys,
        });
      } else if (absPath.endsWith('.strings')) {
        findings = auditDictionary(parseIosStringsLocale(raw), {
          minFallbackLength,
          source: sourceCatalog,
          pronoun: pronounPolicy,
          ignoreKeys,
        });
      } else {
        findings = auditText(raw, { pronoun: pronounPolicy }).map((f) => ({ key: path.basename(absPath), ...f }));
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
      hasOperationalErrors = true;
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
        hasFindingFailures = true;
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
        hasFindingFailures = true;
        console.error(`❌ Found ${findings.length} issue(s) in ${sanitizeDiagnostic(target)}:`);
        let printedBytes = 0;
        let truncated = false;
        for (const f of findings) {
          const line = `  - [${sanitizeDiagnostic(f.rule)}] [${sanitizeDiagnostic(f.category || 'general')}] (${sanitizeDiagnostic(f.key)}): ${sanitizeDiagnostic(f.message)}\n`;
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

  process.exitCode = hasOperationalErrors || (hasFindingFailures && !warnOnly) ? 1 : 0;
}

module.exports = {
  auditText,
  auditDictionary,
  extractPlaceholders,
  hasMalformedBraces,
  checkPronounPolicy,
  parseSimpleJsLocale,
  parseAndroidXmlLocale,
  parseIosStringsLocale,
  sanitizeDiagnostic,
  truncateToUtf8ByteLimit,
};
