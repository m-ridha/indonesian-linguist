# Deterministic Indonesian Auditor (`scripts/`)

## Overview

Contains the zero-dependency Node.js CLI and library module [`audit-id.js`](audit-id.js) for auditing Indonesian localization dictionaries (`.json`, `.js`, `.mjs`) and prose documents (`.md`, `.txt`) against EYD V, UI polysemy traps, banned SMS abbreviations, and AI slop.

## Interface

- `auditText(text: string, options?: { stripIndentedCode?: boolean, pronoun?: string }) -> Array<{rule: string, message: string}>`: `[scripts/audit-id.js:auditText]` Scans a prose string for banned SMS abbreviations (`sms-abbreviation`), non-standard KBBI forms (`kata-tidak-baku`), Indonesian AI-slop / pleonasm patterns (`slop-or-pleonasm`), and optional pronoun policy violations (`pronoun-mismatch`).
- `auditDictionary(dict: Record<string, unknown>, options?: {minFallbackLength?: number, allowlistKeys?: Set<string>, source?: Record<string, unknown>, pronoun?: string})`: `[scripts/audit-id.js:auditDictionary]` Audits a flat or nested key-value localization object for silent English identity fallbacks (`silent-fallback`), placeholder parity (`placeholder-mismatch`), malformed placeholders (`malformed-placeholder`), inverted quantitative placeholders (`inverted-quantitative-placeholder`), pronoun policy violations (`pronoun-mismatch`), known UI/domain calque traps (`polysemy-calque`), and all `auditText` checks.
- `extractPlaceholders(str: string) -> string[]`: `[scripts/audit-id.js:extractPlaceholders]` Extracts sorted placeholders (`{0}`, `{name}`, `{{name}}`, `%s`, `%d`, `%1$s`) from a string while preserving duplicate occurrences.
- `parseSimpleJsLocale(content: string) -> Record<string, unknown>`: `[scripts/audit-id.js:parseSimpleJsLocale]` Parses JavaScript key-value locale exports (`export default`, `export const`, and nested objects) into a dictionary object.
- CLI Runner: `node scripts/audit-id.js [options] <path> [...]` `[scripts/audit-id.js]` Audits one or more files and exits with code `0` when all files are clean, or `1` when any file has findings or cannot be read/parsed. Supports `-h, --help` for usage, `--json` for machine-readable JSON output in CI, `--source <file>` to compare against a source catalog (`.json`/`.js`/`.mjs`), `--min-fallback <n>` to customize fallback thresholds, `--pronoun <Anda|kamu|any>` to enforce pronoun consistency, and `--register <formal|casual|any>` as an alias for formal/casual register policy.

## Invariants

- **Zero External Dependencies**: Uses only Node.js built-in modules (`fs`, `path`). `[scripts/audit-id.js]`
- **Case-Sensitive UI Key Disambiguation**: Flags `'Back': 'Punggung'` (capital `B`, UI navigation button) while permitting `'back': 'punggung'` (lowercase `b`, anatomical muscle filter). `[scripts/audit-id.js:KNOWN_CALQUE_TRAPS]`
- **Retained Loanword & Proper Noun Allowlist**: Excludes canonical retained fitness/developer loanwords, Latin anatomical terms, and official brand names (`Face ID`, `Touch ID`, `iCloud Keychain`, `Google Password Manager`, `Health Connect`, `Apple Watch`, `Cloudflare`) from false-positive `silent-fallback` warnings. `[scripts/audit-id.js:RETAINED_LOANWORD_PATTERNS]`

## Side Effects

- When invoked directly as a CLI script (`require.main === module`), reads the target file from disk, prints audit findings to `stdout`/`stderr`, and terminates the process with exit code `0` or `1`. `[scripts/audit-id.js]`

## Verification

```bash
npm test
```
