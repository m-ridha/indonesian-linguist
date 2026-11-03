#!/usr/bin/env node
/**
 * Unit tests for the deterministic Indonesian i18n & prose auditor (`scripts/audit-id.js`).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
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
    '    baris kedua dalam indented code block yg sama—tidak boleh kena flag',
    '',
    'Contoh daftar di dalam indented code block:',
    '',
    '    - Silahkan cek yg ini',
    '',
    'Paragraf penutup ini sudah baku dan alami.',
  ].join('\n');
  assert.deepEqual(auditText(docWithCodeExamples), []);

  // Nested Markdown list items after a blank line must still be audited
  const nestedListWithDefect = '- Petunjuk\n\n    - Silahkan lanjutkan.\n    Baris lanjutan yg salah.';
  const listIssues = auditText(nestedListWithDefect);
  assert.ok(listIssues.some((i) => i.rule === 'kata-tidak-baku'));
  assert.ok(listIssues.some((i) => i.rule === 'sms-abbreviation'));
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

test('auditDictionary: keeps hyphenated exercise names, audits indented plain-text values, and handles ordered ")" lists', () => {
  const dict = {
    'Single-leg deadlift': 'Single-leg deadlift',
    'Reverse-grip barbell curl': 'Reverse-grip barbell curl',
    Note: '    Kalimat benar\n    Silahkan masuk',
  };
  const findings = auditDictionary(dict);
  assert.deepEqual(findings.map((f) => f.key), ['Note']);
  assert.ok(findings[0].message.includes('silakan'));
  assert.ok(auditText('1) Petunjuk\n\n    1) Silahkan lanjutkan.').some((i) => i.rule === 'kata-tidak-baku'));
});

test('auditText: keeps list prose audited but strips code indented past the list item content', () => {
  const code = '1. Langkah\n\n        silahkan ini kode di dalam list\n\n2. Selesai';
  assert.deepEqual(auditText(code), []);
  const prose = '1. Langkah\n\n    Silahkan lanjutkan.';
  assert.ok(auditText(prose).some((i) => i.rule === 'kata-tidak-baku'));
});

test('auditText: ends list code blocks at the list code indentation and measures tab stops', () => {
  const afterCode = '1. Langkah\n\n       contoh kode\n\n    Silahkan lanjutkan.';
  assert.ok(auditText(afterCode).some((i) => i.rule === 'kata-tidak-baku'));
  const tabProse = '1.\tLangkah\n\n    Silahkan lanjutkan.';
  assert.ok(auditText(tabProse).some((i) => i.rule === 'kata-tidak-baku'));
  const tabCode = '1.\tLangkah\n\n\t\tsilahkan kode\n';
  assert.deepEqual(auditText(tabCode), []);
});

test('auditDictionary: rejects generic hyphenated English phrases as retained exercise names', () => {
  const findings = auditDictionary({ 'Beginner-friendly bench press': 'Beginner-friendly bench press' });
  assert.equal(findings.length, 1);
});

test('auditDictionary: flags silent English fallback on long strings (>15 chars), even when containing a retained brand/loanword inside a sentence', () => {
  const dict = {
    Gym: 'Gym', // Short loanword: allowed
    'Face ID / Touch ID': 'Face ID / Touch ID', // Complete retained proper noun label: allowed
    'Incline dumbbell bench press': 'Incline dumbbell bench press', // Complete retained exercise name: allowed
    'Collapse completed exercises': 'Collapse completed exercises', // Long untranslated fallback: flagged!
    'Open Apple Health to log your workout': 'Open Apple Health to log your workout', // English sentence containing Apple Health: flagged!
    'Tap here to add bench press': 'Tap here to add bench press', // English instruction ending with bench press: flagged!
  };
  const findings = auditDictionary(dict);
  assert.equal(findings.length, 3);
  assert.ok(findings.every((f) => f.rule === 'silent-fallback'));
  assert.deepEqual(
    findings.map((f) => f.key),
    [
      'Collapse completed exercises',
      'Open Apple Health to log your workout',
      'Tap here to add bench press',
    ],
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

test('parseSimpleJsLocale: parses both quoted and unquoted JS keys, ignores braces inside comments, and rejects invalid/empty input', () => {
  const parsed = parseSimpleJsLocale(`
    // {0} is the item count in header comments
    /* Another comment with { braces } */
    export default {
      Back: 'Punggung',
      'Clear rating': "Peringkat yang jelas",
    };
    // Trailing comment with { brace }
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
  // Regression test: linear scanner rejects unterminated block comments without quadratic backtracking
  assert.throws(
    () => parseSimpleJsLocale('/* unterminated comment\nexport default { Back: "Punggung" };'),
    /Unterminated block comment/,
  );
  // Regression test: long identifier without colon is rejected in linear time
  assert.throws(
    () => parseSimpleJsLocale(`export default { ${'a'.repeat(2000)} "value" };`),
    /Unsupported JS locale syntax/,
  );
});

test('auditDictionary: bounds nesting depth and prevents exponential allocation', () => {
  // Construct deep nested object
  let deepObj = { Back: 'Punggung' };
  for (let i = 0; i < 40; i++) {
    deepObj = { level: deepObj };
  }
  const findings = auditDictionary(deepObj);
  assert.ok(findings.some((f) => f.rule === 'nesting-limit-exceeded'));
});

test('auditDictionary: signs out linear regex handles repetitive "signs" safely without catastrophic backtracking', () => {
  const repetitiveKey = `${'signs '.repeat(20000)}not_out`;
  const t0 = Date.now();
  const findings = auditDictionary({ [repetitiveKey]: 'menandakan' });
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 200, `Regex took too long: ${elapsed}ms`);
  assert.equal(findings.length, 0);

  // Positive case
  const matchFindings = auditDictionary({ 'signs the user out': 'menandakan user keluar' });
  assert.ok(matchFindings.some((f) => f.rule === 'polysemy-calque'));
});

test('auditDictionary: handles compact shared-reference DAGs and cyclic objects without exponential calls', () => {
  // Shared-reference DAG: 2 children pointing to same node across 25 levels (would be 2^25 = 33M calls without object tracking)
  const leaf = { Back: 'Punggung' };
  let node = leaf;
  for (let i = 0; i < 25; i++) {
    node = { left: node, right: node };
  }
  const t0 = Date.now();
  const findings = auditDictionary(node);
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 200, `DAG traversal took ${elapsed}ms (expected < 200ms)`);
  assert.ok(findings.length > 0);

  // Cyclic object
  const cycle = { a: 'test' };
  cycle.self = cycle;
  const cycleFindings = auditDictionary(cycle);
  assert.ok(Array.isArray(cycleFindings));
});

test('CLI: escapes control characters and newlines in diagnostics to prevent log injection', () => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'audit-id.js');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-id-sec-'));

  try {
    const maliciousJson = path.join(tmpDir, 'malicious.json');
    // Key containing actual newline, carriage return, line separator, and bidi control to attempt log injection
    fs.writeFileSync(
      maliciousJson,
      JSON.stringify({
        'Injected\nFAKE_STATUS: OK\rCR\u2028LS\u202eRLO': 'silahkan',
      }),
      'utf8',
    );

    const result = spawnSync(process.execPath, [scriptPath, maliciousJson], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    // Control characters must be escaped, never emitted as raw control or line breaks in diagnostic output
    assert.match(result.stderr, /Injected\\nFAKE_STATUS: OK\\rCR\\u2028LS\\u202eRLO/);
    assert.doesNotMatch(result.stderr, /Injected\nFAKE_STATUS/);
    assert.doesNotMatch(result.stderr, /OK\rCR/);
    assert.doesNotMatch(result.stderr, /\u2028/);
    assert.doesNotMatch(result.stderr, /\u202e/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('CLI: error handlers escape control characters in filenames and syntax error messages', () => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'audit-id.js');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-id-err-'));

  try {
    // 1. Missing file path with newline
    const resultMissing = spawnSync(process.execPath, [scriptPath, 'missing\nFAKE_HEADER: injection'], {
      encoding: 'utf8',
    });
    assert.equal(resultMissing.status, 1);
    assert.match(resultMissing.stderr, /missing\\nFAKE_HEADER/);
    assert.doesNotMatch(resultMissing.stderr, /missing\nFAKE_HEADER/);

    // 2. Malformed JS file with control characters in key
    const malformedJs = path.join(tmpDir, 'malformed.js');
    fs.writeFileSync(
      malformedJs,
      'module.exports = { "bad\nkey\x1b[31m": };',
      'utf8',
    );
    const resultParse = spawnSync(process.execPath, [scriptPath, malformedJs], {
      encoding: 'utf8',
    });
    assert.equal(resultParse.status, 1);
    assert.match(resultParse.stderr, /bad\\nkey/);
    assert.doesNotMatch(resultParse.stderr, /bad\nkey/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('auditDictionary: recursively audits nested namespace objects and prefixes finding keys', () => {
  const nestedDict = {
    nav: {
      Back: 'Punggung',
      profile: {
        'Clear rating': 'Peringkat yang jelas',
      },
    },
  };
  const findings = auditDictionary(nestedDict);
  assert.equal(findings.length, 2);
  assert.deepEqual(
    findings.map((f) => f.key),
    ['nav.Back', 'nav.profile.Clear rating'],
  );
});

test('CLI: audits multiple files passed on command line and exits non-zero if a later file fails', () => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'audit-id.js');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-id-'));

  try {
    const cleanFile = path.join(tmpDir, 'clean.md');
    const dirtyFile = path.join(tmpDir, 'dirty.md');
    fs.writeFileSync(cleanFile, 'Silakan simpan perubahan ini.\n', 'utf8');
    fs.writeFileSync(dirtyFile, 'Silahkan simpan perubahan yg ini.\n', 'utf8');

    const result = spawnSync(process.execPath, [scriptPath, cleanFile, dirtyFile], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Clean: 0 findings/);
    assert.match(result.stderr, /dirty\.md/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
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

test('auditDictionary: reports nesting-limit-exceeded on deep path even if object visited via shallow path', () => {
  const sharedLeaf = { Back: 'Punggung' };
  let deepNode = sharedLeaf;
  for (let i = 0; i < 32; i++) {
    deepNode = { next: deepNode };
  }
  const graph = {
    shallow: sharedLeaf,
    deep: deepNode,
  };
  const findings = auditDictionary(graph);
  assert.ok(findings.some((f) => f.rule === 'nesting-limit-exceeded'));
});

test('auditDictionary: does not read property values beyond traversal entry limit', () => {
  const obj = {};
  let getterCalledPastLimit = false;
  for (let i = 0; i <= 50005; i++) {
    const key = `k${i}`;
    if (i >= 50000) {
      Object.defineProperty(obj, key, {
        enumerable: true,
        get() {
          getterCalledPastLimit = true;
          return 'value';
        },
      });
    } else {
      obj[key] = 'value';
    }
  }
  const findings = auditDictionary(obj);
  assert.ok(findings.some((f) => f.rule === 'traversal-limit-exceeded'));
  assert.strictEqual(getterCalledPastLimit, false);
});

test('auditDictionary: ignores inherited prototype properties without scanning them', () => {
  const proto = { inheritedBad: 'Punggung' };
  const child = Object.create(proto);
  child.Back = 'Kembali';
  const findings = auditDictionary(child);
  assert.strictEqual(findings.length, 0);
});

test('auditDictionary: stops cycle on active ancestor path without overflowing finding limit on self-reference', () => {
  const cyclic = { Back: 'Punggung' };
  cyclic.self = cyclic;
  const sibling = { Back: 'Punggung' };
  const root = {
    first: cyclic,
    second: sibling,
  };
  const findings = auditDictionary(root);
  // Both cyclic and sibling should be audited once without repeating cycles
  const backFindings = findings.filter((f) => f.rule === 'polysemy-calque');
  assert.strictEqual(backFindings.length, 2);
  assert.ok(findings.some((f) => f.key === 'first.Back'));
  assert.ok(findings.some((f) => f.key === 'second.Back'));
});
