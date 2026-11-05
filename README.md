<p align="center">
  <a href="https://github.com/m-ridha/indonesian-linguist"><img src="assets/logo.svg" width="96" height="96" alt="Indonesian Linguist"></a>
</p>

<h1 align="center">Indonesian Linguist</h1>

<p align="center">
  <em>Baku tak mesti kaku, santai bukan sembarangan.</em>
</p>

<p align="center">
  <a href="#quickstart">Quickstart</a> &ensp;·&ensp;
  <a href="https://huggingface.co/spaces/m-ridha/indonesian-linguist">Live Playground</a> &ensp;·&ensp;
  <a href="#why-indonesian-linguist-exists">Why It Exists</a> &ensp;·&ensp;
  <a href="#how-it-works-single-skill--progressive-disclosure">How It Works</a> &ensp;·&ensp;
  <a href="#installation">Installation</a> &ensp;·&ensp;
  <a href="SKILL.md">Skill Guide</a> &ensp;·&ensp;
  <a href="https://github.com/m-ridha/indonesian-linguist">GitHub</a>
</p>

<br>

**Indonesian Linguist** is an expert language, software localization (i18n/UX microcopy), and anti-slop writing engine for AI coding agents. It enforces EYD V and KBBI VI grammar, resolves isolated UI polysemy traps, compacts mobile layouts without SMS slang, retains established developer and fitness loanwords, and eliminates Indonesian AI slop.

---

## Quickstart

### In Chat & Pair Programming

Invoke `/indonesian-linguist` or prompt your agent for any Indonesian language, translation, or localization task (replace `<path/to/...>` with your catalog paths):

```text
/indonesian-linguist Localize <path/to/id.json> using <path/to/en.json> as source.
```

### Web Playground & Live Demo

Try the 100% deterministic web demo **[Indonesian Linguist](https://huggingface.co/spaces/m-ridha/indonesian-linguist)** on Hugging Face Spaces:
- **Zero-Setup & Client-Side Privacy**: Runs completely in browser memory with zero remote data egress.
- **Prose & JSON Catalog Support**: Automatically detects input format, masks markdown code blocks, flags translation calques, and provides safe reverse-order batch fixes.

### Deterministic Localization & Prose Auditor

Audit any locale dictionary (`.json`, `.js`, `.mjs`, Android `.xml`, iOS `.strings`) or prose file (`.md`, `.txt`) using the built-in CLI (replace `<path/to/...>` with your file paths):

```bash
# Compare Indonesian target against English source catalog
node scripts/audit-id.js --source <path/to/en.json> <path/to/id.json>

# Enforce explicit project pronoun policy (formal Anda or casual kamu/-mu)
node scripts/audit-id.js --pronoun Anda <path/to/id.json>
```

---

## Why `indonesian-linguist` Exists

Left to themselves, AI models fail at Bahasa Indonesia in three predictable ways:

1. **Isolated UI Polysemy & Comical Calques in Software Localization (`i18n`)**:
   Without sentence context, models translate UI button `'Back'` as *Punggung* (anatomical spine), `'Clear rating'` as *Peringkat yang jelas*, `'Discard running workout'` as *Buang latihan lari*, `'Hop over a finished exercise'` as *Lanjutkan* (inverting the meaning 180°), `'Abductors'` as *Penculik* (kidnapper), `'Landmine'` as *Ranjau darat*, and `'API key'` as *Kunci API*.
2. **UI Layout Overflow vs. Amateur SMS Slang**:
   Indonesian expands English text by 20-35%. In tight mobile segmented controls (`.seg`), models either write 23-character relative clauses (*"Seperti yang dimasukkan"*) that clip with `...`, or resort to amateurish chat abbreviations (`yg`, `dgn`, `utk`, `spt`).
3. **Indonesian AI Slop & Syntactic Calques**:
   Models pad prose with *"Di era digital yang serba cepat ini..."*, **hiruk pikuk**, *"bukan hanya X, tetapi juga Y"*, stylistic em dashes (`—`), `di mana` as a relative pronoun, and human pronouns (`ia`, `mereka`) for servers and data changes.

`indonesian-linguist` fixes all three through a **hybrid architecture**: **English operational instructions and bilingual discovery triggers** (so any developer or agent worldwide can trigger and follow the logic reliably) paired with **authentic Bahasa Indonesia contrastive tables, domain glossaries, and verification checks**.

---

## Before & After

### 1. Software Localization (`i18n` Key-Value Dictionaries)

```javascript
// ❌ Without indonesian-linguist (Literal calques, active me- verbs, UI overflow, broken antecedents)
export default {
  'Back': 'Punggung',                                 // Anatomical back!
  'Clear rating': 'Peringkat yang jelas',             // Visual 'clear' + leaderboard 'rank'!
  'Share': 'Membagikan',                              // Active me- verb on button
  'Discard running workout': 'Buang latihan lari',    // Sport of running!
  'Sets are drawn': 'Set diundi',                     // Lottery draw!
  'As entered': 'Seperti yang dimasukkan',            // 23 chars — overflows segmented pill
  'Hold': 'Pertahankan',                              // 11 chars — clips in [Lose | Gain | Hold]
  'Weight 30d': 'Berat 30h',                          // Ambiguous 'Berat' + cryptic '30h'
  'Weight ({0})': 'Berat ({0})',                      // Wrong semantic field for lifting load
  'Landmine': 'Ranjau darat',                         // Military explosive!
  'Abductors': 'Penculik',                            // Kidnapper!
  'Lengths in': 'Panjang dalam',                      // Dangling prepositional fragment!
  'End of a hold': 'Akhir tahanan',                   // Detainee / prison custody!
  'On an assistance machine': 'Pada mesin bantuan',   // Social/disaster relief equipment!
  'App stores': 'Toko app',                           // Amateur slang for distribution channels!
  'Prev and Next hop over a finished exercise':
    'Sebelumnya dan Berikutnya lanjutkan latihan yang sudah selesai', // Inverted meaning!
}

// ✅ With indonesian-linguist (Idiomatic UI function, base imperatives, lexical compaction)
export default {
  'Back': 'Kembali',
  'Clear rating': 'Hapus penilaian',
  'Share': 'Bagikan',
  'Discard running workout': 'Buang sesi latihan yang sedang berjalan',
  'Sets are drawn': 'Set ditampilkan di grafik',
  'As entered': 'Sesuai input',                       // 12 chars (-48% width)
  'Hold': 'Jaga',                                     // 4 chars (-64% width)
  'Weight 30d': 'Berat badan 30 hari',                // Explicit body-mass card label
  'Weight ({0})': 'Beban ({0})',                      // Lifting resistance column
  'Landmine': 'Landmine',                             // Community loanword retained
  'Abductors': 'Abduktor',
  'Lengths in': 'Satuan panjang',                     // Explicit noun phrase
  'End of a hold': 'Akhir durasi tahan',              // Qualified isometric timer cue
  'On an assistance machine': 'Pada mesin assisted',  // Gym subculture counterweight term
  'App stores': 'Toko aplikasi',                      // Official platform-agnostic umbrella category
  'Prev and Next hop over a finished exercise':
    'Sebelumnya dan Berikutnya melewati latihan yang sudah selesai',
}
```

### 2. Technical Prose & Documentation

❌ **Without `indonesian-linguist`**:
> Di era lanskap digital yang serba cepat saat ini, pembatasan tarif bukan hanya sekadar pilihan, melainkan sebuah keharusan yang krusial. Ketika klien melampaui langit-langit, ia akan menerima respons 429 di mana mereka harus menunggu sebelum mencoba kembali.

✅ **With `indonesian-linguist`**:
> Pembatasan kuota permintaan (*rate limiting*) melindungi API dari lonjakan trafik berlebih. Saat jumlah permintaan klien melewati batas maksimal, server mengembalikan status `429 Too Many Requests` sehingga klien perlu menunggu sebelum mengirim permintaan ulang.

More real-world comparisons in [`examples/i18n-and-ui-localization.md`](examples/i18n-and-ui-localization.md) and [`examples/writing-and-copywriting.md`](examples/writing-and-copywriting.md).

---

## How It Works (Single Skill + Progressive Disclosure)

You only ever install or invoke **one skill**: `/indonesian-linguist` (or let your agent trigger it automatically whenever Indonesian is involved).

When activated, [`SKILL.md`](SKILL.md) enforces the core invariants and loads **only** the reference modules your task requires:

```text
1. Identify Task & Register → Lock pronoun (Anda vs. kamu/-mu vs. implicit) & formality level
2. Load Matching Reference  → Read only the relevant file under references/ or references/domains/
3. Apply Domain & UI Rules  → Resolve polysemy, compact tight UI strings, retain community loanwords
4. Run Pre-Delivery Audit   → Check silent fallbacks (key === value), placeholders, EYD V, & slop
```

| File / Directory | Purpose |
| --- | --- |
| [`SKILL.md`](SKILL.md) | Canonical single skill (`/indonesian-linguist`): core rules, fast routing table, and verification checklist. |
| [`AGENTS.md`](AGENTS.md) | Compact always-on ruleset for agents that auto-load project rules from the repo root. |
| [`references/ui-localization-and-polysemy.md`](references/ui-localization-and-polysemy.md) | 75+ isolated UI verb/noun polysemy resolutions, button imperatives, form antecedents, and inanimate pronoun bans. |
| [`references/ui-compaction-and-microcopy.md`](references/ui-compaction-and-microcopy.md) | Segmented pill lexical compaction, banned SMS slang (`yg`, `dgn`, `utk`), error states, empty states, and modals. |
| [`references/domains/fitness-and-gym.md`](references/domains/fitness-and-gym.md) | Comprehensive strength training & fitness subculture glossary (loanwords, calque blacklists, `Body weight` vs. `Bodyweight` vs. `Beban`, 1RM, streaks, coaching personas). |
| [`references/domains/tech-and-developer.md`](references/domains/tech-and-developer.md) | Developer loanwords (`API key`, `endpoint`, `reverse proxy`), brand retention, and official Android/iOS `id-ID` system strings. |
| [`references/anti-slop-and-calques.md`](references/anti-slop-and-calques.md) | Ten zero-tolerance AI-slop bans (*hiruk pikuk*, negative parallelisms, em dashes) and syntactic calque repairs. |
| [`references/core-grammar-and-eyd.md`](references/core-grammar-and-eyd.md) | EYD Edisi V rules, 60+ `Kata Baku` pairs, `di-` vs. `di`, `meN-` assimilation, D-M word order, and punctuation. |
| [`references/writing-ux-marketing-seo-academic.md`](references/writing-ux-marketing-seo-academic.md) | Ivan Lanin's 5 registers, social/marketing copy, landing pages, SEO `<title>` rules, and academic IMRaD standards. |
| [`scripts/audit-id.js`](scripts/audit-id.js) | Zero-dependency CLI auditor for scanning `.json`/`.js`/`.mjs`, Android `.xml`, and iOS `.strings` locale dictionaries and `.md` prose for defects. |

---

## Installation

### Antigravity (IDE & `agy` CLI) / Gemini CLI

Install as an extension:

```bash
agy plugin install https://github.com/m-ridha/indonesian-linguist
# or with Gemini CLI:
gemini extensions install https://github.com/m-ridha/indonesian-linguist
```

Or clone directly into your global Antigravity skills directory:

```bash
git clone https://github.com/m-ridha/indonesian-linguist.git "$HOME/.gemini/config/skills/indonesian-linguist"
```

### Claude Code

Add the plugin marketplace and install inside Claude Code:

```text
/plugin marketplace add m-ridha/indonesian-linguist
/plugin install indonesian-linguist@indonesian-linguist
```

Or clone directly into `.claude/skills/`:

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/m-ridha/indonesian-linguist.git ~/.claude/skills/indonesian-linguist
```

### OpenAI Codex & OpenCode

Install via Codex plugin manager:

```bash
codex plugin marketplace add m-ridha/indonesian-linguist
codex plugin add indonesian-linguist@indonesian-linguist
```

Or clone globally into `~/.agents/skills/` (discovered by both Codex and OpenCode):

```bash
mkdir -p "$HOME/.agents/skills"
git clone https://github.com/m-ridha/indonesian-linguist.git "$HOME/.agents/skills/indonesian-linguist"
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add m-ridha/indonesian-linguist
copilot plugin install indonesian-linguist@indonesian-linguist
```

### Cursor, Windsurf, Cline, Zed & Generic Agents

Copy [`AGENTS.md`](AGENTS.md) alongside [`SKILL.md`](SKILL.md) and [`references/`](references/README.md) into your project root so relative references resolve (or use `.windsurf/rules/` or `.clinerules/`; for Cursor, keep `AGENTS.md` at the project root or use a `.mdc` rule in `.cursor/rules/`). See [`docs/agent-portability.md`](docs/agent-portability.md) for the full adapter matrix.

---

## Deterministic Localization & Prose Auditor (`scripts/audit-id.js`)

This repository includes a zero-dependency Node.js CLI auditor that checks `.json`/`.js`/`.mjs`, Android `.xml`, and iOS `.strings` i18n locale files and `.md` prose for:
- Silent English identity fallbacks (`key === value` on strings $\ge 16$ characters)
- Placeholder mismatches (`{0}`, `{1}`, `{name}`)
- Banned chat/SMS abbreviations (`yg`, `dgn`, `utk`, `krn`, `tdk`, `bgt`)
- Non-standard spellings (*silahkan, sekedar, resiko, praktek, analisa, merubah, mempengaruhi*)
- Known UI/domain polysemy calques (*Punggung* for `Back`, *Penculik* for `Abductors`, *Ranjau darat* for `Landmine`, *lanjutkan* for `hop over`, *mesin bantuan* for `assistance machine`, *akhir tahanan* for `end of a hold`, *panjang dalam* for `lengths in`, *toko app* for `app stores`, etc.)
- Indonesian AI-slop phrases (*hiruk pikuk*, *di era digital*, *adalah merupakan*, stylistic em dashes `—`)

Run the auditor on any file:

```bash
node scripts/audit-id.js path/to/locales/id.js
```

Run the repository verification and unit test suite (Node 18+ built-in test runner, zero dependencies):

```bash
npm test
```

For full testing protocols, test layers, and TDD guidelines, see [`docs/testing.md`](docs/testing.md). For version bumping and automated release workflows, see [`docs/releases.md`](docs/releases.md).

---

## Authoritative Linguistic Grounding

All rules are backed by official standards and empirical localization research (full bibliography in [`docs/sources.md`](docs/sources.md)):
- **EYD Edisi V** & **KBBI VI Daring** (Badan Bahasa Kemendikdasmen)
- **PUPI** (*Pedoman Umum Pembentukan Istilah*, §4.5 semantic field disambiguation & §6.4 proper noun retention)
- **Ivan Lanin** (*Xenoglosofilia*, *Recehan Bahasa*, Narabahasa, 5 registers & *"Baku tak mesti kaku"*)
- **IndoMMLU & IndoLEM** (Koto et al., isolated polysemy resolution)
- **Widiastutik et al. (2026) & Azami et al. (2026)** (developer loanword retention)
- **Apple iOS, Google Android Help & AOSP `id-ID`** system string standards

---

## Contributing & Security

Contributions are welcome! Every contribution must be submitted via a Pull Request and reviewed by the repository maintainer before merging. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`AI_POLICY.md`](AI_POLICY.md) for our two-track contribution workflow, linguistic evidence requirements, and testing checklist.

For responsible disclosure of security vulnerabilities affecting any part of this project, please consult our [Security Policy](SECURITY.md).

---

## License

Released under the [MIT License](LICENSE).
