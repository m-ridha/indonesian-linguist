# Changelog

All notable changes to `indonesian-linguist` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-02

### Added
- **Unified Single Skill (`SKILL.md` & `AGENTS.md`)**: Hybrid language architecture with English operational instructions and bilingual discovery triggers paired with authentic Bahasa Indonesia contrastive tables and checklists.
- **UI Localization & Polysemy Reference (`references/ui-localization-and-polysemy.md`)**: 75+ isolated UI verb/noun polysemy resolutions, imperative button morphology, form caption antecedent resolution, navigation verb alignment (`hop over / skip`), binary gender paradigm symmetry, and inanimate pronoun (`ia / mereka`) prohibition.
- **Lexical Compaction & Microcopy Reference (`references/ui-compaction-and-microcopy.md`)**: Segmented control compaction patterns (`Sesuai input`, `Ikuti set utama`, `Jaga`), zero relative pronoun rules, strict ban on chat/SMS abbreviations (`yg`, `dgn`, `utk`), and UX component patterns.
- **Extensible Domain & Subculture Glossaries (`references/domains/`)**:
  - `fitness-and-gym.md`: Complete strength training, bodybuilding, calisthenics, and workout tracker localization rules accrued from the 2,575-key UI and 5,632-exercise OpenGym localization effort.
  - `tech-and-developer.md`: Developer infrastructure loanwords (`API key`, `endpoint`, `reverse proxy`), brand retention, and official Apple iOS / Google Android `id-ID` system setting alignments.
- **Core Grammar, Anti-Slop & Content Writing References**:
  - `anti-slop-and-calques.md`: Ten zero-tolerance AI-slop bans and English-to-Indonesian syntactic calque repairs.
  - `core-grammar-and-eyd.md`: EYD Edisi V rules, 60+ `Kata Baku` pairs, `di-` vs. `di`, `meN-` assimilation, and `Hukum D-M`.
  - `writing-ux-marketing-seo-academic.md`: Ivan Lanin's 5 registers, social/marketing copy, web copy, SEO `<title>` optimization, and academic IMRaD standards.
- **Multi-Agent Portability & Automated Verification Suite**:
  - Adapters for Antigravity, Claude Code, OpenAI Codex, Gemini CLI, OpenCode, GitHub Copilot CLI, Cursor, and generic `AGENTS.md` hosts.
  - Zero-dependency deterministic auditor (`scripts/audit-id.js`) and `node:test` test suite (`tests/manifests.test.js`, `tests/audit-id.test.js`).
