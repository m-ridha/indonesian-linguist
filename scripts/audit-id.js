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

const RETAINED_LOANWORD_PATTERNS = [
  /^(Drop-set|Superset|Rest-pause|Deload|Bodyweight|Powerlifting|Thibaudeau)/i,
  /\b(bench press|barbell curl|back squat|front squat|deadlift|overhead press|leverage machine)\b/i,
  /\b(serratus anterior|latissimus dorsi|sternocleidomastoid|pectoralis|gluteus|gastrocnemius)\b/i,
  /\b(Face ID|Touch ID|iCloud Keychain|Google Password Manager|Health Connect|Apple Health|Apple Watch|Cloudflare)\b/i,
  /\b(API key|endpoint|reverse proxy|webhook)\b/i,
];

function extractPlaceholders(str) {
  const matches = String(str).match(/\{[0-9a-zA-Z_]+\}/g) || [];
  return [...new Set(matches)].sort();
}

/**
 * Audit a prose string for Indonesian AI slop, SMS slang, and non-standard spelling.
 * Automatically strips protected Markdown fenced code blocks and inline code spans.
 * @param {string} text
 * @returns {Array<{rule: string, message: string}>}
 */
function auditText(text) {
  const issues = [];
  const str = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ');

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
 * Audit a key-value i18n dictionary object.
 * @param {Record<string, string>} dict
 * @param {{ minFallbackLength?: number, allowlistKeys?: Set<string> }} [options]
 * @returns {Array<{key: string, rule: string, message: string}>}
 */
function auditDictionary(dict, options = {}) {
  const minFallbackLength = options.minFallbackLength ?? 16;
  const allowlistKeys = options.allowlistKeys ?? new Set();
  const findings = [];

  for (const [key, value] of Object.entries(dict)) {
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

    // 2. Placeholder parity check
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

function parseSimpleJsLocale(content) {
  const dict = {};
  const pairRegex = /(['"])((?:\\.|(?!\1)[^\\])*)\1\s*:\s*(['"])((?:\\.|(?!\3)[^\\])*)\3/g;
  let match;
  while ((match = pairRegex.exec(content)) !== null) {
    const k = match[2].replace(/\\(['"\\])/g, '$1');
    const v = match[4].replace(/\\(['"\\])/g, '$1');
    dict[k] = v;
  }
  return dict;
}

if (require.main === module) {
  const target = process.argv[2];
  if (!target) {
    console.log('Usage: node scripts/audit-id.js <path-to-locale.json|locale.js|text.md>');
    process.exit(0);
  }
  const absPath = path.resolve(process.cwd(), target);
  const raw = fs.readFileSync(absPath, 'utf8');
  let findings = [];

  if (absPath.endsWith('.json')) {
    findings = auditDictionary(JSON.parse(raw));
  } else if (absPath.endsWith('.js') || absPath.endsWith('.mjs')) {
    findings = auditDictionary(parseSimpleJsLocale(raw));
  } else {
    findings = auditText(raw).map((f) => ({ key: path.basename(absPath), ...f }));
  }

  if (findings.length === 0) {
    console.log(`✅ Clean: 0 findings in ${target}`);
    process.exit(0);
  } else {
    console.error(`❌ Found ${findings.length} issue(s) in ${target}:`);
    for (const f of findings) {
      console.error(`  - [${f.rule}] (${f.key}): ${f.message}`);
    }
    process.exit(1);
  }
}

module.exports = {
  auditText,
  auditDictionary,
  extractPlaceholders,
  parseSimpleJsLocale,
};
