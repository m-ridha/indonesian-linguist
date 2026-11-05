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

test('engine.analyze: applies pronoun policy to one audited surface at a time', async () => {
  const bundleUrl = pathToFileURL(path.join(__dirname, '..', 'space', 'engine.bundle.js')).href;
  const engine = await import(bundleUrl);

  const formal = engine.analyze('Silakan periksa akun Anda.', { pronoun: 'Anda' });
  const casual = engine.analyze('Silakan periksa akunmu.', { pronoun: 'kamu' });
  assert.equal(formal.findings.some((finding) => finding.rule === 'pronoun-mismatch'), false);
  assert.equal(casual.findings.some((finding) => finding.rule === 'pronoun-mismatch'), false);

  const mixed = engine.analyze('Silakan periksa akun Anda. Periksa akunmu juga.', { pronoun: 'Anda' });
  assert.ok(mixed.findings.some((finding) => finding.rule === 'pronoun-mismatch'));
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

  // Verify fixJsonValues preserves own __proto__ keys without prototype pollution
  const protoJson = '{\n  "__proto__": "silahkan masuk",\n  "key": "aktifitas"\n}';
  const protoRes = engine.analyze(protoJson);
  assert.strictEqual(protoRes.valid, true);
  assert.match(protoRes.cleanText, /"__proto__":\s*"silakan masuk"/);
  assert.match(protoRes.cleanText, /"key":\s*"aktivitas"/);

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

  // Markdown links and placeholder-headed text route to prose in auto-detect mode
  const mdLinkInput = '[Panduan](https://example.com)\nSilahkan masuk.';
  const mdLinkRes = engine.analyze(mdLinkInput);
  assert.strictEqual(mdLinkRes.mode, 'prose');
  assert.strictEqual(mdLinkRes.valid, true);
  assert.ok(mdLinkRes.findings.some((f) => f.original.toLowerCase() === 'silahkan'));

  const placeholderInput = '{0} minggu beruntun\nSilahkan coba lagi.';
  const placeholderRes = engine.analyze(placeholderInput);
  assert.strictEqual(placeholderRes.mode, 'prose');
  assert.strictEqual(placeholderRes.valid, true);
  assert.ok(placeholderRes.findings.some((f) => f.original.toLowerCase() === 'silahkan'));

  // Double-brace template placeholders route to prose (even when followed by colon)
  const doubleBraceInput = '{{name}} silahkan masuk.';
  const doubleBraceRes = engine.analyze(doubleBraceInput);
  assert.strictEqual(doubleBraceRes.mode, 'prose');
  assert.strictEqual(doubleBraceRes.valid, true);
  assert.ok(doubleBraceRes.findings.some((f) => f.original.toLowerCase() === 'silahkan'));

  const doubleBraceColon = '{{name}}: silahkan masuk.';
  const doubleBraceColonRes = engine.analyze(doubleBraceColon);
  assert.strictEqual(doubleBraceColonRes.mode, 'prose');
  assert.strictEqual(doubleBraceColonRes.valid, true);
  assert.ok(doubleBraceColonRes.findings.some((f) => f.original.toLowerCase() === 'silahkan'));

  // Single-brace placeholder followed by colon is treated as JSON/object key
  const singleBraceColon = '{name}: "val"';
  const singleBraceColonRes = engine.analyze(singleBraceColon);
  assert.strictEqual(singleBraceColonRes.mode, 'json');

  // Markdown links followed by em dashes or words are not over-masked
  const linkWithEmDash = '[Panduan](https://example.com)—silahkan catat';
  const linkRes = engine.analyze(linkWithEmDash);
  assert.strictEqual(linkRes.mode, 'prose');
  assert.ok(linkRes.findings.some((f) => f.original.toLowerCase() === 'silahkan'));
  assert.ok(linkRes.findings.some((f) => f.rule === 'slop-or-pleonasm' && f.message.includes('em dash')));

  // Em dashes inside Markdown destination are preserved and not flagged/changed
  const linkWithInnerEmDash = '[Panduan](https://example.com/berita—resiko) silahkan catat';
  const linkInnerRes = engine.analyze(linkWithInnerEmDash);
  assert.strictEqual(linkInnerRes.findings.some((f) => f.original === 'resiko'), false);
  assert.ok(linkInnerRes.findings.some((f) => f.original.toLowerCase() === 'silahkan'));

  // Em dashes inside Markdown reference-link definition are preserved and not flagged/changed
  const refLinkWithInnerEmDash = '[panduan]: https://example.com/berita—resiko\n\nSilahkan catat.';
  const refLinkInnerRes = engine.analyze(refLinkWithInnerEmDash);
  assert.strictEqual(refLinkInnerRes.findings.some((f) => f.original === 'resiko'), false);
  assert.ok(refLinkInnerRes.findings.some((f) => f.original.toLowerCase() === 'silahkan'));
  assert.strictEqual(refLinkInnerRes.cleanText, '[panduan]: https://example.com/berita—resiko\n\nSilakan catat.');

  // Bare URL followed by em dash stops URL mask at em dash so both em dash and following errors are caught
  const bareUrlWithEmDash = 'Kunjungi https://example.com—silahkan catat.';
  const bareUrlEmDashRes = engine.analyze(bareUrlWithEmDash);
  assert.strictEqual(bareUrlEmDashRes.mode, 'prose');
  assert.ok(bareUrlEmDashRes.findings.some((f) => f.rule === 'slop-or-pleonasm' && f.message.includes('em dash')));
  assert.ok(bareUrlEmDashRes.findings.some((f) => f.original.toLowerCase() === 'silahkan'));
  assert.strictEqual(bareUrlEmDashRes.cleanText, 'Kunjungi https://example.com—silakan catat.');

  // Nested parentheses in URLs are completely masked without exposing inner tokens
  const nestedParenUrl = 'https://example.com/topik(resiko_(contoh)) silahkan catat';
  const nestedParenRes = engine.analyze(nestedParenUrl);
  assert.strictEqual(nestedParenRes.findings.some((f) => f.original === 'resiko'), false);
  assert.strictEqual(nestedParenRes.findings.some((f) => f.original === 'contoh'), false);
  assert.ok(nestedParenRes.findings.some((f) => f.original.toLowerCase() === 'silahkan'));
  assert.match(nestedParenRes.cleanText, /https:\/\/example\.com\/topik\(resiko_\(contoh\)\)/);

  // Balanced parentheses in URLs are masked without consuming closing Markdown delimiter
  const linkWithParenUrl = '[Panduan](https://example.com/(resiko))—silahkan catat';
  const linkParenRes = engine.analyze(linkWithParenUrl);
  assert.strictEqual(linkParenRes.findings.some((f) => f.original === 'resiko'), false);
  assert.ok(linkParenRes.findings.some((f) => f.original.toLowerCase() === 'silahkan'));

  // Large numbers (> MAX_SAFE_INTEGER) in JSON are preserved without precision loss in cleanText
  const bigNumJson = '{\n  "id": 9007199254740993,\n  "note": "silahkan catat"\n}';
  const bigNumRes = engine.analyze(bigNumJson);
  assert.strictEqual(bigNumRes.mode, 'json');
  assert.strictEqual(bigNumRes.valid, true);
  assert.match(bigNumRes.cleanText, /"id":\s*9007199254740993/);
  assert.match(bigNumRes.cleanText, /"note":\s*"silakan catat"/);

  // Uppercase HTTPS and parentheses in URLs are masked without modifying URL
  const urlProse = 'Kunjungi HTTPS://example.com/(resiko) dan https://example.com/resiko disini.';
  const urlRes = engine.analyze(urlProse);
  assert.strictEqual(urlRes.mode, 'prose');
  assert.strictEqual(urlRes.findings.some((f) => f.original === 'resiko'), false);
  assert.ok(urlRes.findings.some((f) => f.original === 'disini'));

  // Pronoun policy finding messages do not repeat full text
  const longText = 'Silakan periksa akun kamu. '.repeat(10);
  const pronounRes = engine.analyze(longText, { pronoun: 'Anda' });
  for (const f of pronounRes.findings) {
    assert.strictEqual(f.message.includes(longText), false);
    assert.match(f.message, /Informal pronoun "kamu" found/);
  }

  // Prose findings are capped at MAX_PROSE_FINDINGS (default 5000) or caller-specified maxFindings
  const hugeProse = 'silahkan '.repeat(5100);
  const cappedProseRes = engine.analyze(hugeProse);
  assert.strictEqual(cappedProseRes.findings.length, engine.MAX_PROSE_FINDINGS);
  assert.strictEqual(cappedProseRes.stats.totalFindings, engine.MAX_PROSE_FINDINGS);

  const customCapRes = engine.analyze(hugeProse, { maxFindings: 25 });
  assert.strictEqual(customCapRes.findings.length, 25);
  assert.strictEqual(customCapRes.stats.totalFindings, 25);
  assert.strictEqual(cappedProseRes.stats.isCapped, true);
  assert.strictEqual(engine.analyze('silahkan masuk').stats.isCapped, false);

  // Snippet with a nested value followed by a second key keeps key semantics
  const nestedSnippet = engine.analyze('"a": {"x": "ok"},\n"silahkan": "silahkan masuk"');
  assert.strictEqual(nestedSnippet.mode, 'json');
  assert.strictEqual(nestedSnippet.isSnippet, true);
  assert.match(nestedSnippet.cleanText, /"silahkan": "silakan masuk"/);

  // JSON cleaning is bounded to the audited scope when the finding limit is reached
  const bigCatalog = {};
  for (let i = 0; i < 5005; i++) bigCatalog['k' + i] = 'silahkan';
  const cappedJsonRes = engine.analyze(JSON.stringify(bigCatalog, null, 2));
  assert.strictEqual(cappedJsonRes.stats.isCapped, true);
  const cleanedCatalog = JSON.parse(cappedJsonRes.cleanText);
  assert.strictEqual(cleanedCatalog.k4999, 'silakan');
  assert.strictEqual(cleanedCatalog.k5000, 'silahkan');
  assert.strictEqual(cleanedCatalog.k5004, 'silahkan');

  // A value that was only partially audited before the cap is cleaned only for its recorded finding
  const partialCatalog = {};
  for (let i = 0; i < 4999; i++) partialCatalog['k' + i] = 'silahkan';
  partialCatalog.last = 'silahkan dan aktifitas';
  const partialRes = engine.analyze(JSON.stringify(partialCatalog, null, 2));
  assert.strictEqual(partialRes.stats.isCapped, true);
  assert.strictEqual(JSON.parse(partialRes.cleanText).last, 'silakan dan aktifitas');

  // A literal dotted key and a nested path share a keyPath identity, so ambiguous scopes are skipped
  const collisionCatalog = {};
  for (let i = 0; i < 4999; i++) collisionCatalog['k' + i] = 'silahkan';
  collisionCatalog.p = { 'a.b': 'silahkan', a: { b: 'silahkan' } };
  const collisionRes = engine.analyze(JSON.stringify(collisionCatalog, null, 2));
  assert.strictEqual(collisionRes.stats.isCapped, true);
  const collisionValue = JSON.parse(collisionRes.cleanText).p;
  assert.strictEqual(collisionValue['a.b'], 'silahkan');
  assert.strictEqual(collisionValue.a.b, 'silahkan');
});
