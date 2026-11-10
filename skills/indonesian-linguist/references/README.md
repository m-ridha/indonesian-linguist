# Linguistic & Localization Reference Modules (`references/`)

## Overview

Houses the progressive-disclosure linguistic reference modules loaded on demand by [`SKILL.md`](../SKILL.md). Each module isolates a specific problem domain so AI agents load only the context required for the active task.

## Subdirectories & Modules

- [`ui-localization-and-polysemy.md`](ui-localization-and-polysemy.md): Isolated UI verb/noun polysemy resolution (75+ entries), 4-way verb voice matrix (`Zero` / `meN-` / `di-` / `ter-`), form caption antecedent resolution, inanimate pronoun (`ia / mereka`) prohibition, binary gender symmetry, `{0}` plural placeholder syntax, and prepositional dimension unit headers (`Satuan [dimensi]`).
- [`ui-compaction-and-microcopy.md`](ui-compaction-and-microcopy.md): Lexical compaction strategies for tight segmented controls (`.seg`), zero relative pronoun rules, banned chat/SMS abbreviations (`yg`, `dgn`, `utk`), permitted metric abbreviations, and UX component patterns.
- [`anti-slop-and-calques.md`](anti-slop-and-calques.md): Ten zero-tolerance AI-slop bans, bureaucratic nominalization repairs (`dikarenakan`, `dalam rangka untuk`, `melakukan pengecekan`), and English-to-Indonesian syntactic calque fixes.
- [`core-grammar-and-eyd.md`](core-grammar-and-eyd.md): EYD Edisi V rules, 60+ `Kata Baku` vs. `Tidak Baku` pairs, `di-` vs. `di`, `meN-` assimilation, code-mixing hyphenation (`di-deploy`, `commit-nya`), `Hukum D-M`, and pragmatic particle calibration (`sih, dong, deh, kan, kok`).
- [`writing-ux-marketing-seo-academic.md`](writing-ux-marketing-seo-academic.md): Ivan Lanin's 5 formality registers, marketing copywriting, website copy, SEO `<title>` optimization, and academic IMRaD standards.
- [`domains/`](domains/README.md): Extensible domain and subculture glossaries ([`fitness-and-gym.md`](domains/fitness-and-gym.md), [`medical-and-healthcare.md`](domains/medical-and-healthcare.md), [`tech-and-developer.md`](domains/tech-and-developer.md)).

## Verification

```bash
npm test
```
