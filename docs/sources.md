# Linguistic, Academic & Industry Sources (`docs/sources.md`)

Every rule, blacklist, and disambiguation in `indonesian-linguist` is grounded in official Indonesian language standards, peer-reviewed computational linguistics research, or verified industry localization corpora.

---

## 1. Official Indonesian Language Authorities (Badan Bahasa Kemendikdasmen)

1. **EYD Edisi V (*Ejaan Bahasa Indonesia yang Disempurnakan Edisi Kelima*, 2022)**:
   - Official portal: [ejaan.kemendikdasmen.go.id](https://ejaan.kemendikdasmen.go.id/)
   - Governs punctuation (mandatory serial comma before *dan/atau*, dash usage rules), capitalization (Sentence case vs. Title Case, capitalized `Anda`), affixation (`di-` vs. `di`, `meN-` assimilation), and bound forms (*nonaktif, antarmuka, pratinjau*).
2. **KBBI VI Daring (*Kamus Besar Bahasa Indonesia Edisi Keenam*)**:
   - Official portal: [kbbi.kemendikdasmen.go.id](https://kbbi.kemendikdasmen.go.id/)
   - Primary authority for standard lexical forms (*kata baku* vs. *tidak baku*, e.g., *silakan, sekadar, risiko, praktik, memengaruhi, mengubah, andal, cengkeram*).
3. **PUPI (*Pedoman Umum Pembentukan Istilah*) & PASTI (*Pangkalan Data Istilah*)**:
   - Governs semantic field disambiguation (§4.5: translating identical foreign root words differently depending on domain semantic field), proper noun and brand retention (§6.4), and loanword assimilation tiers.

---

## 2. Computational Linguistics & Localization Research

1. **IndoMMLU & IndoLEM Benchmarks (Koto, Aisyah, Li, & Baldwin, EMNLP 2023, `arXiv:2310.04928`; Koto et al., 2020)**:
   - Demonstrates how multilingual language models pretrained primarily on English corpora struggle with Indonesian morphosyntactic affixation (`meN-`, `di-`, `ter-`), formal/consultative register boundaries, and isolated polysemous tokens when stripped of sentence context. This motivates our explicit UI polysemy resolution tables (`Back`, `Clear`, `Light`, `Right`, `Running`, `Drawn`, `Scored`) and 4-way verb voice matrix.
2. **GoTo-AI & SEA-HELM / LINDSEA Linguistic Diagnostics (PT GoTo Gojek Tokopedia Tbk & AI Singapore, `GoTo-AI-Gemma-3-27B-IT`, `arXiv:2502.14301`)**:
   - Evaluates Indonesian instruction-following (`SEA-IFEval`, `SEA-MTBench`) and linguistic diagnostics (`LINDSEA`) across clitic pronouns (`-ku`, `-mu`, `-nya`), reduplication semantics, verbal diathesis (`meN-` vs. `di-` vs. `ter-`), and strict language consistency under formatting constraints.
3. **BRIN Linguistic Task Evaluation (Pusat Riset Bahasa, Sastra, dan Komunitas BRIN)**:
   - Highlights that surface fluency in generative AI does not guarantee morphosyntactic accuracy, semantic role preservation, or sociolinguistic appropriateness, requiring task-based and invariant-driven evaluation rather than superficial fluency checks.
4. **Developer & Technical Loanword Retention (Widiastutik et al., 2026; Azami et al., 2026)**:
   - Sociolinguistic and software engineering studies showing that Indonesian developers and technical users strongly prefer untranslated infrastructure terms (`API key`, `endpoint`, `reverse proxy`, `webhook`, `source code`, `token`) over artificial literal calques (*kunci API*, *titik akhir*, *proksi terbalik*).
5. **LLM Excess Vocabulary & Slop Markers (Kobak et al., *Science Advances*, 2025; Wikipedia *Signs of AI Writing*)**:
   - Empirical measurement of post-training lexical spikes in LLM outputs, adapted to their Indonesian calque equivalents (*hiruk pikuk*, *lanskap*, *ranah*, *krusial*, *menyelami*, *menggarisbawahi*, *menyoroti*, *garda terdepan*, *mercusuar*, *bukan hanya X, tetapi juga Y*).

---

## 3. Indonesian Stylistics, Identity & Practical Rhetoric

1. **Ivan Lanin: *Recehan Bahasa: Baku Tak Mesti Kaku* (Qanita, 2020), *Xenoglosofilia: Kenapa Harus Nginggris?* (2018), & Narabahasa**:
   - Source of our foundational maxim *"Baku tak mesti kaku, santai bukan sembarangan"*, the distinction between **Bahasa yang Benar** (grammatically compliant) and **Bahasa yang Baik** (contextually appropriate to the five registers: *beku, resmi, konsultatif, santai, akrab*), correlative conjunction pairing (`bukan ... melainkan ...` vs. `tidak ... tetapi ...`, `baik ... maupun ...`, `antara ... dan ...`), distributive determiners (`setiap` / `tiap-tiap` vs. `masing-masing`), `pun` detachment vs. the 12 attached conjunctions, and semantic contronyms/traps (`acuh` vs. `tak acuh`, `bergeming`, `nol` vs. `kosong`, `sanksi` vs. `sangsi`, `syarat` vs. `sarat`, `daripada`).
2. **Trigatra Bangun Bahasa in the Generative AI Era (Badan Bahasa Kemendikdasmen & Universitas Brawijaya)**:
   - Balances the three pillars (*Utamakan Bahasa Indonesia, Lestarikan Bahasa Daerah, Kuasai Bahasa Asing*): keeping Bahasa Indonesia as the primary structural matrix while avoiding both lazy anglicisms (where natural Indonesian exists) and caricature of regional dialects.
3. **Tata Bahasa Baku Bahasa Indonesia (Alwi et al., Edisi Keempat)**:
   - Governs human-only constraints on third-person personal pronouns (`ia`, `dia`, `mereka`), D-M (*Diterangkan-Menerangkan*) nominal modifier ordering, and relative clause construction (`yang`, `tempat`, `saat` instead of calqued `di mana` / `yang mana`).

---

## 4. Industry UX Writing & Subculture Corpora

1. **Apple Support Indonesia, Google Android Help Indonesia, & AOSP `id-ID` Locale Pack**:
   - Reference baseline for native mobile OS settings strings (`Aktif / Nonaktif`, `Selalu izinkan`, `Tak terbatas`, `Fungsi Geser`, `Layar tetap menyala`, `Ciutkan`).
2. **Indonesian Tech UX Writing Practice (Gojek, Tokopedia, tiket.com, Strava Indonesia)**:
   - Source for consumer pronoun conventions (`kamu / -mu` vs. `Anda`), the 4-pillar UX writing hierarchy (*Jelas, Ringkas, Konsisten, Berguna*), streak terminology (*minggu beruntun*), and actionable error/empty-state microcopy patterns.
3. **Indonesian Fitness & Strength Training Field Corpus (openGym Localization Study, 2026)**:
   - Empirical corpus built across 2,575 UI strings and 5,632 exercise definitions, cross-referenced with Indonesian commercial gym and coaching platforms (*latihanfisik.id, fitlink.id, ftlgym.com, primafit.com, naturalfarm.id*).
4. **Etika Pariwara Indonesia (EPI, Dewan Periklanan Indonesia)**:
   - Advertising self-regulatory standard prohibiting unverified superlative claims (*terbaik, nomor 1, paling murah*).
