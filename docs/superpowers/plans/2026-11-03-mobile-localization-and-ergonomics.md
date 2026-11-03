# Mobile Localization & Auditor Ergonomics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add zero-dependency Android `strings.xml` and iOS `.strings` parsing, language autonym whitelisting, CLI `--ignore-keys` / `--warn-only` flags, rule categorization, and clause-aware linguistic documentation.

**Architecture:** Extend `scripts/audit-id.js` with regex/token-based scanners for Android XML and iOS strings, preserving nested plurals and arrays. Enhance `auditDictionary` with autonym allowlisting, key-based ignore filtering, and categorised finding tags. Update reference documentation and sync `SKILL.md`.

**Tech Stack:** Node.js (built-in `fs`, `path` only), Node.js native test runner (`node --test`), Markdown.

**Spec:** [`file:///Users/muhammad.ridha/.gemini/antigravity/brain/d173c74d-559f-4afa-ab70-8a70bafcb52b/mobile-localization-and-ergonomics-design.md`](file:///Users/muhammad.ridha/.gemini/antigravity/brain/d173c74d-559f-4afa-ab70-8a70bafcb52b/mobile-localization-and-ergonomics-design.md)

## Global Constraints

- **Zero External Dependencies**: Must use only Node.js standard modules (`fs`, `path`). No external XML or plist libraries.
- **Nested Resource Invariant**: Android plurals must parse as nested objects: `"key": { "one": "...", "other": "..." }`, audited recursively by `auditDictionary`.
- **Backward Compatibility**: Existing `.json`, `.js`, `.mjs`, `.md`, and `.txt` parsing and CLI behaviors must remain unchanged.
- **Skill Sync**: Any modification to root [`SKILL.md`](../../../SKILL.md) must be mirrored verbatim to [`skills/indonesian-linguist/SKILL.md`](../../../skills/indonesian-linguist/SKILL.md).
- **Quality Gates**: All automated tests (`npm test`), markdownlint (`npx markdownlint-cli2`), and auditor checks must pass with zero issues.

## Review Focus

- Malformed Android XML tags or unclosed `<string>` elements should fail gracefully with a descriptive error instead of crashing.
- XML entity unescaping (`&quot;`, `&apos;`, `\'`, `&lt;`, `&gt;`, `&amp;`) and Android whitespace normalization should properly preserve internal placeholders like `%1$s` and `{0}`.
- iOS `.strings` comments (`/* ... */` and `// ...`) and escaped quotes (`\"`) must not confuse key-value parsing.
- Language autonyms (`Bahasa Indonesia (ID)`, `English (US)`, etc.) must pass cleanly without triggering `silent-fallback`.
- `--ignore-keys` must support both exact matches (`app_name`) and prefix wildcards (`language_picker.*`).

---

### Task 1: Android `strings.xml` Parser (`parseAndroidXmlLocale`)

**Files:**
- Modify: `scripts/audit-id.js`
- Test: `tests/audit-id.test.js`

- [ ] **Step 1: Write failing tests for `parseAndroidXmlLocale`**
  - Test single string elements (`<string name="title">Judul</string>`).
  - Test string arrays (`<string-array name="colors"><item>Merah</item><item>Putih</item></string-array>`).
  - Test plurals (`<plurals name="days"><item quantity="one">%d hari</item><item quantity="other">%d hari</item></plurals>`).
  - Test XML entity decoding (`&quot;`, `&apos;`, `\'`, `&lt;`, `&gt;`, `&amp;`) and XML comment stripping (`<!-- comment -->`).
  - Test CDATA sections and empty/malformed inputs.

- [ ] **Step 2: Run tests to verify failure**
  - Run `node --test tests/audit-id.test.js` and verify `parseAndroidXmlLocale is not a function`.

- [ ] **Step 3: Implement `parseAndroidXmlLocale` in `scripts/audit-id.js`**
  - Strip `<!-- ... -->` comments.
  - Parse `<string name="([^"]+)">([\s\S]*?)<\/string>`.
  - Parse `<string-array name="([^"]+)">([\s\S]*?)<\/string-array>` with child `<item>([\s\S]*?)<\/item>`.
  - Parse `<plurals name="([^"]+)">([\s\S]*?)<\/plurals>` with child `<item quantity="([^"]+)">([\s\S]*?)<\/item>`.
  - Apply standard entity decode and whitespace trimming.
  - Export `parseAndroidXmlLocale`.

- [ ] **Step 4: Run tests to verify pass**
  - Run `node --test tests/audit-id.test.js` and ensure all parser tests pass.

- [ ] **Step 5: Commit changes**
  - `git commit -m "feat(parser): add parseAndroidXmlLocale for Android strings.xml"`

---

### Task 2: iOS `.strings` Parser (`parseIosStringsLocale`)

**Files:**
- Modify: `scripts/audit-id.js`
- Test: `tests/audit-id.test.js`

- [ ] **Step 1: Write failing tests for `parseIosStringsLocale`**
  - Test basic `"key" = "value";` pairs.
  - Test escaped quotes inside values (`"key" = "Tekan \"Batal\" untuk keluar";`).
  - Test multi-line block comments (`/* ... */`) and line comments (`// ...`).
  - Test whitespace variations, blank lines, and malformed entries.

- [ ] **Step 2: Run tests to verify failure**
  - Run `node --test tests/audit-id.test.js` and verify `parseIosStringsLocale is not a function`.

- [ ] **Step 3: Implement `parseIosStringsLocale` in `scripts/audit-id.js`**
  - Strip C-style multiline comments and line comments.
  - Match `"((?:[^"\\]|\\.)*)"\s*=\s*"((?:[^"\\]|\\.)*)"\s*;` with unescape of `\"` and `\\`.
  - Export `parseIosStringsLocale`.

- [ ] **Step 4: Run tests to verify pass**
  - Run `node --test tests/audit-id.test.js` and ensure parser tests pass.

- [ ] **Step 5: Commit changes**
  - `git commit -m "feat(parser): add parseIosStringsLocale for Apple .strings files"`

---

### Task 3: Router & Native Format Integration with `--source`

**Files:**
- Modify: `scripts/audit-id.js`
- Test: `tests/audit-id.test.js`

- [ ] **Step 1: Write failing tests for `.xml` and `.strings` file auditing**
  - Test CLI / library auditing of a `.xml` file alone and paired with `--source`.
  - Test CLI / library auditing of a `.strings` file alone and paired with `--source`.
  - Verify that nested plural keys report paths like `days.other`.

- [ ] **Step 2: Run tests to verify failure**
  - Run tests and verify unhandled extension error.

- [ ] **Step 3: Update file reading and dispatch in `scripts/audit-id.js`**
  - In `auditDictionary` / file loader:
    - If file extension is `.xml`, call `parseAndroidXmlLocale`.
    - If file extension is `.strings`, call `parseIosStringsLocale`.
  - Ensure `--source` file loader also handles `.xml` and `.strings`.

- [ ] **Step 4: Run tests to verify pass**
  - Run `node --test tests/audit-id.test.js`.

- [ ] **Step 5: Commit changes**
  - `git commit -m "feat(cli): wire .xml and .strings to auditDictionary and --source"`

---

### Task 4: Autonym Whitelist & `--ignore-keys` / `--warn-only`

**Files:**
- Modify: `scripts/audit-id.js`
- Test: `tests/audit-id.test.js`

- [ ] **Step 1: Write failing tests**
  - Test that `"Bahasa Indonesia (ID)"`, `"Bahasa Melayu"`, `"English (US)"`, `"id-ID"`, `"en-US"` pass without `silent-fallback` findings.
  - Test `--ignore-keys` with exact key match and wildcard prefix (`picker.*`).
  - Test `--warn-only` CLI flag exits with code `0` even when findings are present.

- [ ] **Step 2: Run tests to verify failure**
  - Run `node --test tests/audit-id.test.js`.

- [ ] **Step 3: Implement autonyms and CLI flags in `scripts/audit-id.js`**
  - Add language autonyms and standard locale identifiers to `RETAINED_LOANWORD_PATTERNS`.
  - Add `ignoreKeys` option in `auditDictionary` (supporting Set / wildcard matching).
  - Parse `--ignore-keys <list>` in `cliMain` and pass to `auditDictionary`.
  - Parse `--warn-only` in `cliMain` to print findings but exit with code `0`.

- [ ] **Step 4: Run tests to verify pass**
  - Run `node --test tests/audit-id.test.js`.

- [ ] **Step 5: Commit changes**
  - `git commit -m "feat(cli): add autonym allowlist, --ignore-keys, and --warn-only"`

---

### Task 5: Rule Categorization & Severity Tags

**Files:**
- Modify: `scripts/audit-id.js`
- Test: `tests/audit-id.test.js`

- [ ] **Step 1: Write tests for categorized finding outputs**
  - Verify finding objects include `category`: `'grammar' | 'terminology' | 'style' | 'parity'`.
  - Verify CLI output displays category tags, e.g., `[grammar:kata-tidak-baku]` or `[parity:silent-fallback]`.

- [ ] **Step 2: Implement categorization mapping in `scripts/audit-id.js`**
  - Map each rule to its category:
    - `kata-tidak-baku`, `slop-or-pleonasm`, `merged-preposition` $\rightarrow$ `grammar`
    - `polysemy-calque` $\rightarrow$ `terminology`
    - `pronoun-mismatch`, `inverted-quantitative-placeholder` $\rightarrow$ `style`
    - `silent-fallback`, `placeholder-mismatch`, `malformed-placeholder` $\rightarrow$ `parity`
  - Include category in CLI output format and JSON output.

- [ ] **Step 3: Run tests to verify pass**
  - Run `node --test tests/audit-id.test.js`.

- [ ] **Step 4: Commit changes**
  - `git commit -m "feat(auditor): categorize findings into grammar, terminology, style, and parity"`

---

### Task 6: Linguistic Documentation Refinements

**Files:**
- Modify: `SKILL.md`
- Modify: `AGENTS.md`
- Modify: `references/polysemy.md`
- Modify: `references/i18n.md`
- Modify: `scripts/README.md`
- Sync: `skills/indonesian-linguist/SKILL.md`

- [ ] **Step 1: Update `AGENTS.md` and `references/polysemy.md`**
  - Add clause-aware compound verb rule: Head action uses root imperative (`Zero` prefix: *Simpan*, *Geser*), while subordinate purpose clause uses `meN-` prefix after *untuk*, *demi*, *agar* (*"Geser untuk mematikan alarm"*).
  - Add text expansion clarification: Expansion (+20% to +35%) is an empirical layout guideline for visual designers, not a rigid test invariant.

- [ ] **Step 2: Update `references/i18n.md` and `scripts/README.md`**
  - Document `.xml` and `.strings` formats, `--ignore-keys`, and `--warn-only` in `scripts/README.md`.
  - Add caution against reusing identical strings across divergent application states (e.g., start vs. expiration).

- [ ] **Step 3: Update root `SKILL.md` and run `npm run sync`**
  - Ensure root `SKILL.md` captures the compound verb and expansion rules concisely.
  - Run `node scripts/sync-skill.js` to mirror to `skills/indonesian-linguist/SKILL.md`.

- [ ] **Step 4: Commit changes**
  - `git commit -m "docs(linguistics): document clause-aware verbs, expansion layout rules, and mobile formats"`

---

### Task 7: Full Test Suite, Linter, and PR Gate Verification

**Files:**
- Test all

- [ ] **Step 1: Run complete test suite**
  - Run `npm test` and ensure all tests pass (existing + new).

- [ ] **Step 2: Run markdownlint**
  - Run `npx markdownlint-cli2 README.md docs/*.md scripts/README.md references/README.md`.

- [ ] **Step 3: Run auditor on documentation**
  - Run `node scripts/audit-id.js docs/*.md scripts/README.md references/README.md references/domains/README.md`.

- [ ] **Step 4: Review git status and diff**
  - Verify working tree is clean and all commits adhere to semantic commit conventions.
