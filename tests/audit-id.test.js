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
const {
  auditText,
  auditDictionary,
  parseSimpleJsLocale,
  parseAndroidXmlLocale,
  parseIosStringsLocale,
  truncateToUtf8ByteLimit,
} = require('../scripts/audit-id');

test('auditText: clean natural Indonesian passes with zero findings', () => {
  const clean =
    'Catat beban, repetisi, dan rekor pribadimu di setiap sesi latihan. Silakan atur target mingguan sesuai jadwalmu.';
  assert.deepEqual(auditText(clean), []);
});

test('auditText returns structured finding coordinates and captures all occurrences', () => {
  const input = 'Mohon silahkan cek aktifitas di era digital ini, silahkan coba lagi.';
  const issues = auditText(input);
  assert.ok(issues.length >= 3);
  const silahkanIssues = issues.filter((i) => i.original && i.original.toLowerCase() === 'silahkan');
  assert.strictEqual(silahkanIssues.length, 2);
  assert.strictEqual(silahkanIssues[0].startIndex, 6);
  assert.strictEqual(silahkanIssues[0].endIndex, 14);
  assert.strictEqual(silahkanIssues[0].replacement, 'silakan');
  assert.strictEqual(silahkanIssues[0].confidence, 'high');
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

test('auditText: ignores tokens inside template placeholders ({name}, {{name}}, printf)', () => {
  const text = 'Silakan periksa {resiko} dan {{aktifitas}} untuk pengguna %s disini.';
  const issues = auditText(text);
  assert.strictEqual(issues.some((i) => i.original === 'resiko'), false);
  assert.strictEqual(issues.some((i) => i.original === 'aktifitas'), false);
  const disiniIssue = issues.find((i) => i.original === 'disini');
  assert.ok(disiniIssue);
  assert.strictEqual(disiniIssue.startIndex, text.indexOf('disini'));
  assert.strictEqual(disiniIssue.replacement, 'di sini');
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

test('auditText: flags non-standard kedaluwarsa variants', () => {
  const issues = auditText('Tanggal daluwarsa. Kode ini kadaluarsa. Kadaluwarsa juga harus diperbarui. Akses kedaluarsa juga harus diperbarui.');
  const spellingIssues = issues.filter((issue) => issue.rule === 'kata-tidak-baku');
  assert.equal(spellingIssues.length, 4);
  assert.ok(spellingIssues.every((issue) => issue.replacement.toLowerCase() === 'kedaluwarsa'));
  assert.equal(auditText('Kode ini kedaluwarsa.').length, 0);
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
    // Key containing actual newline, carriage return, line separator, bidi control, and arabic letter mark to attempt log injection
    fs.writeFileSync(
      maliciousJson,
      JSON.stringify({
        'Injected\nFAKE_STATUS: OK\rCR\u2028LS\u202eRLO\u061cALM': 'silahkan',
      }),
      'utf8',
    );

    const result = spawnSync(process.execPath, [scriptPath, maliciousJson], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    // Control characters must be escaped, never emitted as raw control or line breaks in diagnostic output
    assert.match(result.stderr, /Injected\\nFAKE_STATUS: OK\\rCR\\u2028LS\\u202eRLO\\u061cALM/);
    assert.doesNotMatch(result.stderr, /Injected\nFAKE_STATUS/);
    assert.doesNotMatch(result.stderr, /OK\rCR/);
    assert.doesNotMatch(result.stderr, /\u2028/);
    assert.doesNotMatch(result.stderr, /\u202e/);
    assert.doesNotMatch(result.stderr, /\u061c/);
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
  const proto = { Back: 'Punggung' };
  const child = Object.create(proto);
  child.Safe = 'Aman';
  const findings = auditDictionary(child);
  assert.strictEqual(findings.length, 0);
});

test('auditDictionary: stops cycle on active ancestor path at depth limit without reporting nesting-limit-exceeded', () => {
  const root = {};
  let current = root;
  for (let i = 0; i < 32; i++) {
    const next = {};
    current.next = next;
    current = next;
  }
  // At depth 32, point back to root (an active ancestor)
  current.loop = root;
  const findings = auditDictionary(root);
  assert.strictEqual(findings.some((f) => f.rule === 'nesting-limit-exceeded'), false);
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

test('auditDictionary: truncates extremely long key paths while preserving leaf key distinction', () => {
  const deepKey = 'a'.repeat(2000);
  const dict = {
    [deepKey]: {
      Back: 'Punggung',
      light: 'lampu',
    },
  };
  const findings = auditDictionary(dict);
  assert.equal(findings.length, 2);
  assert.ok(findings[0].key.length <= 1024);
  assert.ok(findings[1].key.length <= 1024);
  assert.ok(findings[0].key.endsWith('...[truncated].Back'));
  assert.ok(findings[1].key.endsWith('...[truncated].light'));
  assert.notEqual(findings[0].key, findings[1].key);

  // Long root-level key
  const rootDict = {
    ['b'.repeat(2000)]: 'silahkan',
  };
  const rootFindings = auditDictionary(rootDict);
  assert.equal(rootFindings.length, 1);
  assert.ok(rootFindings[0].key.length <= 1024);
  assert.ok(rootFindings[0].key.endsWith('...[truncated]'));
});

test('CLI: bounds cumulative diagnostic output bytes on files with many findings', () => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'audit-id.js');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-cli-ampl-'));

  try {
    const hugeDict = {};
    const longPrefix = 'namespace_'.repeat(50);
    for (let i = 0; i < 3000; i++) {
      hugeDict[`${longPrefix}_item_${i}`] = 'silahkan';
    }
    const testFile = path.join(tmpDir, 'huge.json');
    fs.writeFileSync(testFile, JSON.stringify({ root: hugeDict }), 'utf8');

    const result = spawnSync(process.execPath, [scriptPath, testFile], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /remaining findings truncated/);
    // Cumulative stderr output should not balloon beyond bounded budget
    assert.ok(Buffer.byteLength(result.stderr, 'utf8') < 100_000);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('CLI: prints key and rule for an oversized single finding before truncating', () => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'audit-id.js');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-cli-single-'));

  try {
    // Single finding with value > 100,000 bytes
    const oversizedValue = 'Punggung ' + 'aman '.repeat(25000);
    const testFile = path.join(tmpDir, 'single.json');
    fs.writeFileSync(testFile, JSON.stringify({ Back: oversizedValue }), 'utf8');

    const result = spawnSync(process.execPath, [scriptPath, testFile], {
      encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    // Key and rule must remain identifiable even though message is truncated
    assert.match(result.stderr, /\[polysemy-calque\]/);
    assert.match(result.stderr, /\(Back\)/);
    assert.match(result.stderr, /remaining findings truncated/);
    assert.ok(Buffer.byteLength(result.stderr, 'utf8') <= 70_000);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('truncateToUtf8ByteLimit: cleanly stops at multibyte UTF-8 code point boundaries', () => {
  // Test 1-byte, 2-byte, 3-byte, and 4-byte UTF-8 sequences
  const s = 'a' + '\u00E9' + '\u4E16' + '🔥' + '😀' + 'z';
  // 'a' = 1 byte
  // '\u00E9' (é) = 2 bytes
  // '\u4E16' (世) = 3 bytes
  // '🔥' = 4 bytes (2 UTF-16 code units: \uD83D\uDD25)
  // '😀' = 4 bytes (2 UTF-16 code units: \uD83D\uDE00)
  // 'z' = 1 byte
  // Total = 15 bytes
  assert.strictEqual(truncateToUtf8ByteLimit(s, 0), '');
  assert.strictEqual(truncateToUtf8ByteLimit(s, 1), 'a');
  assert.strictEqual(truncateToUtf8ByteLimit(s, 2), 'a'); // Cannot fit 'é' (2 bytes)
  assert.strictEqual(truncateToUtf8ByteLimit(s, 3), 'a\u00E9'); // Fits 'é'
  assert.strictEqual(truncateToUtf8ByteLimit(s, 5), 'a\u00E9'); // Cannot fit '世' (3 bytes)
  assert.strictEqual(truncateToUtf8ByteLimit(s, 6), 'a\u00E9\u4E16'); // Fits '世'
  assert.strictEqual(truncateToUtf8ByteLimit(s, 9), 'a\u00E9\u4E16'); // Cannot fit '🔥' (4 bytes)
  assert.strictEqual(truncateToUtf8ByteLimit(s, 10), 'a\u00E9\u4E16🔥'); // Fits '🔥'
  assert.strictEqual(truncateToUtf8ByteLimit(s, 13), 'a\u00E9\u4E16🔥'); // Cannot fit '😀' (4 bytes)
  assert.strictEqual(truncateToUtf8ByteLimit(s, 14), 'a\u00E9\u4E16🔥😀'); // Fits '😀'
  assert.strictEqual(truncateToUtf8ByteLimit(s, 15), 'a\u00E9\u4E16🔥😀z');
  assert.strictEqual(truncateToUtf8ByteLimit(s, 50), s);

  for (let b = 0; b <= 20; b++) {
    const res = truncateToUtf8ByteLimit(s, b);
    const buf = Buffer.from(res, 'utf8');
    assert.ok(buf.length <= b);
    // Verify valid UTF-8 round-trip without replacement characters
    assert.ok(Buffer.from(buf.toString('utf8'), 'utf8').equals(buf));
    assert.strictEqual(buf.toString('utf8').includes('\uFFFD'), false);
  }
});

test('CLI: preserves valid UTF-8 when multibyte character crosses the diagnostic truncation boundary', () => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'audit-id.js');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-cli-utf8-'));

  try {
    // Fill the message with 4-byte multibyte emoji characters crossing the 64,000-byte boundary
    const multibyteOversized = 'Punggung ' + '🔥'.repeat(25000);
    const testFile = path.join(tmpDir, 'utf8_boundary.json');
    fs.writeFileSync(testFile, JSON.stringify({ Back: multibyteOversized }), 'utf8');

    // Run without encoding so we inspect the raw stdout/stderr buffer
    const result = spawnSync(process.execPath, [scriptPath, testFile]);

    assert.equal(result.status, 1);
    const stderrBuf = result.stderr;
    const stderrStr = stderrBuf.toString('utf8');

    // Must be valid UTF-8 without unicode replacement characters
    assert.strictEqual(stderrStr.includes('\uFFFD'), false);
    assert.ok(Buffer.from(stderrStr, 'utf8').equals(stderrBuf));

    // Confirm rule, key, and truncation notice are present
    assert.match(stderrStr, /\[polysemy-calque\]/);
    assert.match(stderrStr, /\(Back\)/);
    assert.match(stderrStr, /remaining findings truncated/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('auditDictionary: flags inverted quantitative placeholders ({0} sets unchecked -> Set {0} belum dicentang)', () => {
  // Inverted: quantity placeholder moved after noun (making it read as ordinal #0)
  const inverted1 = auditDictionary({ '{0} sets unchecked': 'Set {0} belum dicentang' });
  assert.ok(inverted1.some((f) => f.rule === 'inverted-quantitative-placeholder'));

  const inverted2 = auditDictionary({ '{0} photos': 'Foto {0}' });
  assert.ok(inverted2.some((f) => f.rule === 'inverted-quantitative-placeholder'));

  const inverted3 = auditDictionary({ '%d passkeys': 'Kunci sandi %d' });
  assert.ok(inverted3.some((f) => f.rule === 'inverted-quantitative-placeholder'));

  const inverted4 = auditDictionary({ '%1$d photos': 'Foto %1$d' });
  assert.ok(inverted4.some((f) => f.rule === 'inverted-quantitative-placeholder'));

  const inverted5 = auditDictionary({ '{count} items left': 'Item {count} tersisa' });
  assert.ok(inverted5.some((f) => f.rule === 'inverted-quantitative-placeholder'));

  const inverted6 = auditDictionary({ '{{0}} photos left': 'Foto {{0}} tersisa' });
  assert.ok(inverted6.some((f) => f.rule === 'inverted-quantitative-placeholder'));

  const inverted7 = auditDictionary({ '{{count}} items left': 'Item {{count}} tersisa' });
  assert.ok(inverted7.some((f) => f.rule === 'inverted-quantitative-placeholder'));

  // Longer multi-word noun phrase inverted before placeholder
  const inverted8 = auditDictionary({ '{{0}} selected photos': 'Foto yang dipilih {{0}}' });
  assert.ok(inverted8.some((f) => f.rule === 'inverted-quantitative-placeholder'));

  // Inverted with word like "Menit {0} tersisa" where "Menit" is a noun
  const inverted9 = auditDictionary({ '{0} minutes left': 'Menit {0} tersisa' });
  assert.ok(inverted9.some((f) => f.rule === 'inverted-quantitative-placeholder'));

  // Correct: quantity placeholder precedes noun
  const correct1 = auditDictionary({ '{0} sets unchecked': '{0} set belum dicentang' });
  assert.equal(correct1.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  const correct2 = auditDictionary({ '{0} sets unchecked': 'Sebanyak {0} set belum dicentang' });
  assert.equal(correct2.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  // Multiword permitted quantifiers like "Tersisa sekitar" and "Masih ada"
  const correct3 = auditDictionary({ '{0} sets left': 'Tersisa sekitar {0} set' });
  assert.equal(correct3.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  const correct3b = auditDictionary({ '{0} photos left': 'Masih ada {0} foto' });
  assert.equal(correct3b.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  const correct3c = auditDictionary({ '{0} exercises left': 'Masih ada {0} gerakan' });
  assert.equal(correct3c.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  // Count placeholder precedes its noun after a verb / predicate: valid
  const correct4 = auditDictionary({ '{{0}} files deleted': 'Dihapus {{0}} file' });
  assert.equal(correct4.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  const correct5 = auditDictionary({ '{0} photos deleted': 'Dihapus {0} foto' });
  assert.equal(correct5.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  // Adverb preceding predicate (Sudah diunggah {0} file)
  const correct6 = auditDictionary({ '{0} files uploaded': 'Sudah diunggah {0} file' });
  assert.equal(correct6.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  // Implicit object followed by adverb (Dihapus {0} lagi / Sudah dihapus {0} lagi)
  const correct7 = auditDictionary({ '{0} more deleted': 'Dihapus {0} lagi' });
  assert.equal(correct7.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  const correct8 = auditDictionary({ '{0} more deleted': 'Sudah dihapus {0} lagi' });
  assert.equal(correct8.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  // Non-count named placeholders (e.g., {name}) should not be flagged when translated as noun phrase
  const nonCount = auditDictionary({ '{name} commented': 'Komentar dari {name}' });
  assert.equal(nonCount.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  // Ordinal English source should not trigger false positives
  const ordinalSource = auditDictionary({ 'Set {0}': 'Set {0}' });
  assert.equal(ordinalSource.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  // Copula-led phrases ({0} is invalid / {{0}} is invalid) are not count phrases
  const copula1 = auditDictionary({ '{{0}} is invalid': 'Nilai {{0}} tidak valid' });
  assert.equal(copula1.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  const copula2 = auditDictionary({ '{0} is invalid': 'Nilai {0} tidak valid' });
  assert.equal(copula2.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);
});

test('parseSimpleJsLocale: parses nested objects, export const, and backtick literals', () => {
  const src = `
    export const COPY = {
      nudge: {
        title: "Pengingat latihan",
        body: \`Sesi latihanmu menunggumu\`,
      },
      cta: 'Buka Sekarang',
    };
  `;
  const parsed = parseSimpleJsLocale(src);
  assert.deepEqual(parsed, {
    nudge: {
      title: 'Pengingat latihan',
      body: 'Sesi latihanmu menunggumu',
    },
    cta: 'Buka Sekarang',
  });

  const findings = auditDictionary(parsed);
  assert.equal(findings.length, 0);

  // Rejects unescaped template literal interpolation ${...}
  assert.throws(
    () => parseSimpleJsLocale('export default { greeting: `Halo ${user}` };'),
    /Unsupported JS locale syntax/,
  );
});

test('CLI: supports --help, -h, --json, and validates --min-fallback operands', () => {
  const scriptPath = path.join(__dirname, '..', 'scripts', 'audit-id.js');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-cli-flags-'));

  try {
    // Test --help and -h exit 0 with usage
    const helpResult = spawnSync(process.execPath, [scriptPath, '--help'], { encoding: 'utf8' });
    assert.equal(helpResult.status, 0);
    assert.match(helpResult.stdout, /Usage:/);
    assert.match(helpResult.stdout, /--json/);

    const shortHelpResult = spawnSync(process.execPath, [scriptPath, '-h'], { encoding: 'utf8' });
    assert.equal(shortHelpResult.status, 0);
    assert.match(shortHelpResult.stdout, /Usage:/);

    // Test --min-fallback operand validation
    const missingOperand = spawnSync(process.execPath, [scriptPath, '--min-fallback'], { encoding: 'utf8' });
    assert.equal(missingOperand.status, 1);
    assert.match(missingOperand.stderr, /Missing value for --min-fallback/);

    const negativeOperand = spawnSync(process.execPath, [scriptPath, '--min-fallback', '-5', 'dummy.json'], {
      encoding: 'utf8',
    });
    assert.equal(negativeOperand.status, 1);
    assert.match(negativeOperand.stderr, /Invalid value for --min-fallback/);

    const malformedOperand = spawnSync(process.execPath, [scriptPath, '--min-fallback=abc', 'dummy.json'], {
      encoding: 'utf8',
    });
    assert.equal(malformedOperand.status, 1);
    assert.match(malformedOperand.stderr, /Invalid value for --min-fallback/);

    // Test --json output format with --min-fallback=0
    const testFile = path.join(tmpDir, 'test.json');
    fs.writeFileSync(testFile, JSON.stringify({ Back: 'Punggung' }), 'utf8');

    const jsonResult = spawnSync(
      process.execPath,
      [scriptPath, '--json', '--min-fallback=0', testFile],
      { encoding: 'utf8' },
    );
    assert.equal(jsonResult.status, 1);
    const parsedJson = JSON.parse(jsonResult.stdout);
    assert.equal(parsedJson.totalFiles, 1);
    assert.equal(parsedJson.failedFiles, 1);
    assert.equal(parsedJson.cleanFiles, 0);
    assert.ok(parsedJson.totalFindings >= 1);
    assert.equal(parsedJson.files[0].clean, false);
    assert.ok(parsedJson.files[0].findings.some((f) => f.rule === 'polysemy-calque'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('auditDictionary: retains barbell loanword variations (high-bar, low-bar, zercher, bulgarian split squat)', () => {
  const exercises = {
    'High-bar back squat (anchor)': 'High-bar back squat (anchor)',
    'Low-bar back squat': 'Low-bar back squat',
    'Safety-bar squat': 'Safety-bar squat',
    'Bulgarian split squat': 'Bulgarian split squat',
    'Zercher squat': 'Zercher squat',
    'Belt squat': 'Belt squat',
    'Box squat': 'Box squat',
    'Hack squat': 'Hack squat',
  };

  const findings = auditDictionary(exercises);
  assert.equal(findings.filter((f) => f.rule === 'silent-fallback').length, 0);
});

test('auditText: flags non-standard merged prepositions (disini, diatas, kesana) while permitting standard kemari', () => {
  // Flag non-standard merged prepositions
  const badTexts = ['Tersimpan disini', 'Lihat diatas meja', 'Pergi kesana segera'];
  for (const text of badTexts) {
    const issues = auditText(text);
    assert.ok(
      issues.some((i) => i.rule === 'kata-tidak-baku'),
      `Expected "${text}" to be flagged as kata-tidak-baku`,
    );
  }

  // Permit standard KBBI VI / EYD V single-word form "kemari"
  const cleanKemari = auditText('Silakan datang kemari untuk memulai latihan.');
  assert.equal(cleanKemari.length, 0);
});

test('auditDictionary: standalone mode does not flag slug keys with placeholders, but catches unmatched braces', () => {
  const slugLocale = {
    calendar: {
      dayLabel: '{date}, {hasEntry}, {today}, {future}',
      showMonths: '{year}',
    },
    entries: {
      recentDescription: '{listLimit}',
    },
  };
  const cleanFindings = auditDictionary(slugLocale);
  assert.equal(cleanFindings.filter((f) => f.rule === 'placeholder-mismatch').length, 0);
  assert.equal(cleanFindings.filter((f) => f.rule === 'malformed-placeholder').length, 0);

  const malformed = {
    'user.info': '{name, selamat datang',
  };
  const malformedFindings = auditDictionary(malformed);
  assert.ok(malformedFindings.some((f) => f.rule === 'malformed-placeholder'));

  // Regression test: balanced-count string with unmatched or misordered braces
  const balancedUnmatched = {
    greeting: 'Halo {name}} {',
  };
  const balancedFindings = auditDictionary(balancedUnmatched, {
    source: { greeting: 'Hello {name}' },
  });
  assert.ok(balancedFindings.some((f) => f.rule === 'malformed-placeholder'));
});

test('auditDictionary: source-aware placeholder and fallback auditing with options.source', () => {
  const sourceEn = {
    calendar: {
      dayLabel: '{date}, {hasEntry}, {today}, {future}',
      showMonths: '{year}',
    },
    dashboard: {
      streak: '{count} days streak',
      welcome: 'Welcome to your private journal',
    },
  };

  // Matching target with correct translations
  const targetIdClean = {
    calendar: {
      dayLabel: '{date}, {hasEntry}, {today}, {future}',
      showMonths: '{year}',
    },
    dashboard: {
      streak: '{count} hari beruntun',
      welcome: 'Selamat datang di jurnal pribadi Anda',
    },
  };
  const cleanFindings = auditDictionary(targetIdClean, { source: sourceEn });
  assert.equal(cleanFindings.length, 0);

  // Target with mismatched placeholders
  const targetIdMismatch = {
    calendar: {
      dayLabel: '{date}, {today}',
    },
  };
  const mismatchFindings = auditDictionary(targetIdMismatch, { source: sourceEn });
  assert.ok(mismatchFindings.some((f) => f.rule === 'placeholder-mismatch'));

  // Target with inverted quantitative placeholder against source
  const targetIdInverted = {
    dashboard: {
      streak: 'Hari {count} beruntun',
    },
  };
  const invertedFindings = auditDictionary(targetIdInverted, { source: sourceEn });
  assert.ok(invertedFindings.some((f) => f.rule === 'inverted-quantitative-placeholder'));

  // Target with silent fallback against source
  const targetIdFallback = {
    dashboard: {
      welcome: 'Welcome to your private journal',
    },
  };
  const fallbackFindings = auditDictionary(targetIdFallback, { source: sourceEn });
  assert.ok(fallbackFindings.some((f) => f.rule === 'silent-fallback'));
});

test('auditDictionary: pronoun policy enforcement (Anda vs kamu)', () => {
  const formalCatalog = {
    welcome: 'Selamat datang di aplikasi Anda',
    error: 'Silakan periksa kata sandi Anda',
    slip: 'Masukkan alamat email kamu',
    encliticSlip: 'Silakan periksa kata sandimu',
    nonPronounMu: 'Ilmu pengetahuan untuk tamu berilmu yang bertamu, meramu jamu, dan menemu solusi',
  };

  const andaFindings = auditDictionary(formalCatalog, { pronoun: 'Anda' });
  const mismatches = andaFindings.filter((f) => f.rule === 'pronoun-mismatch');
  assert.equal(mismatches.length, 2);
  assert.ok(mismatches.some((f) => f.key === 'slip'));
  assert.ok(mismatches.some((f) => f.key === 'encliticSlip'));
  assert.ok(!mismatches.some((f) => f.key === 'nonPronounMu'));

  const casualCatalog = {
    welcome: 'Selamat datang di aplikasimu',
    error: 'Silakan periksa kata sandimu',
    formalSlip: 'Masukkan alamat email Anda',
  };

  const kamuFindings = auditDictionary(casualCatalog, { pronoun: 'kamu' });
  assert.equal(kamuFindings.filter((f) => f.rule === 'pronoun-mismatch').length, 1);
  assert.equal(kamuFindings.find((f) => f.rule === 'pronoun-mismatch').key, 'formalSlip');

  // Placeholders named after pronouns should not trigger false positive pronoun-mismatch
  const formalWithPlaceholder = {
    greeting: 'Halo {kamu}, silakan masukkan kata sandi Anda',
  };
  const formalPlFindings = auditDictionary(formalWithPlaceholder, { pronoun: 'Anda' });
  assert.equal(formalPlFindings.filter((f) => f.rule === 'pronoun-mismatch').length, 0);

  const casualWithPlaceholder = {
    greeting: 'Halo {Anda}, silakan masukkan kata sandimu',
  };
  const casualPlFindings = auditDictionary(casualWithPlaceholder, { pronoun: 'kamu' });
  assert.equal(casualPlFindings.filter((f) => f.rule === 'pronoun-mismatch').length, 0);

  // Lowercase "anda" should also be detected under casual policy
  const casualWithLowercaseAnda = {
    slip: 'Silakan periksa akun anda',
  };
  const lowercaseAndaFindings = auditDictionary(casualWithLowercaseAnda, { pronoun: 'kamu' });
  assert.equal(lowercaseAndaFindings.filter((f) => f.rule === 'pronoun-mismatch').length, 1);

  // URLs containing pronoun tokens should not trigger false positive pronoun-mismatch
  const formalWithUrl = {
    docs: 'Kunjungi https://example.com/user/kamu/reset-mu untuk mengatur ulang kata sandi Anda',
  };
  const formalUrlFindings = auditDictionary(formalWithUrl, { pronoun: 'Anda' });
  assert.equal(formalUrlFindings.filter((f) => f.rule === 'pronoun-mismatch').length, 0);

  const casualWithUrl = {
    docs: 'Kunjungi https://example.com/panduan-anda untuk panduan akunmu',
  };
  const casualUrlFindings = auditDictionary(casualWithUrl, { pronoun: 'kamu' });
  assert.equal(casualUrlFindings.filter((f) => f.rule === 'pronoun-mismatch').length, 0);
});

test('auditText: applies pronoun policy to prose and ignores inline code / placeholders', () => {
  const formalProse = 'Silakan masukkan kata sandi Anda. Gunakan perintah `git checkout kamu`.';
  assert.equal(auditText(formalProse, { pronoun: 'Anda' }).filter((f) => f.rule === 'pronoun-mismatch').length, 0);

  const formalProseWithUrl = 'Baca panduan di https://myjournal.app/v1/kamu untuk akun Anda.';
  assert.equal(auditText(formalProseWithUrl, { pronoun: 'Anda' }).filter((f) => f.rule === 'pronoun-mismatch').length, 0);

  const informalProse = 'Silakan masukkan kata sandimu di formulir.';
  const issues = auditText(informalProse, { pronoun: 'Anda' });
  assert.ok(issues.some((f) => f.rule === 'pronoun-mismatch'));

  const casualProse = 'Silakan periksa akun kamu. Jangan berikan kata sandi Anda.';
  const casualIssues = auditText(casualProse, { pronoun: 'kamu' });
  assert.ok(casualIssues.some((f) => f.rule === 'pronoun-mismatch'));
});

test('CLI: supports --source, --pronoun, and --register flags', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-cli-source-'));
  try {
    const sourcePath = path.join(tmpDir, 'en.json');
    const targetPath = path.join(tmpDir, 'id.json');

    fs.writeFileSync(
      sourcePath,
      JSON.stringify({
        calendar: { dayLabel: '{date}, {hasEntry}, {today}, {future}' },
        auth: { prompt: 'Enter your password' },
      }),
    );
    fs.writeFileSync(
      targetPath,
      JSON.stringify({
        calendar: { dayLabel: '{date}, {hasEntry}, {today}, {future}' },
        auth: { prompt: 'Masukkan kata sandi Anda' },
      }),
    );

    // 1. Should pass cleanly with --source and --register formal
    const resClean = spawnSync(
      process.execPath,
      [path.resolve('scripts/audit-id.js'), '--source', sourcePath, '--register', 'formal', targetPath],
      { encoding: 'utf8' },
    );
    assert.equal(resClean.status, 0);

    // 2. Should fail if --register casual is enforced (since text contains "Anda")
    const resCasual = spawnSync(
      process.execPath,
      [path.resolve('scripts/audit-id.js'), '--source', sourcePath, '--register', 'casual', targetPath],
      { encoding: 'utf8' },
    );
    assert.equal(resCasual.status, 1);
    assert.match(resCasual.stderr, /pronoun-mismatch/);

    // 3. Validates invalid --pronoun and --register values
    const resBadPronoun = spawnSync(
      process.execPath,
      [path.resolve('scripts/audit-id.js'), '--pronoun', 'invalid', targetPath],
      { encoding: 'utf8' },
    );
    assert.equal(resBadPronoun.status, 1);
    assert.match(resBadPronoun.stderr, /Invalid value for --pronoun/);

    const resBadRegister = spawnSync(
      process.execPath,
      [path.resolve('scripts/audit-id.js'), '--register', 'invalid', targetPath],
      { encoding: 'utf8' },
    );
    assert.equal(resBadRegister.status, 1);
    assert.match(resBadRegister.stderr, /Invalid value for --register/);

    // 4. Validates empty --source= operand
    const resEmptySource = spawnSync(
      process.execPath,
      [path.resolve('scripts/audit-id.js'), '--source=', targetPath],
      { encoding: 'utf8' },
    );
    assert.equal(resEmptySource.status, 1);
    assert.match(resEmptySource.stderr, /Missing value for --source/);

    // 5. Standalone markdown file with --pronoun Anda
    const mdPath = path.join(tmpDir, 'guide.md');
    fs.writeFileSync(mdPath, '# Panduan\n\nSilakan masukkan kata sandi kamu.\n');
    const resMd = spawnSync(
      process.execPath,
      [path.resolve('scripts/audit-id.js'), '--pronoun', 'Anda', mdPath],
      { encoding: 'utf8' },
    );
    assert.equal(resMd.status, 1);
    assert.match(resMd.stderr, /pronoun-mismatch/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('parseSimpleJsLocale: handles leading import statements and array-of-strings values', () => {
  const jsSource = `
    import { format } from './formatter';
    import { helperA, helperB } from '@shared/utils';

    export default {
      welcome: "Selamat datang",
      guidelines: [
        "Catat setiap latihanmu",
        "Gunakan beban yang sesuai"
      ]
    };
  `;

  const parsed = parseSimpleJsLocale(jsSource);
  assert.equal(parsed.welcome, 'Selamat datang');
  assert.deepEqual(parsed.guidelines, [
    'Catat setiap latihanmu',
    'Gunakan beban yang sesuai',
  ]);

  // auditDictionary audits array-of-strings
  const findings = auditDictionary(parsed);
  assert.equal(findings.length, 0);

  // auditDictionary catches calque traps inside array elements using source string
  const calqueArray = { nav: ['Punggung'] };
  const calqueSource = { nav: ['Back'] };
  const calqueFindings = auditDictionary(calqueArray, { source: calqueSource });
  assert.ok(calqueFindings.some((f) => f.rule === 'polysemy-calque' && f.key === 'nav.0'));

  // auditDictionary catches errors inside array elements
  const badParsed = {
    instructions: [
      'Silahkan masuk',
      'Di era digital yang serba cepat ini',
    ],
  };
  const badFindings = auditDictionary(badParsed);
  assert.ok(badFindings.some((f) => f.rule === 'kata-tidak-baku' && f.key === 'instructions.0'));
  assert.ok(badFindings.some((f) => f.rule === 'slop-or-pleonasm' && f.key === 'instructions.1'));

  // parseSimpleJsLocale rejects unseparated adjacent array items
  assert.throws(
    () => parseSimpleJsLocale('export default { items: ["Satu" "Dua"] };'),
    /Unsupported JS locale syntax in array/,
  );

  // parseSimpleJsLocale rejects unclosed array literals
  assert.throws(
    () => parseSimpleJsLocale('export default { items: ["Satu" };'),
    /Unterminated array literal/,
  );
});

test('parseSimpleJsLocale: ignores export declarations inside string literals', () => {
  const jsSource = `
    const example = "Type export default { fake: 'Palsu' } to start";
    module.exports = {
      real: "Teks asli"
    };
  `;
  const parsed = parseSimpleJsLocale(jsSource);
  assert.equal(parsed.real, 'Teks asli');
  assert.equal(parsed.fake, undefined);
});

test('parseSimpleJsLocale: prefers export default over preceding named exports', () => {
  const jsSource = `
    export const metadata = { title: "App Config" };
    export default {
      welcome: "Selamat datang"
    };
  `;
  const parsed = parseSimpleJsLocale(jsSource);
  assert.equal(parsed.welcome, 'Selamat datang');
  assert.equal(parsed.title, undefined);
});

test('auditDictionary: permits deficit quantifiers (kurang, masih kurang)', () => {
  const source = {
    weightDeficit: '{0} kg remaining',
    repsDeficit: '{count} reps needed',
  };
  const target = {
    weightDeficit: 'Kurang {0} kg lagi',
    repsDeficit: 'Masih kurang {count} repetisi',
  };

  const findings = auditDictionary(target, { source });
  assert.equal(findings.length, 0);
});

test('auditDictionary: permits eponymous/named concepts following Indonesian D-M word order ({0} formula -> Rumus {0})', () => {
  const eponymousCatalog = {
    '{0} formula': 'Rumus {0}',
    '{{0}} formula': 'Rumus {{0}}',
    '{0} law': 'Hukum {0}',
    '{0} theorem': 'Teorema {0}',
    '{0} formula: calculated from one set, not a tested max.':
      'Rumus {0}: dihitung dari satu set, bukan tes beban maksimal langsung.',
    '{0} equation - solution guide': 'Persamaan {0} - panduan solusi',
    '{0} theorem: proven in 1995': 'Teorema {0}: dibuktikan pada 1995',
    '{0} principle (physics)': 'Prinsip {0} (fisika)',
  };

  const findings = auditDictionary(eponymousCatalog);
  assert.equal(findings.length, 0);

  // Still flags when noun is a counted item rather than an eponymous concept
  const countCatalog = {
    '{0} models available': 'Model {0} tersedia',
    '{0} law available': 'Hukum {0} tersedia',
    '{0} formula(s) available': 'Rumus {0} tersedia',
  };
  const countFindings = auditDictionary(countCatalog);
  assert.equal(countFindings.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 3);

  // Mismatched English/Indonesian eponymous noun pair is not exempt
  const mismatchedCatalog = {
    '{0} law': 'Rumus {0}',
  };
  const mismatchFindings = auditDictionary(mismatchedCatalog);
  assert.ok(mismatchFindings.some((f) => f.rule === 'inverted-quantitative-placeholder'));
});

test('auditDictionary: flags weight plates (piringan beban), plate loading (pemuatan pelat), and work weight (beban kerja) calque traps', () => {
  const badFitnessCatalog = {
    Plates: 'Piringan beban',
    'Weight plates': 'Piringan beban',
    'Add plates': 'Tambahkan piringan',
    'Plate loading': 'Pemuatan pelat',
    'Plate loading (piringan)': 'Piringan beban',
    'Work weight': 'Beban kerja',
    'Working weight': 'Berat kerja',
  };
  const badFindings = auditDictionary(badFitnessCatalog);
  const polysemyFindings = badFindings.filter((f) => f.rule === 'polysemy-calque');
  assert.equal(polysemyFindings.length, 7);
  assert.ok(
    polysemyFindings.some((f) => f.key === 'Plate loading' && f.message.includes('use "Beban plat"')),
  );
  assert.ok(
    polysemyFindings.some((f) => f.key === 'Plate loading (piringan)' && f.message.includes('use "Beban plat"')),
  );
  assert.ok(
    polysemyFindings.some((f) => f.key === 'Add plates' && f.message.includes('use "Plat / Plat beban"')),
  );

  const goodFitnessCatalog = {
    Plates: 'Plat beban',
    'Weight plates': 'Plat beban',
    'Add plates': 'Tambahkan plat',
    'Plate loading': 'Beban plat',
    'Work weight': 'Beban set utama',
    'Working weight': 'Beban utama',
  };
  const goodFindings = auditDictionary(goodFitnessCatalog);
  assert.deepEqual(goodFindings, []);
});

test('auditDictionary: flags medical calque traps (patient discharge, stool sample, blood culture, OTC)', () => {
  const badMedicalCatalog = {
    'Patient discharge': 'Pemecatan pasien',
    'Discharge summary': 'Ringkasan pelepasan muatan',
    'Discharge instructions': 'Instruksi pemecatan',
    'Stool sample': 'Sampel bangku',
    'Stool test': 'Tes kursi',
    'Blood culture': 'Budaya darah',
    'Urine culture': 'Kebudayaan urine',
    'Over-the-counter': 'Di atas meja kasir',
    'Over the counter medicine': 'Obat di atas meja kasir',
    OTC: 'Di atas meja',
  };
  const badFindings = auditDictionary(badMedicalCatalog);
  const polysemyFindings = badFindings.filter((f) => f.rule === 'polysemy-calque');
  assert.equal(polysemyFindings.length, 10);

  const goodMedicalCatalog = {
    'Patient discharge': 'Pemulangan pasien',
    'Discharge summary': 'Ringkasan pulang',
    'Discharge instructions': 'Petunjuk kepulangan',
    'Stool sample': 'Sampel feses',
    'Stool test': 'Pemeriksaan tinja',
    'Blood culture': 'Kultur darah',
    'Urine culture': 'Kultur urine',
    'Over-the-counter': 'Obat bebas',
    'Over the counter medicine': 'Obat tanpa resep',
    OTC: 'Obat bebas (tanpa resep dokter)',
  };
  const goodFindings = auditDictionary(goodMedicalCatalog);
  assert.deepEqual(goodFindings, []);

  // Non-medical contexts (electrical discharge, battery discharge status, furniture stool) must not be falsely flagged
  const nonMedicalCatalog = {
    'Discharge current': 'Arus pelepasan muatan listrik',
    'Battery discharge': 'Pelepasan muatan baterai',
    'Battery discharge status': 'Status pelepasan muatan baterai',
    'Capacitor discharge rate': 'Laju pelepasan muatan kapasitor',
    'Electrostatic discharge': 'Pelepasan muatan elektrostatik',
    'Wooden stool': 'Bangku kayu',
    Stool: 'Kursi',
  };
  const nonMedicalFindings = auditDictionary(nonMedicalCatalog);
  assert.deepEqual(nonMedicalFindings, []);
});

test('auditText / auditDictionary: flags high-frequency medical kata tidak baku (diagnosa, apotik, nafas, cidera)', () => {
  const badText = 'Pasien mengalami cidera dan sesak nafas setelah datang ke apotik untuk diagnosa.';
  const findings = auditText(badText);
  const spellingFindings = findings.filter((f) => f.rule === 'kata-tidak-baku');
  assert.equal(spellingFindings.length, 4);
  assert.ok(spellingFindings.some((f) => f.message.includes('diagnosa') && f.message.includes('diagnosis')));
  assert.ok(spellingFindings.some((f) => f.message.includes('apotik') && f.message.includes('apotek')));
  assert.ok(spellingFindings.some((f) => f.message.includes('nafas') && f.message.includes('napas')));
  assert.ok(spellingFindings.some((f) => f.message.includes('cidera') && f.message.includes('cedera')));

  const goodText = 'Pasien mengalami cedera dan sesak napas setelah datang ke apotek untuk diagnosis.';
  const goodFindings = auditText(goodText);
  assert.deepEqual(goodFindings, []);
});

test('parseAndroidXmlLocale: parses strings, string-arrays, plurals, entities, and comments', () => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- App identity and simple strings -->
    <string name="app_name">My App</string>
    <string name="welcome_message">Halo &amp; Selamat Datang! &quot;Semoga harimu menyenangkan&quot;</string>
    <string name="escaped_apostrophe">It\'s time to workout</string>

    <!-- String Array -->
    <string-array name="exercise_categories">
        <item>Dada</item>
        <item>Punggung</item>
        <item>Kaki</item>
    </string-array>

    <!-- Plurals with nested quantities -->
    <plurals name="days_count">
        <item quantity="one">%d hari</item>
        <item quantity="other">%d hari</item>
    </plurals>

    <!-- CDATA handling -->
    <string name="terms_html"><![CDATA[Silakan baca <b>Syarat & Ketentuan</b> kami.]]></string>
</resources>`;

  const dict = parseAndroidXmlLocale(xml);

  assert.equal(dict.app_name, 'My App');
  assert.equal(dict.welcome_message, 'Halo & Selamat Datang! "Semoga harimu menyenangkan"');
  assert.equal(dict.escaped_apostrophe, "It's time to workout");
  assert.deepEqual(dict.exercise_categories, ['Dada', 'Punggung', 'Kaki']);
  assert.deepEqual(dict.days_count, {
    one: '%d hari',
    other: '%d hari',
  });
  assert.equal(dict.terms_html, 'Silakan baca <b>Syarat & Ketentuan</b> kami.');

  // Numeric entities (decimal and hex) and single-pass decoding without double-expansion
  const numericXml = `<resources>
    <string name="percent">Diskon 50&#37;&#10;Hemat &#x27;banyak&#x27;</string>
    <string name="literal_entity">&amp;#37;</string>
    <string name="doubly_encoded">&amp;amp;#37;</string>
  </resources>`;
  const numericDict = parseAndroidXmlLocale(numericXml);
  assert.equal(numericDict.percent, "Diskon 50%\nHemat 'banyak'");
  assert.equal(numericDict.literal_entity, '&#37;');
  assert.equal(numericDict.doubly_encoded, '&amp;#37;');

  // Rejects malformed / unclosed tags and unclosed comments
  assert.throws(
    () => parseAndroidXmlLocale('<resources><string name="foo">bar</resources>'),
    /mismatched <string> tags/i,
  );
  assert.throws(
    () => parseAndroidXmlLocale('<resources><!-- unclosed comment<string name="foo">bar</string></resources>'),
    /unclosed XML comment/i,
  );
  assert.throws(
    () => parseAndroidXmlLocale('<string name="foo">no root</string>'),
    /document must contain a single root <resources> element/i,
  );
  assert.throws(
    () => parseAndroidXmlLocale('<resources></resources>\n<string name="title">Hello</string>'),
    /document must contain a single root <resources> element enclosing all entries/i,
  );
  assert.throws(
    () => parseAndroidXmlLocale('<resources><resources><string name="title">Nested</string></resources></resources>'),
    /nested or multiple <resources> elements are not allowed/i,
  );

  // Preserves comment markers inside CDATA while stripping outside comments
  const cdataCommentXml = `<resources>
    <!-- outer comment before -->
    <string name="cdata_comment"><![CDATA[<!-- not an xml comment -->]]></string>
    <!-- outer comment after -->
  </resources>`;
  const cdataDict = parseAndroidXmlLocale(cdataCommentXml);
  assert.equal(cdataDict.cdata_comment, '<!-- not an xml comment -->');

  // Normalizes self-closing entries and ensures subsequent regular entries parse correctly
  const selfClosingXml = `<resources>
    <string name="empty_flag"/>
    <string name="regular_string">Halo Dunia</string>
    <string-array name="empty_items"/>
    <string-array name="regular_array">
      <item>Satu</item>
      <item>Dua</item>
    </string-array>
    <plurals name="empty_plurals"/>
    <plurals name="regular_plurals">
      <item quantity="one">%d item</item>
      <item quantity="other">%d item</item>
    </plurals>
  </resources>`;
  const selfClosingDict = parseAndroidXmlLocale(selfClosingXml);
  assert.equal(selfClosingDict.empty_flag, '');
  assert.equal(selfClosingDict.regular_string, 'Halo Dunia');
  assert.deepEqual(selfClosingDict.empty_items, []);
  assert.deepEqual(selfClosingDict.regular_array, ['Satu', 'Dua']);
  assert.deepEqual(selfClosingDict.empty_plurals, {});
  assert.deepEqual(selfClosingDict.regular_plurals, { one: '%d item', other: '%d item' });

  // Validates child tag structure and rejects unclosed/malformed items in string-array and plurals
  assert.throws(
    () => parseAndroidXmlLocale('<resources><string-array name="colors"><item>Red<item>Blue</item></string-array></resources>'),
    /mismatched <item> tags in <string-array name="colors">/i,
  );
  assert.throws(
    () => parseAndroidXmlLocale('<resources><string-array name="colors"><item>Red</item>unexpected content</string-array></resources>'),
    /malformed or unconsumed content in <string-array name="colors">/i,
  );
  assert.throws(
    () => parseAndroidXmlLocale('<resources><plurals name="days"><item quantity="one">1 day</plurals></resources>'),
    /mismatched <item> tags in <plurals name="days">/i,
  );
  assert.throws(
    () => parseAndroidXmlLocale('<resources><plurals name="days"><item>missing quantity attribute</item></plurals></resources>'),
    /malformed or unconsumed content in <plurals name="days">/i,
  );
});

test('parseIosStringsLocale: parses Apple .strings with comments and escaped quotes', () => {
  const stringsContent = `
/* Navigation actions */
"action_cancel" = "Batal";
"action_save" = "Simpan";

// Dialog confirmations
"dialog_confirm" = "Tekan \\"Lanjutkan\\" untuk memulai sesi latihan.";

/*
 Multi-line comment block
 describing settings keys
 */
"settings_title" = "Pengaturan Profil";
"api_url" = "https://api.example.com//v1/endpoint";
"code_banner" = "/* Kode Kupon */";
`;

  const dict = parseIosStringsLocale(stringsContent);

  assert.equal(dict.action_cancel, 'Batal');
  assert.equal(dict.action_save, 'Simpan');
  assert.equal(dict.dialog_confirm, 'Tekan "Lanjutkan" untuk memulai sesi latihan.');
  assert.equal(dict.settings_title, 'Pengaturan Profil');
  assert.equal(dict.api_url, 'https://api.example.com//v1/endpoint');
  assert.equal(dict.code_banner, '/* Kode Kupon */');

  // Rejects unclosed comments and malformed entries
  assert.throws(
    () => parseIosStringsLocale('/* unclosed block\n"k" = "v";'),
    /unclosed block comment/i,
  );
  assert.throws(
    () => parseIosStringsLocale('"unterminated_key'),
    /unterminated string key/i,
  );
  assert.throws(
    () => parseIosStringsLocale('"k" = "missing semicolon"'),
    /expected ';'/i,
  );
  assert.throws(
    () => parseIosStringsLocale('"k" = "v"; unexpected garbage here'),
    /unexpected content near/i,
  );

  // Decodes Apple .strings Unicode escapes (\Uxxxx) in both keys and values
  const unicodeStrings = `
"key_\\U00E9" = "Halo\\U00A0Dunia";
"emoji_\\UD83D\\UDE00" = "Senyum \\UD83D\\UDE00!";
"literal_escape" = "\\\\U00E9";
`;
  const unicodeDict = parseIosStringsLocale(unicodeStrings);
  assert.equal(unicodeDict['key_é'], 'Halo\u00A0Dunia');
  assert.equal(unicodeDict['emoji_😀'], 'Senyum 😀!');
  assert.equal(unicodeDict.literal_escape, '\\U00E9');
});

test('auditDictionary: permits language picker autonyms and locale tags', () => {
  const languagePicker = {
    lang_id: 'Bahasa Indonesia (ID)',
    lang_ms: 'Bahasa Melayu',
    lang_en: 'English (US)',
    locale_code: 'id-ID',
  };
  const findings = auditDictionary(languagePicker);
  assert.equal(findings.filter((f) => f.rule === 'silent-fallback').length, 0);
});

test('auditDictionary: ignores keys matching exact string or wildcard prefix', () => {
  const source = {
    'app.name': 'My App Fallback Here',
    'nav.Back': 'Back',
    'picker.one': 'English Fallback Long',
    'picker.two': 'Another Long Fallback',
  };
  const target = {
    'app.name': 'My App Fallback Here',
    'nav.Back': 'Punggung',
    'picker.one': 'English Fallback Long',
    'picker.two': 'Another Long Fallback',
  };
  const findings = auditDictionary(target, {
    source,
    ignoreKeys: ['nav.Back', 'picker.*'],
  });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].key, 'app.name');
});

test('CLI: supports .xml and .strings catalogs, --ignore-keys, and --warn-only', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'il-native-'));
  const xmlSource = path.join(tmpDir, 'strings_en.xml');
  const xmlTarget = path.join(tmpDir, 'strings_id.xml');
  const stringsSource = path.join(tmpDir, 'en.strings');
  const stringsTarget = path.join(tmpDir, 'id.strings');

  fs.writeFileSync(
    xmlSource,
    `<resources>
       <string name="title">Welcome</string>
       <plurals name="days">
         <item quantity="one">%d day</item>
         <item quantity="other">%d days</item>
       </plurals>
     </resources>`,
  );

  fs.writeFileSync(
    xmlTarget,
    `<resources>
       <string name="title">Selamat Datang</string>
       <plurals name="days">
         <item quantity="one">%d hari</item>
         <item quantity="other">%d hari</item>
       </plurals>
     </resources>`,
  );

  fs.writeFileSync(stringsSource, '"action_cancel" = "Cancel";\n"Back" = "Back";\n');
  fs.writeFileSync(stringsTarget, '"action_cancel" = "Batal";\n"Back" = "Punggung";\n');

  const scriptPath = path.resolve('scripts/audit-id.js');

  const xmlResult = spawnSync(process.execPath, [scriptPath, '--source', xmlSource, xmlTarget], {
    encoding: 'utf8',
  });
  assert.equal(xmlResult.status, 0);

  const stringsIgnored = spawnSync(
    process.execPath,
    [scriptPath, '--source', stringsSource, '--ignore-keys', 'Back', stringsTarget],
    { encoding: 'utf8' },
  );
  assert.equal(stringsIgnored.status, 0);

  const stringsFail = spawnSync(
    process.execPath,
    [scriptPath, '--source', stringsSource, stringsTarget],
    { encoding: 'utf8' },
  );
  assert.equal(stringsFail.status, 1);
  assert.match(stringsFail.stderr, /\[polysemy-calque\]/);
  assert.match(stringsFail.stderr, /\[terminology\]/);

  const stringsWarn = spawnSync(
    process.execPath,
    [scriptPath, '--source', stringsSource, '--warn-only', stringsTarget],
    { encoding: 'utf8' },
  );
  assert.equal(stringsWarn.status, 0);
  assert.match(stringsWarn.stderr, /\[polysemy-calque\]/);

  // Operational error: non-existent file must still exit with status 1 even with --warn-only
  const missingFileResult = spawnSync(
    process.execPath,
    [scriptPath, '--warn-only', path.join(tmpDir, 'does-not-exist.json')],
    { encoding: 'utf8' },
  );
  assert.equal(missingFileResult.status, 1);
  assert.match(missingFileResult.stderr, /Error reading/);

  // Operational error: malformed syntax must still exit with status 1 even with --warn-only
  const malformedFile = path.join(tmpDir, 'malformed.strings');
  fs.writeFileSync(malformedFile, 'not a valid strings file');
  const malformedResult = spawnSync(
    process.execPath,
    [scriptPath, '--warn-only', malformedFile],
    { encoding: 'utf8' },
  );
  assert.equal(malformedResult.status, 1);
  assert.match(malformedResult.stderr, /Error parsing/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('auditDictionary: flags v1.2.1 assistance machines, prepositional unit headers, and hold cues traps', () => {
  const badDict = {
    'On an assistance machine': 'Pada mesin bantuan',
    'Lengths in': '  Panjang dalam  ',
    'Weights in': ' Beban dalam ',
    'Distance in': '  Jarak dalam',
    'End of a hold': 'Akhir tahanan',
    'App stores': '  App stores  ',
    'app store': 'app store',
    'App store': '  Toko App  ',
    'App Store': '  Toko aplikasi  ',
  };
  const findings = auditDictionary(badDict);
  const polysemyFindings = findings.filter((f) => f.rule === 'polysemy-calque');
  assert.equal(polysemyFindings.length, 9);

  const goodDict = {
    'On an assistance machine': 'Pada mesin assisted',
    'Assisted machine': 'Mesin berbeban bantuan',
    'Lengths in': 'Satuan panjang',
    'Lengths in (alt)': 'Satuan ukuran',
    'Weights in': 'Satuan beban',
    'Distance in': 'Satuan jarak',
    'End of a hold': 'Akhir durasi tahan',
    'End of a hold (alt)': 'Waktu tahan selesai',
    'App stores': 'Toko aplikasi',
    'app store': 'toko aplikasi',
    'App Store': 'App Store', // Apple proper noun preserved
    'App Store (padded)': '  App Store  ', // Retained brand with whitespace preserved
    'Google Play Store': 'Google Play Store', // Retained brand preserved
    'Google Play Store (padded)': '  Google Play Store  ', // Retained brand with whitespace preserved
    'docs_url': '  https://example.com/docs/long-untranslated-slug  ', // Whitespace-padded URL preserved
    'Lengths in {0}': 'Panjang dalam {0}', // Complete phrase with object preserved
    'Weights in {0}': 'Beban dalam {0}', // Complete phrase with object preserved
  };
  const goodFindings = auditDictionary(goodDict);
  assert.deepEqual(goodFindings, []);

  // Disambiguation via source text:
  // When source is 'App Store' (even with surrounding whitespace), value 'App Store' is valid Apple brand and must not be flagged
  const sourceDisambigClean = auditDictionary(
    { 'app store': 'App Store' },
    { source: { 'app store': ' App Store ' } }
  );
  assert.deepEqual(sourceDisambigClean, []);

  // When key or source is Apple 'App Store' (even with surrounding whitespace), translating brand to 'Toko aplikasi' or 'toko app' is flagged
  const sourceDisambigBanned = auditDictionary(
    { 'apple_store_key': 'Toko aplikasi' },
    { source: { 'apple_store_key': '  App Store  ' } }
  );
  assert.equal(
    sourceDisambigBanned.filter((f) => f.rule === 'polysemy-calque').length,
    1
  );

  // Reverse disambiguation: when source is generic 'app store' (even with surrounding whitespace), translated value 'Toko aplikasi' is permitted even if key is 'App Store'
  const reverseDisambigClean = auditDictionary(
    { 'App Store': 'Toko aplikasi' },
    { source: { 'App Store': '  app store  ' } }
  );
  assert.deepEqual(reverseDisambigClean, []);

  // URL fallback exemption: padded URL value matching unpadded source string exercises the regex test on trimmedVal
  const urlExemptionClean = auditDictionary(
    { docs_url: '  https://example.com/docs/long-untranslated-slug  ' },
    { source: { docs_url: 'https://example.com/docs/long-untranslated-slug' } }
  );
  assert.deepEqual(urlExemptionClean, []);
});

test('auditDictionary: bounds per-value findings to MAX_DICTIONARY_FINDINGS and appends findings-limit-exceeded', () => {
  const findings = auditDictionary({
    huge: 'silahkan '.repeat(5100),
    next: 'silahkan',
  });
  assert.equal(findings.length, 5001);
  assert.equal(findings[5000].rule, 'findings-limit-exceeded');
  assert.equal(findings.filter((f) => f.rule === 'kata-tidak-baku').length, 5000);
});
