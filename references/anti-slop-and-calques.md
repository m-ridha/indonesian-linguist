# Anti-Slop & English-to-Indonesian Calque Prevention

AI-generated Indonesian suffers from two distinct failure modes:
1. **AI Slop**: Inflated, generic filler vocabulary and rhetorical templates imported from English LLM post-training (*hiruk pikuk*, *di era digital ini*, *bukan hanya X, tetapi juga Y*).
2. **Syntactic Calques (*Terjemahan Harfiah Kaku*)**: Sentence structures that mirror English word-for-word while violating natural Indonesian syntax (`di mana` as a relative pronoun, `ia/mereka` for inanimate nouns, heavy nominalizations, passive overuse).

Use this reference to strip AI tells and English calques from any Indonesian text.

---

## 1. The Ten Zero-Tolerance Slop Categories

One violation in a sentence means the sentence must be rewritten from scratch.

### S1. Cliché Era & Generalization Openers
Never open an article, section, or paragraph with a truism that could apply to any topic:
- ❌ *"Di era digital yang serba cepat ini..."*
- ❌ *"Seiring perkembangan teknologi yang semakin pesat..."*
- ❌ *"Di zaman modern seperti sekarang..."*
- ❌ *"Tidak dapat dipungkiri bahwa..."*
- ❌ *"Dewasa ini, banyak orang yang..."*
- ✅ **Fix**: Start directly with the concrete problem, number, scene, or claim.

### S2. Ritual Closers
Never end with empty throat-clearing or formulaic sign-offs:
- ❌ *"Sebagai kesimpulan, dapat dikatakan bahwa..."*
- ❌ *"Demikianlah pembahasan mengenai... Semoga bermanfaat!"*
- ❌ *"Jadi, tunggu apa lagi? Yuk, mulai sekarang!"*
- ❌ *"Selamat mencoba!"*
- ✅ **Fix**: End with the final substantive point, next action step, or decision criterion.

### S3. Negative Parallelism Templates (`Bukan hanya X, tetapi juga Y`)
This is the single most overused syntactic pattern in LLM output:
- ❌ *"X bukan hanya soal A, tetapi juga tentang B."*
- ❌ *"Bukan sekadar X, melainkan sebuah Y."*
- ❌ *"X bukan lagi pilihan, melainkan keharusan."*
- ❌ *"Lebih dari sekadar aplikasi pencatat latihan..."*
- ✅ **Fix**: State directly what X does. (*"Aplikasi ini mencatat beban dan menghitung progres mingguanmu."*)

### S4. Empty Rule-of-Three Adjectives
- ❌ *"Cepat, mudah, dan terpercaya."*
- ❌ *"Solusi yang efektif, efisien, dan komprehensif."*
- ✅ **Fix**: Replace generic adjective triplets with one verifiable fact or mechanism (*"Proses verifikasi selesai dalam 3 menit"*).

### S5. Indonesian AI Slop Vocabulary List
These words spike unnaturally in machine-generated Indonesian (adapted from Kobak et al., *Science Advances* 2025, and Indonesian editorial corpora). Replace them immediately:

| Banned Slop Word / Phrase | Why It Fails | Natural Indonesian Replacement |
| --- | --- | --- |
| **hiruk pikuk** | #1 ChatGPT translation of *hustle and bustle*; almost never used in modern everyday prose | **kesibukan, keramaian**, or name the specific activity |
| **lanskap** *(figurative)* | Calque of *landscape* (*lanskap bisnis/digital*) | **kondisi, peta persaingan, dunia, industri** |
| **ranah** *(overused)* | Calque of *realm / domain* | **bidang, urusan, bagian** |
| **krusial** | Overused for `crucial / critical` | **penting, menentukan, utama, genting** |
| **menyelami / mengupas tuntas** | Calque of `delve into / deep dive` | **membahas, memeriksa, membedah, mempelajari** |
| **menggarisbawahi** | Calque of `underscore / underline` | **menegaskan, menunjukkan** |
| **menyoroti** *(figurative)* | Calque of `highlight / spotlight` | **menunjukkan, membahas, memperlihatkan** |
| **garda terdepan** | Cliché for `forefront / vanguard` | **terdepan, pelopor**, or state the concrete rank/fact |
| **mercusuar** *(figurative)* | Calque of `beacon` | Drop the metaphor entirely |
| **permadani / jalinan** *(figurative)* | Calque of `tapestry / intricate web` | **rangkaian, gabungan, hubungan** |
| **membuka potensi (penuh)** | Calque of `unlock (full) potential` | **memaksimalkan, meningkatkan hasil** |
| **mulus / tanpa hambatan** | Calque of `seamless` in software copy | **lancar, praktis, langsung tersambung** |
| **tangguh** *(for software/APIs)* | Calque of `robust` | **andal, stabil, kuat** |
| **bukti nyata komitmen** | Press-release filler (`testament to`) | State the concrete action or metric |
| **`game changer` / revolusioner** | Unsubstantiated hype | State what changed before vs. after |

### S6. Mechanical Transition Stacking
Do not start consecutive paragraphs with conjunctive adverbs (*Selain itu, Tidak hanya itu, Lebih lanjut, Namun demikian, Oleh karena itu, Dengan demikian, Di sisi lain*). Maximum one occurrence per transition phrase in a short document. Let paragraph order carry the logic.

### S7. Meta-Commentary & Throat-Clearing
- ❌ *"Artikel ini akan membahas tentang..."*
- ❌ *"Penting untuk dicatat bahwa..."*
- ❌ *"Perlu diketahui bahwa..."*
- ✅ **Deletion Test**: Delete the meta-clause. The remaining clause is always stronger.

### S8. Weasel Attribution & Stacked Hedges
- ❌ *"Para ahli menilai bahwa..."* / *"Sejumlah penelitian menunjukkan..."* (without citing who and when).
- ❌ *"Hal ini mungkin bisa jadi cenderung memberikan dampak..."* (stacked hedging).

### S9. Sycophantic Chat Openers
- ❌ *"Pertanyaan yang sangat menarik!"*, *"Tentu saja, dengan senang hati saya bantu!"*

### S10. Formatting Slop & Stylistic Em Dashes (`—`)
- **Em Dash Ban**: Never use the em dash (`—`) as stylistic LLM punctuation glue (e.g., *"Konsistensi, bukan motivasi, adalah kunci"*). Although EYD V formally permits *tanda pisah* (`—`) to set off explanatory appositives and to express *sampai dengan* (*2020-2026*, *Jakarta-Bandung*), this skill bans stylistic em dashes in prose to prevent AI punctuation slop; use commas, colons, parentheses, or separate sentences instead, and write out *sampai* or *hingga* for ranges in prose.
- **Title Case Abuse**: Indonesian headings and UI titles use **Sentence case** (only first word and proper nouns capitalized) or clean **Title Case** only on formal document titles, never capitalize prepositions/conjunctions (*di, ke, dari, dan, atau, yang, untuk*).

---

## 2. English-to-Indonesian Syntactic Calque Repairs

Even without AI buzzwords, direct translation from English often produces unnatural Indonesian sentence skeletons. Fix these five structural calques:

| English Structure | Stiff Indonesian Calque (AVOID) | Natural Indonesian Structure |
| --- | --- | --- |
| **Relative `where / in which`** (*"the folder where files are saved"*) | *folder **di mana** file disimpan* | **folder tempat file disimpan** |
| **Relative `which`** (*"a feature which lets you..."*) | *fitur **yang mana** memungkinkan kamu...* | **fitur yang memungkinkan kamu...** |
| **Inanimate `it / they / them`** (*"It checks the changes and merges them"*) | ***Ia** memeriksa perubahan dan menggabungkan **mereka*** | **Sistem memeriksa perubahan lalu menggabungkannya** |
| **Heavy Nominalization** (*"perform an analysis", "give an explanation", "experience an increase"*) | *melakukan analisis, memberikan penjelasan, mengalami peningkatan, melakukan pengecekan, melakukan penambahan* | **menganalisis, menjelaskan, naik / meningkat, mengecek / memeriksa, menambahkan** |
| **Non-Standard Causal `dikarenakan`** (*"This is caused by / due to..."*) | *Hal ini **dikarenakan** oleh...* (`dikarenakan` is non-standard; *karena* is a conjunction, not a verb root) | **Ini terjadi karena...** / **Disebabkan oleh...** |
| **Bureaucratic Padding** (*"can be done by", "in order to", "at this point in time", "there is a"*) | *dapat dilakukan dengan cara, dalam rangka untuk, pada saat ini, terdapat sebuah* | **caranya / bisa dengan, untuk, sekarang / saat ini, ada** |
| **Copula + Verb** (*"The goal is to improve..."*) | *Tujuannya **adalah untuk meningkatkan**...* | **Tujuannya meningkatkan...** |
| **Preposition Before Subject** (*"In this report shows..."*, *"For users who want..."*) | ***Dalam** laporan ini menunjukkan...* | **Laporan ini menunjukkan...** / **Dalam laporan ini ditunjukkan...** |
