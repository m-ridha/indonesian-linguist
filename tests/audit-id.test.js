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
  truncateToUtf8ByteLimit,
} = require('../scripts/audit-id');

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

  // Correct: quantity placeholder precedes noun
  const correct1 = auditDictionary({ '{0} sets unchecked': '{0} set belum dicentang' });
  assert.equal(correct1.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  const correct2 = auditDictionary({ '{0} sets unchecked': 'Sebanyak {0} set belum dicentang' });
  assert.equal(correct2.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  // Multiword permitted quantifiers like "Tersisa sekitar"
  const correct3 = auditDictionary({ '{0} sets left': 'Tersisa sekitar {0} set' });
  assert.equal(correct3.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  // Count placeholder precedes its noun after a verb / predicate: valid
  const correct4 = auditDictionary({ '{{0}} files deleted': 'Dihapus {{0}} file' });
  assert.equal(correct4.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

  const correct5 = auditDictionary({ '{0} photos deleted': 'Dihapus {0} foto' });
  assert.equal(correct5.filter((f) => f.rule === 'inverted-quantitative-placeholder').length, 0);

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
