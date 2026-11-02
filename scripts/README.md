# Deterministic Indonesian Auditor (`scripts/`)

## Overview

Contains the zero-dependency Node.js CLI and library module [`audit-id.js`](audit-id.js) for auditing Indonesian localization dictionaries (`.json`, `.js`, `.mjs`) and prose documents (`.md`, `.txt`) against EYD V, UI polysemy traps, banned SMS abbreviations, and AI slop.

## Interface

- `auditText(text: string) -> Array<{rule: string, message: string}>`: `[scripts/audit-id.js:auditText]` Scans a prose string for banned SMS abbreviations (`sms-abbreviation`), non-standard KBBI forms (`kata-tidak-baku`), and Indonesian AI-slop / pleonasm patterns (`slop-or-pleonasm`).
- `auditDictionary(dict: Record<string, string>, options?: {minFallbackLength?: number, allowlistKeys?: Set<string>}) -> Array<{key: string, rule: string, message: string}>`: `[scripts/audit-id.js:auditDictionary]` Audits a key-value localization object for silent English identity fallbacks (`silent-fallback`), placeholder parity (`placeholder-mismatch`), known UI/domain calque traps (`polysemy-calque`), and all `auditText` checks.
- `extractPlaceholders(str: string) -> string[]`: `[scripts/audit-id.js:extractPlaceholders]` Extracts sorted unique `{0}`, `{name}` placeholders from a string.
- `parseSimpleJsLocale(content: string) -> Record<string, string>`: `[scripts/audit-id.js:parseSimpleJsLocale]` Parses flat JavaScript key-value locale exports into a dictionary object.
- CLI Runner: `node scripts/audit-id.js <path>` `[scripts/audit-id.js]` Exits with code `0` when zero findings are detected, or `1` when defects are found.

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
