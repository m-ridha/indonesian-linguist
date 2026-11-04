const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { generateSpaceEngine } = require('../scripts/build-space-engine.js');

test('space/engine.bundle.js is synchronized with scripts/audit-id.js', () => {
  const expected = generateSpaceEngine();
  const bundlePath = path.join(__dirname, '..', 'space', 'engine.bundle.js');
  assert.ok(fs.existsSync(bundlePath), 'space/engine.bundle.js must exist');
  const actual = fs.readFileSync(bundlePath, 'utf8');
  assert.strictEqual(actual, expected, 'space/engine.bundle.js must match generator output');
});

test('engine.analyze: routes JSON vs prose and respects malformed JSON error boundary', async () => {
  const bundleUrl = pathToFileURL(path.join(__dirname, '..', 'space', 'engine.bundle.js')).href;
  const engine = await import(bundleUrl);

  // 1. Prose input
  const proseRes = engine.analyze('Mohon silahkan dicatat aktifitas hari ini.');
  assert.strictEqual(proseRes.mode, 'prose');
  assert.strictEqual(proseRes.valid, true);
  assert.ok(proseRes.findings.length >= 2);
  assert.match(proseRes.cleanText, /silakan/);
  assert.match(proseRes.cleanText, /aktivitas/);

  // 2. Valid JSON input
  const validJson = JSON.stringify({ Back: 'punggung', note: 'silahkan masuk' }, null, 2);
  const jsonRes = engine.analyze(validJson);
  assert.strictEqual(jsonRes.mode, 'json');
  assert.strictEqual(jsonRes.valid, true);
  assert.strictEqual(jsonRes.error, null);
  assert.ok(jsonRes.findings.some((f) => f.rule === 'polysemy-calque'));
  assert.ok(jsonRes.findings.some((f) => f.rule === 'kata-tidak-baku'));
  assert.match(jsonRes.cleanText, /"note": "silakan masuk"/);

  // 3. Malformed JSON starting with { or [ must not silently fall back to prose
  const malformedJson = '{\n  "title": "Unfinished JSON\n';
  const badRes = engine.analyze(malformedJson);
  assert.strictEqual(badRes.mode, 'json');
  assert.strictEqual(badRes.valid, false);
  assert.ok(typeof badRes.error === 'string' && badRes.error.length > 0);
  assert.strictEqual(badRes.findings.length, 0);
});

test('engine.applyBatchFixes: applies multiple replacements in reverse order without offset drift', async () => {
  const bundleUrl = pathToFileURL(path.join(__dirname, '..', 'space', 'engine.bundle.js')).href;
  const engine = await import(bundleUrl);

  const input = 'Mohon silahkan cek aktifitas di era digital ini, silahkan coba lagi.';
  const analysis = engine.analyzeText(input);

  assert.ok(analysis.findings.length >= 3);
  const highConfidenceFindings = analysis.findings.filter((f) => f.confidence === 'high');
  // At least 2x "silahkan" + 1x "aktifitas"
  assert.strictEqual(highConfidenceFindings.length, 3);

  const fixed = engine.applyBatchFixes(input, highConfidenceFindings);
  assert.strictEqual(
    fixed,
    'Mohon silakan cek aktivitas di era digital ini, silakan coba lagi.'
  );
});

test('engine.analyzeText: masks markdown code and links preserving 1:1 character coordinates', async () => {
  const bundleUrl = pathToFileURL(path.join(__dirname, '..', 'space', 'engine.bundle.js')).href;
  const engine = await import(bundleUrl);

  const textWithCode = 'Buka `silahkan` lalu https://example.com/silahkan dan silahkan atur.';
  const res = engine.analyzeText(textWithCode);

  // Only the third 'silahkan' outside inline code and url should be flagged
  assert.strictEqual(res.findings.length, 1);
  const issue = res.findings[0];
  assert.strictEqual(issue.original, 'silahkan');
  assert.strictEqual(issue.startIndex, textWithCode.lastIndexOf('silahkan'));
  assert.strictEqual(
    textWithCode.slice(issue.startIndex, issue.endIndex),
    'silahkan'
  );
});

test('engine.analyze: auto-detects JSON key-value snippets without outer braces', async () => {
  const bundleUrl = pathToFileURL(path.join(__dirname, '..', 'space', 'engine.bundle.js')).href;
  const engine = await import(bundleUrl);

  const snippet = [
    '"Not in \\"{0}\\": {1} more": "Tidak ada di \\"{0}\\": {1} lagi",',
    '"On an assistance machine": "Di mesin bantuan tiap set mendapat bantuan",',
    '"Back": "punggung"',
  ].join('\n');

  const res = engine.analyze(snippet);
  assert.strictEqual(res.mode, 'json');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.isSnippet, true);
  assert.ok(res.findings.some((f) => f.rule === 'polysemy-calque' && f.message.includes('mesin assisted')));
  assert.ok(res.findings.some((f) => f.rule === 'polysemy-calque' && f.message.includes('Kembali')));

  // Malformed snippet starting with key-value syntax must flag JSON syntax error, never fall back to clean prose
  const malformedSnippet = '"Back": "punggung",\n"Missing quote: value';
  const badSnippetRes = engine.analyze(malformedSnippet);
  assert.strictEqual(badSnippetRes.mode, 'json');
  assert.strictEqual(badSnippetRes.valid, false);
  assert.ok(typeof badSnippetRes.error === 'string' && badSnippetRes.error.length > 0);
  assert.strictEqual(badSnippetRes.findings.length, 0);

  // Manual mode override forces prose or json
  const forcedProse = engine.analyze(snippet, { mode: 'prose' });
  assert.strictEqual(forcedProse.mode, 'prose');

  const forcedJson = engine.analyze('{"Back": "punggung"}', { mode: 'json' });
  assert.strictEqual(forcedJson.mode, 'json');

  // Verify cleanText preserves trailing comma on snippets that ended with a comma
  const snippetWithComma = '"welcome": "Silahkan masuk",\n"status": "aktif",';
  const commaRes = engine.analyze(snippetWithComma);
  assert.strictEqual(commaRes.isSnippet, true);
  assert.ok(commaRes.cleanText.trimEnd().endsWith(','));
  assert.match(commaRes.cleanText, /"welcome": "Silakan masuk",/);

  // Snippets without trailing comma do not gain an unwanted trailing comma
  const snippetWithoutComma = '"welcome": "Silahkan masuk"';
  const noCommaRes = engine.analyze(snippetWithoutComma);
  assert.strictEqual(noCommaRes.cleanText.trimEnd().endsWith(','), false);

  // Verify snippet regex whitespace tolerance and prose colon discrimination
  assert.strictEqual(engine.isKeyValueSnippet('  "Back"   : "punggung"'), true);
  assert.strictEqual(engine.isKeyValueSnippet('Catatan: silahkan periksa jadwal latihan.'), false);

  const proseWithColon = engine.analyze('Catatan: silahkan periksa jadwal latihan.');
  assert.strictEqual(proseWithColon.mode, 'prose');
  assert.strictEqual(proseWithColon.valid, true);
  assert.ok(proseWithColon.findings.some((f) => f.rule === 'kata-tidak-baku' && f.original === 'silahkan'));

  // Verify markdown prose containing a fenced code block with key-value syntax is not misrouted
  const proseWithFencedJson = [
    '# Panduan Penggunaan',
    '',
    'Berikut contoh konfigurasi:',
    '```json',
    '"Back": "punggung"',
    '```',
    'Mohon periksa kembali jadwal Anda.',
  ].join('\n');
  assert.strictEqual(engine.isKeyValueSnippet(proseWithFencedJson), false);
  const fencedProseRes = engine.analyze(proseWithFencedJson);
  assert.strictEqual(fencedProseRes.mode, 'prose');
  assert.strictEqual(fencedProseRes.valid, true);
});
