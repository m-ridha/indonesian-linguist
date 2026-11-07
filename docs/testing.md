# Testing and Quality Assurance (`docs/testing.md`)

This repository uses a zero-dependency testing strategy built entirely on Node.js native testing modules (`node:test`, `node:assert/strict`). Every pull request must pass all test tiers before merge.

---

## 1. Test Architecture & Structure

Testing is divided into three distinct automated layers:

| Layer | Runner / Tool | Target | Purpose |
| --- | --- | --- | --- |
| **1. Unit & Manifest Tests** | `node --test tests/*.test.js` (`npm test`) | `tests/manifests.test.js`<br>`tests/audit-id.test.js`<br>`tests/space-engine.test.js` | Verifies multi-agent manifest consistency, byte limits, link integrity, auditor functions, and Space engine/bundle parity. |
| **2. Deterministic Prose & i18n Auditor** | `node scripts/audit-id.js <targets>` | `docs/*.md`, `scripts/README.md`, `references/README.md`, `references/domains/README.md` | Audits documentation and reference indexes for AI slop, banned SMS slang, and non-standard spelling. Modules that quote banned forms as teaching examples are excluded. |
| **3. Markdown Style Linter** | `npx markdownlint-cli2` | All `.md` files | Enforces GitHub Flavored Markdown standards, code fence symmetry, and heading hierarchy. |

---

## 2. Test Suites Overview

### `tests/manifests.test.js`
Smoke tests modeled on Ponytail and EGM multi-agent packaging:
- **Manifest Version Parity**: Enforces that `package.json`, `plugin.json`, `gemini-extension.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, and `.github/plugin/plugin.json` share the identical SemVer string.
- **Single-Skill Synchronization**: Asserts that root `SKILL.md` is byte-for-byte identical to `skills/indonesian-linguist/SKILL.md`.
- **Antigravity Byte Limit**: Verifies `SKILL.md` does not exceed 24,000 bytes (Antigravity skill context limit).
- **Broken Link Detection**: Scans all relative Markdown links across documentation, references, and manifests to ensure every target file exists on disk.
- **Load-Bearing Invariants**: Validates that core linguistic rules (`"Baku tak mesti kaku"`, `"Sesuai input"`, `"Hapus penilaian"`, `"Minggu beruntun"`, `"hiruk pikuk"`, `"silakan"`) are documented in both `SKILL.md` and `AGENTS.md`.
- **Agent Marketplace Metadata**: Verifies `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json` schemas.

### `tests/audit-id.test.js`
Unit tests for `scripts/audit-id.js`:
- **Prose Auditing (`auditText`)**: Tests clean natural Indonesian against samples containing banned chat abbreviations (`yg`, `dgn`, `utk`), non-standard words (`silahkan`, `merubah`), and AI slop (`hiruk pikuk`, stylistic em dashes `—`).
- **Protected Code Blocks**: Ensures code blocks (triple backticks, triple tildes `~~~`, and 4-space indented blocks) are not flagged as prose errors.
- **Nested Markdown Lists**: Validates that 4-space indented nested list items (e.g. `- Petunjuk\n\n    - Silahkan lanjutkan.`) remain audited as prose.
- **Dictionary Auditing (`auditDictionary`)**: Checks flat and nested locale dictionaries for silent English fallbacks (`key === value`), placeholder mismatches, and known UI calque traps (*Back* -> *Punggung*, *Clear rating* -> *Peringkat yang jelas*).
- **JS Locale Parsing (`parseSimpleJsLocale`)**: Tests parsing of unquoted and quoted keys, stripping of line/block comments outside string literals, and error throwing on unsupported syntax.
- **CLI Runner**: Executes the CLI runner against clean and defective files to confirm non-zero exit codes on errors.

### `tests/space-engine.test.js`
Space engine and bundle synchronization tests:
- **Bundle Sync**: Asserts that `space/engine.bundle.js` matches the output of `generateSpaceEngine()` from `scripts/build-space-engine.js`, so a rule change without a rebuild fails CI.
- **Format Routing**: Verifies JSON versus prose auto-detection, key-value snippet handling, malformed JSON and snippet error boundaries, and clean-text generation.
- **Engine Behavior**: Covers per-surface pronoun enforcement, reverse-order batch fixes without offset drift, Markdown and URL masking with 1:1 character coordinates, finding caps, and JSON cleaning without precision loss while preserving `__proto__` keys.

---

## 3. Running Tests Locally

### Quick Full Check
Run the complete test and linting pipeline in your shell:

```bash
# 1. Run unit and manifest test suites
npm test

# 2. Run deterministic auditor over documentation and reference files
node scripts/audit-id.js docs/*.md scripts/README.md references/README.md references/domains/README.md

# 3. Run markdown style linting
npx --yes markdownlint-cli2
```

---

## 4. Test-Driven Development (TDD) for New Linguistic Rules

When adding a new linguistic rule, domain term, or auditor fix:
1. **Add Negative and Positive Test Cases First**:
   - In `tests/audit-id.test.js`, add a test case verifying the bad term/pattern is flagged with its expected rule name (`kata-tidak-baku`, `sms-abbreviation`, `polysemy-calque`, `slop-or-pleonasm`, or `silent-fallback`).
   - Add a positive test verifying the correct natural Indonesian form passes cleanly.
2. **Implement the Rule**:
   - Update `scripts/audit-id.js` (e.g. `NON_STANDARD_WORDS`, `KNOWN_CALQUE_TRAPS`, or `RETAINED_LOANWORD_PATTERNS`).
3. **Verify Zero Regressions**:
   - Run `npm test` to verify all existing and new tests pass.
