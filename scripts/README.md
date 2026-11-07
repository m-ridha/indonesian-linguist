# Deterministic Indonesian Auditor (`scripts/`)

## Overview

Contains the zero-dependency Node.js CLI and library module [`audit-id.js`](audit-id.js) for auditing Indonesian localization dictionaries (`.json`, `.js`, `.mjs`, Android `.xml`, iOS `.strings`) and prose documents (`.md`, `.txt`) against EYD V, UI polysemy traps, banned SMS abbreviations, and AI slop. The directory also houses [`build-space-engine.js`](build-space-engine.js), which generates `space/engine.bundle.js` from the `ENGINE_EXPORT_START`/`ENGINE_EXPORT_END` block in `audit-id.js` and refreshes the version label in `space/index.html` for `npm run build:space`.

## Interface

- `auditText(text: string, options?: { stripIndentedCode?: boolean, pronoun?: string | null, maxFindings?: number }) -> Array<{rule: string, category: string, message: string, startIndex?: number, endIndex?: number, original?: string, replacement?: string, confidence?: string}>`: `[scripts/audit-id.js:auditText]` Scans a prose string for banned SMS abbreviations (`sms-abbreviation`), non-standard KBBI forms (`kata-tidak-baku`), Indonesian AI-slop / pleonasm patterns (`slop-or-pleonasm`), and optional pronoun policy violations (`pronoun-mismatch`). Findings may also carry `startIndex`, `endIndex`, `original`, `replacement`, and `confidence` for interactive highlighting and safe batch fixes.
- `auditDictionary(dict: Record<string, unknown>, options?: {minFallbackLength?: number, allowlistKeys?: Set<string>, ignoreKeys?: Set<string> | string[] | string | null, source?: unknown, pronoun?: string | null}) -> Array<{key: string, rule: string, category?: string, message: string}>`: `[scripts/audit-id.js:auditDictionary]` Audits a flat or nested key-value localization object for silent English identity fallbacks (`silent-fallback`), placeholder parity (`placeholder-mismatch`), malformed placeholders (`malformed-placeholder`), inverted quantitative placeholders (`inverted-quantitative-placeholder`), pronoun policy violations (`pronoun-mismatch`), known UI/domain calque traps (`polysemy-calque`), and all `auditText` checks. Each finding includes `rule`, `message`, and an optional `category` (`grammar`, `terminology`, `style`, `parity`, `structure`, or `general`).
- `extractPlaceholders(str: string) -> string[]`: `[scripts/audit-id.js:extractPlaceholders]` Extracts sorted placeholders (`{0}`, `{name}`, `{{name}}`, `%s`, `%d`, `%1$s`) from a string while preserving duplicate occurrences.
- `parseSimpleJsLocale(content: string) -> Record<string, unknown>`: `[scripts/audit-id.js:parseSimpleJsLocale]` Parses JavaScript key-value locale exports (`export default`, `export const`, and nested objects) into a dictionary object.
- `parseAndroidXmlLocale(xmlContent: string) -> Record<string, unknown>`: `[scripts/audit-id.js:parseAndroidXmlLocale]` Parses Android `strings.xml` resources, extracting `<string>`, `<string-array>`, and nested `<plurals>` (`{ "key": { "one": "...", "other": "..." } }`) with entity decoding and CDATA unrolling.
- `parseIosStringsLocale(stringsContent: string) -> Record<string, unknown>`: `[scripts/audit-id.js:parseIosStringsLocale]` Parses iOS `.strings` key-value catalogs (`"key" = "value";`) while handling C-style comments and escape sequences.
- CLI Runner: `node scripts/audit-id.js [options] <path> [...]` `[scripts/audit-id.js]` Audits one or more files and exits with code `0` when clean, or `1` when findings exist (unless `--warn-only` is passed). Supports `-h, --help` for usage, `--json` for machine-readable JSON output in CI, `--source <file>` to compare against a source catalog (`.json`/`.js`/`.mjs`/`.xml`/`.strings`), `--ignore-keys <k1,k2,...>` for key scoping/exceptions (supports wildcards like `picker.*`), `--warn-only` to report audit findings but exit with code `0` (file-read and parse errors still exit with code `1`), `--min-fallback <n>` to customize fallback thresholds, `--pronoun <Anda|kamu|any>` to enforce pronoun consistency, and `--register <formal|casual|any>` as an alias for formal/casual register policy.

## Invariants

- **Zero External Dependencies**: Uses only Node.js built-in modules (`fs`, `path`). `[scripts/audit-id.js]`
- **Case-Sensitive UI Key Disambiguation**: Flags `'Back': 'Punggung'` (capital `B`, UI navigation button) while permitting `'back': 'punggung'` (lowercase `b`, anatomical muscle filter). `[scripts/audit-id.js:KNOWN_CALQUE_TRAPS]`
- **Retained Loanword & Autonym Allowlist**: Excludes canonical retained fitness/developer loanwords, Latin anatomical terms, official brand names (`Face ID`, `Touch ID`, `iCloud Keychain`, `Google Password Manager`, `Health Connect`, `Apple Watch`, `Cloudflare Access`), and language-picker autonyms (`Bahasa Indonesia (ID)`, `Bahasa Melayu`, `English (US)`, locale codes) from false-positive `silent-fallback` warnings. `[scripts/audit-id.js:RETAINED_LOANWORD_PATTERNS]`

## Side Effects

- When invoked directly as a CLI script (`require.main === module`), reads the target file from disk, prints audit findings to `stdout`/`stderr`, and terminates the process with exit code `0` or `1`. `[scripts/audit-id.js]`

## Verification

```bash
npm test
```
