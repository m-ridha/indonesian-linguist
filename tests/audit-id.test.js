#!/usr/bin/env node
/**
 * Unit tests for the deterministic Indonesian i18n & prose auditor (`scripts/audit-id.js`).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { auditText, auditDictionary, parseSimpleJsLocale } = require('../scripts/audit-id');

test('auditText: clean natural Indonesian passes with zero findings', () => {
  const clean =
    'Catat beban, repetisi, dan rekor pribadimu di setiap sesi latihan. Silakan atur target mingguan sesuai jadwalmu.';
  assert.deepEqual(auditText(clean), []);
});

test('auditText: ignores protected Markdown inline code spans, backtick/tilde fences, and indented code blocks', () => {
  const docWithCodeExamples = [
    'Gunakan bentuk baku di luar blok kode, bukan `silahkan`, `yg`, atau `hiruk pikuk`.',
    '```text',
    'Silahkan cek yg ini—di era digital.',
    '```',
    '~~~text',
    'silahkan dgn resiko—adalah merupakan',
    '~~~',
    '',
    '    silahkan merubah aktifitas yg ada—di era digital',
    '',
    'Paragraf penutup ini sudah baku dan alami.',
  ].join('\n');
  assert.deepEqual(auditText(docWithCodeExamples), []);
});

test('auditText: flags banned SMS abbreviations (yg, dgn, utk, krn, tdk, bgt)', () => {
  const issues = auditText('Latihan yg sudah selesai akan disimpan dgn pengaturan baru.');
  assert.ok(issues.some((i) => i.rule === 'sms-abbreviation'));
});

test('auditText: flags non-standard spellings (silahkan, sekedar, resiko, merubah, mempengaruhi, dikarenakan)', () => {
  const issues = auditText(
    'Silahkan ubah jadwal dikarenakan sekedar ingin mengurangi resiko cedera dalam rangka untuk latihan.',
  );
  const rules = issues.filter((i) => i.rule === 'kata-tidak-baku');
  assert.equal(rules.length, 4);
  assert.ok(issues.some((i) => i.rule === 'slop-or-pleonasm' && i.message.includes('dalam rangka untuk')));
});

test('auditText: flags AI slop vocabulary, negative parallelism, and stylistic em dashes', () => {
  const slop =
    'Di era digital ini, aplikasi ini—di tengah hiruk pikuk kesibukan—bukan hanya mencatat beban, tetapi juga adalah merupakan teman latihan.';
  const issues = auditText(slop);
  const messages = issues.map((i) => i.message).join(' | ');
  assert.match(messages, /hiruk pikuk/);
  assert.match(messages, /di era digital/);
  assert.match(messages, /adalah merupakan/);
  assert.match(messages, /bukan hanya/);
  assert.match(messages, /em dash/);
});

test('auditDictionary: flags silent English fallback on long strings (>15 chars), even when containing a retained brand/loanword inside a sentence', () => {
  const dict = {
    Gym: 'Gym', // Short loanword: allowed
    'Face ID / Touch ID': 'Face ID / Touch ID', // Complete retained proper noun label: allowed
    'Collapse completed exercises': 'Collapse completed exercises', // Long untranslated fallback: flagged!
    'Open Apple Health to log your workout': 'Open Apple Health to log your workout', // English sentence containing Apple Health: flagged!
  };
  const findings = auditDictionary(dict);
  assert.equal(findings.length, 2);
  assert.ok(findings.every((f) => f.rule === 'silent-fallback'));
  assert.deepEqual(
    findings.map((f) => f.key),
    ['Collapse completed exercises', 'Open Apple Health to log your workout'],
  );
});

test('auditDictionary: flags placeholder mismatches including duplicate counts and printf (%s, %d) tokens', () => {
  const dict = {
    '{0} week streak': 'Minggu beruntun', // Missing {0}
    'Rest {0}s for {1}': 'Istirahat {0} dtk', // Missing {1}
    '{0} + {0}': '{0}', // Dropped duplicate {0}
    'Rest %d seconds for %s': 'Istirahat %d detik', // Missing %s
  };
  const findings = auditDictionary(dict);
  assert.equal(findings.length, 4);
  assert.ok(findings.every((f) => f.rule === 'placeholder-mismatch'));
});

test('parseSimpleJsLocale: parses both quoted and unquoted JS keys and rejects invalid/empty input', () => {
  const parsed = parseSimpleJsLocale(`
    // Sample locale
    export default {
      Back: 'Punggung',
      'Clear rating': "Peringkat yang jelas",
    };
  `);
  assert.deepEqual(parsed, {
    Back: 'Punggung',
    'Clear rating': 'Peringkat yang jelas',
  });
  const findings = auditDictionary(parsed);
  assert.equal(findings.length, 2);

  assert.throws(() => parseSimpleJsLocale('export default {};'), /No key-value string entries/);
  assert.throws(() => parseSimpleJsLocale('const x = 42;'), /missing object literal braces/);
  assert.throws(
    () => parseSimpleJsLocale('export default { Back: getDynamicValue() };'),
    /Unsupported JS locale syntax/,
  );
});

test('CLI: audits multiple files passed on command line and exits non-zero if a later file fails', () => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'audit-id.js');
  const cleanFile = path.join(__dirname, '..', 'CHANGELOG.md');
  const dirtyFile = path.join(__dirname, '..', 'README.md'); // Contains intentional bad examples outside code spans

  assert.throws(
    () => execFileSync(process.execPath, [scriptPath, cleanFile, dirtyFile], { stdio: 'pipe' }),
    /Command failed/,
  );
});

test('auditDictionary: flags known OpenGym / UI polysemy and literal calque traps', () => {
  const badDict = {
    Back: 'Punggung',
    'Clear rating': 'Peringkat yang jelas',
    Light: 'Lampu',
    Right: 'Benar',
    'Discard running workout': 'Buang latihan lari',
    'Sets are drawn': 'Set diundi',
    'In Cards, Prev and Next hop over a finished exercise':
      'Di Kartu, Sebelumnya dan Berikutnya lanjutkan latihan yang sudah selesai',
    'Signs {0} out': 'Menandakan {0}',
    Abductors: 'Penculik',
    Landmine: 'Ranjau darat',
    'Add exercise': 'Tambahkan olahraga',
  };
  const findings = auditDictionary(badDict);
  const polysemyFindings = findings.filter((f) => f.rule === 'polysemy-calque');
  assert.equal(polysemyFindings.length, 11);
});

test('auditDictionary: passes accurate OpenGym Indonesian localizations with 0 findings (including lowercase anatomical back)', () => {
  const goodDict = {
    Back: 'Kembali',
    back: 'punggung',
    'Clear rating': 'Hapus penilaian',
    Light: 'Terang',
    Right: 'Kanan',
    'Discard running workout': 'Buang sesi latihan yang sedang berjalan',
    'Sets are drawn': 'Set ditampilkan di grafik',
    'In Cards, Prev and Next hop over a finished exercise':
      'Di Kartu, Sebelumnya dan Berikutnya melewati latihan yang sudah selesai',
    'Signs {0} out': 'Mengeluarkan {0}',
    Abductors: 'Abduktor',
    Landmine: 'Landmine',
    'Add exercise': 'Tambahkan latihan',
    'As entered': 'Sesuai input',
    'Same as work sets': 'Ikuti set utama',
    '{0} week streak': '{0} minggu beruntun',
  };
  const findings = auditDictionary(goodDict);
  assert.deepEqual(findings, []);
});
