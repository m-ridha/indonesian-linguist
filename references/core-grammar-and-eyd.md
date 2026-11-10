# Core Indonesian Grammar, EYD Edisi V & Standard Vocabulary (`Kata Baku`)

This reference consolidates the authoritative rules of **EYD Edisi V** (*Ejaan Bahasa Indonesia yang Disempurnakan*, Badan Bahasa Kemendikdasmen), **KBBI VI**, and **PUPI** (*Pedoman Umum Pembentukan Istilah*).

Even in casual or conversational registers (*ragam santai*), spelling words correctly (`silakan`, `sekadar`, `risiko`, `praktik`, `mengubah`) is mandatory: **misspelling is not casual style. It is a typographical error.**

---

## 1. High-Frequency `Kata Baku` vs. `Tidak Baku` (KBBI VI)

Memorize and enforce these 80+ most frequently misspelled words in Indonesian digital content:

| ✅ Baku (Correct) | ❌ Tidak Baku (Wrong) | ✅ Baku (Correct) | ❌ Tidak Baku (Wrong) |
| --- | --- | --- | --- |
| **aktivitas** | aktifitas | **kreativitas** | kreatifitas |
| **analisis** | analisa | **kualitas** | kwalitas |
| **andal** | handal | **kuantitas** | kwantitas |
| **antre / antrean** | antri / antrian | **kuitansi** | kwitansi |
| **apa pun / siapa pun** | apapun / siapapun | **lembap** | lembab |
| **apotek** | apotik | **mangkuk** | mangkok |
| **asas** | azas | **memengaruhi** | mempengaruhi |
| **atlet** | atlit | **memerhatikan / memperhatikan** | perhatikan *(with meN-)* |
| **autentik** | otentik | **mengubah** | merubah |
| **bagaimana** | gimana *(formal/UI)* | **meterai** | materai |
| **baterai** | batere / batre | **metode** | metoda |
| **belum** | belom | **miliar** | milyard / milyar |
| **beri tahu** *(base)* | beritahu | **napas** | nafas |
| **besok** *(common / UI)* / **esok** *(literary / formal)* | | **narasumber** | nara sumber |
| **bus** | bis | **objek** | obyek |
| **cabai** | cabe | **olahraga** | olah raga |
| **camilan** | cemilan | **paham** | faham |
| **cedera** | cidera | **pascasarjana / pasca-** | paska |
| **cengkeram / cengkeraman** | cengkram | **peduli** | perduli |
| **detail** | detil | **perajin** | pengrajin |
| **diagnosis** | diagnosa | **periode** | perioda |
| **efektif** | efektip | **praktik** | praktek |
| **efektivitas** | efektifitas | **produktivitas** | produktifitas |
| **ekstrem** | ekstrim | **provinsi** | propinsi |
| **elite** | elit | **risiko** | resiko |
| **embus** | hembus | **jadwal** | jadual |
| **frekuensi** | frekwensi | **sekadar** | sekedar |
| **gizi** | gisi | **silakan** | silahkan |
| **hafal** | hapal | **sistem** | sistim |
| **hakikat** | hakekat | **standar** | standard |
| **hierarki** | hirarki | **standardisasi** | standarisasi |
| **hipotesis** | hipotesa | **subjek** | subyek |
| **imbau / imbauan** | himbau / himbauan | **tanggung jawab** *(base)* | tanggungjawab |
| **indra** | indera | **teknik / teknologi** | tehnik / tehnologi |
| **izin** | ijin | **terampil / keterampilan** | trampil / ketrampilan |
| **kapan pun / di mana pun** | kapanpun / dimanapun | **terima kasih** | terimakasih |
| **karier** | karir | **tetapi** | tapi *(formal)* |
| **kategori** | katagori | **utang** | hutang |
| **kerja sama** *(base)* | kerjasama | **wujud** | ujud |
| **komoditas** | komoditi | **zaman** | jaman |
| **komplet** | komplit | **Anda** *(always cap)* | anda |
| **kedaluwarsa** | daluwarsa, kadaluarsa, kadaluwarsa, kedaluarsa | | |

**Note on `kedaluwarsa`**: The KBBI VI standard form is **`kedaluwarsa`** (from Javanese *kadaluwarsa*, "past its prime"). The variants *daluwarsa*, *kadaluarsa*, *kadaluwarsa*, and *kedaluarsa* are all non-standard. Despite this, *kadaluarsa* is the dominant written form in everyday Indonesian, found in product labels, government notices, and major consumer apps. This is the same de-facto-acceptance pattern as *sekadar/sekedar*. **Use `kedaluwarsa` in UI strings** where correctness is testable and the context is neutral (error messages, subscription banners, passkey expiry screens). Be internally consistent: never mix `kadaluarsa` and `kedaluwarsa` within the same product.

---

## 2. Prefix `di-` / `ke-` vs. Preposition `di` / `ke` (EYD V)

1. **Passive Verb Prefix `di-` (Attached / *Dirangkai*)**:
   - If the word is a verb that has an active `me-` counterpart, write `di-` attached with no space:
   - ✅ *diunduh* (mengunduh), *ditampilkan* (menampilkan), *diubah* (mengubah), *diklik* (mengklik), *diatur* (mengatur), *diperbarui* (memperbarui).
2. **Locative / Temporal Preposition `di` & `ke` (Separated / *Dipisah*)**:
   - If the word indicates a place, direction, time, or question word, write `di` or `ke` separated by a space:
   - ✅ *di sini, di sana, di atas, di bawah, di dalam, di luar, di antara, di samping, di mana, di balik, ke atas, ke dalam, ke mana*.
   - *Exception*: `kepada`, `kemari`, `keluar` (only when functioning as an intransitive verb meaning to exit, vs. `ke luar` meaning toward the outside).

---

## 3. Morphophonemics: The `meN-` (KPST) Assimilation Rule

Root words starting with **K, P, S, T** followed by a vowel drop their initial consonant when prefixed with `meN-` or `peN-`:
- **K**: *kirim* $\rightarrow$ **mengirim**, *kelola* $\rightarrow$ **mengelola**, *kunci* $\rightarrow$ **mengunci**
- **P**: *pakai* $\rightarrow$ **memakai**, *pilih* $\rightarrow$ **memilih**, *pengaruh* $\rightarrow$ **memengaruhi** (NOT *mempengaruhi*), *perhatikan* $\rightarrow$ *memperhatikan* (because `per-` is a secondary prefix: `meN- + per- + hati + -kan` $\rightarrow$ **memperhatikan** is standard alongside *memerhatikan*, whereas `meN- + pengaruh + -i` has root *pengaruh* so only **memengaruhi** is standard!).
- **S**: *salin* $\rightarrow$ **menyalin**, *simpan* $\rightarrow$ **menyimpan**, *sunting* $\rightarrow$ **menyunting**
- **T**: *tulis* $\rightarrow$ **menulis**, *tambah* $\rightarrow$ **menambah**, *tarik* $\rightarrow$ **menarik**, *terjemah* $\rightarrow$ **menerjemahkan** (NOT *menterjemahkan*), *ubah* $\rightarrow$ **mengubah** (root is *ubah*, NOT *rubah*, so never *merubah*).
- *Cluster Exception*: Roots beginning with consonant clusters (`kr-`, `pr-`, `tr-`, `st-`, `sk-`, `sp-`, `kl-`) retain their initial consonant: **mengkritik**, **memproses**, **mempraktikkan**, **mentransfer**, **menstabilkan**.

---

## 4. Word Order (`Hukum D-M`: Diterangkan-Menerangkan)

Indonesian syntax places the **head noun (*Diterangkan*) first** and the **modifier (*Menerangkan*) second**:
- ✅ **media sosial** (not *sosial media*)
- ✅ **aplikasi kebugaran** (not *kebugaran aplikasi*)
- ✅ **Jadwal Tetap** (not *Minggu Tetap* for *Fixed Week*)
- ✅ **Set utama** (not *Kerja set* for *Work set*)
- ✅ **Perut Samping** (for *Side abs / Obliques*)
- *Exceptions*: Quantifiers, modal markers, and ordinal indicators precede the noun (*tiga latihan*, *setiap hari*, *paling berat*).

---

## 5. Effective Sentences (*Kalimat Efektif*) & Conjunctions

1. **Ban Pleonasms (*Kemubaziran Kata*)**:
   - ❌ *agar supaya* $\rightarrow$ ✅ **agar** or **supaya**
   - ❌ *adalah merupakan* $\rightarrow$ ✅ **adalah** or **merupakan**
   - ❌ *para hadirin / para pengguna-pengguna* $\rightarrow$ ✅ **hadirin / para pengguna**
   - ❌ *saling bantu-membantu* $\rightarrow$ ✅ **saling membantu** or **bantu-membantu**
   - ❌ *sangat penting sekali* $\rightarrow$ ✅ **sangat penting** or **penting sekali**
   - ❌ *sejak dari* $\rightarrow$ ✅ **sejak** or **dari**
   - ❌ *naik ke atas / turun ke bawah / mundur ke belakang* $\rightarrow$ ✅ **naik / turun / mundur** (except in UI reordering actions where spatial direction is contrasted: *Pindah ke atas / Pindah ke bawah*).
2. **No Correlative Double Conjunctions**:
   - Never pair *karena* with *maka* (*"Karena server sibuk, ~~maka~~ sinkronisasi ditunda"*).
   - Never pair *meskipun / walaupun* with *tetapi / namun* (*"Meskipun gratis, ~~tetapi~~ fiturnya lengkap"*).
3. **Intraclausal vs. Interclausal Conjunctions**:
   - `tetapi` and `sedangkan` are used **inside** a sentence after a comma (*"...data tersimpan lokal, tetapi belum disinkronkan"*).
   - `Namun,` and `Akan tetapi,` are used at the **start** of a new sentence followed immediately by a comma (*"Namun, data tersebut belum disinkronkan."*).
4. **Correlative Conjunction Pairs (*Konjungsi Korelatif*, Ivan Lanin, *Recehan Bahasa*)**:
   - **`bukan ... melainkan ...`** negates nouns/noun phrases (*"Ini **bukan** masalah beban, **melainkan** masalah teknik"*).
   - **`tidak ... tetapi ...`** negates verbs/adjectives (*"Gerakan ini **tidak** sulit, **tetapi** butuh fokus"*). Never cross-pair *bukan... tetapi* or *tidak... melainkan*.
   - **`baik ... maupun ...`** (never *baik... ataupun...*).
   - **`antara ... dan ...`** (never *antara... dengan...*: ✅ *Jeda antara set pertama dan set kedua*).
5. **Distributive Determiners (`setiap` / `tiap-tiap` vs. `masing-masing`)**:
   - **`setiap` / `tiap-tiap`** MUST be followed directly by a noun: ✅ *Setiap latihan memiliki target otot* / *Tiap-tiap pengguna*.
   - **`masing-masing`** stands alone without a following noun, or trails a possessive noun phrase: ✅ *Pengguna mengatur jadwalnya masing-masing*. ❌ Never write *"Masing-masing latihan memiliki target otot"*.
6. **Particle `pun`: Separated vs. the 12 Attached Conjunctions (EYD V)**:
   - Write `pun` **separated** whenever it means "also / even / ever" (*juga / saja*): **`apa pun`**, **`siapa pun`**, **`kapan pun`**, **`di mana pun`**, **`satu kali pun`**.
   - Write `pun` **attached** ONLY on the 12 lexicalized conjunctions: **`adapun`**, **`andaipun`**, **`ataupun`**, **`bagaimanapun`**, **`biarpun`**, **`kalaupun`**, **`kendatipun`**, **`maupun`**, **`meskipun`**, **`sekalipun`** *(meaning "even though"; write separated as `sekali pun` when meaning "even once")*, **`sungguhpun`**, and **`walaupun`**.
7. **Semantic Traps, Contronyms & Homophones (*Recehan Bahasa*)**:
   - **`acuh` vs. `tak acuh`**: In KBBI, **`acuh`** means *peduli* (to care/heed), NOT *cuek*! To mean "indifferent/ignoring", write **`tak acuh`** or **`mengabaikan`** (never *"Dia acuh terhadap peringatan"*).
   - **`bergeming`**: Root *geming* + `ber-` already means **diam / tidak bergerak sedikit pun** (*not moving an inch*). Prefer unambiguous **tetap diam / tidak bergerak** in UI and prose.
   - **`nol` vs. `kosong`**: Use **`nol`** (`0`) for the numeral/digit (*nol kilogram*, *angka nol*, phone/PIN digits). Use **`kosong`** for absence of content (*jadwal kosong*, *bar kosong*).
   - **`sanksi` vs. `sangsi`**: **`sanksi`** = penalty/consequence; **`sangsi`** = doubt/hesitant (*ragu-ragu*).
   - **`syarat` vs. `sarat`**: **`syarat`** = requirement (*syarat kata sandi*); **`sarat`** = full/loaded (*sarat manfaat*).
   - **`daripada`**: Use **only** for comparison (*lebih berat daripada minggu lalu*), never as a bureaucratic preposition for possession (*tujuan daripada latihan* $\rightarrow$ **tujuan latihan**).

---

## 6. Punctuation, Numbers, Currency & Code-Mixing Hyphenation (EYD V)

1. **Serial Comma (*Koma Perincian*)**:
   In Indonesian (EYD V), a comma **is required** before `dan` or `atau` in a list of three or more items:
   - *Correct*: *Squat, bench press, dan deadlift.*
2. **Numbers & Decimals**:
   - Indonesian uses a **period (`.`) for thousands** and a **comma (`,`) for decimals**: `1.250 kg`, `Rp150.000`, `2,5 kg`, `99,9%`.
   - Write currency without a space after `Rp`: **`Rp50.000`** (not *Rp 50.000* or *Rp. 50.000*).
3. **Bound Forms (*Bentuk Terikat*)**:
   Write bound prefixes attached without spaces: **`nonaktif`**, **`antarmuka`**, **`antarperangkat`**, **`pascabayaran`**, **`pratinjau`**, **`subkategori`**, **`multibahasa`**, **`ekstrakurikuler`**. Use a hyphen only when followed by a capitalized proper noun or acronym (*`non-Indonesia`*, *`pasca-PR`*).
   - **`antar-` + English loanword**: When `antar-` prefixes an unassimilated English loanword, attach without a hyphen if the compound reads naturally as one unit: **`antarset`** (*between sets, inter-set rest*). This follows the same bound-form logic as `antarmuka` and `antarperangkat`. In fitness and workout copy, always use **`antarset`** (not *antar set* or *antar-set*) in formal prose; *antar set* (spaced) is broadly accepted in informal editorial contexts (fitness journalism, lifestyle copy) but is non-standard.
4. **Code-Mixing Hyphenation on Foreign Roots (`EYD V`)**:
   When attaching Indonesian prefixes or enclitics (`di-`, `meN-`, `ter-`, `peN-`, `-nya`, `-mu`) to unassimilated foreign technical terms in developer or technical prose, always separate them with a **hyphen (`-`)**:
   - *Correct*: **`di-deploy`**, **`di-build`**, **`di-render`**, **`di-reset`**, **`commit-nya`**, **`endpoint-nya`**, **`PR-mu`**.
   - *Wrong*: *dideploy*, *dirender*, *commitnya*.

---

## 7. Pragmatic Particles & Anti-Caricature in Casual Register (*Ragam Santai*)

When writing in casual or conversational register (*ragam santai*):
1. **Pragmatic Function Over Decoration**:
   Indonesian conversational particles are not random filler. Each carries a specific pragmatic stance:
   - **`sih`**: Softens a statement, marks contrast, or invites reflection (*"Beban ini memang berat sih, tapi..."*).
   - **`dong`**: Assumes shared knowledge or warm encouragement. Never use in error messages or sensitive warnings.
   - **`deh`**: Hedges a suggestion or signals a decision (*"Coba mulai dari beban kosong dulu deh"*).
   - **`kok`**: Expresses reassurance or mild counter-expectation (*"Tenang, datamu tetap aman kok"*).
   - **`kan`**: Establishes common ground (*"Jadwalmu hari ini kaki, kan?"*).
   - **Rule**: Never stack multiple particles (`sih, dong, deh, kan`) in the same sentence.
2. **Sociolect & Regional Neutrality**:
   - Default to neutral standard or urban conversational Indonesian (`kamu / -mu`, or `Anda` in formal contexts).
   - Never assume `gue / lo` or regional dialect markers (`rek`, `mah`, `atuh`, `bah`, `ji`) from a user's name or location unless explicitly requested by the user or brand persona.
   - Never fabricate unverified regional language outputs or phonetic misspellings that turn into caricature.
3. **Three-Tier Distinction for Non-Standard Forms**:
   Not all departures from written standard Indonesian are the same. Before flagging or correcting a non-standard form, identify its tier:
   - **Tier A: Kata Baku Violations (Always Wrong in UI, Prose & Notifications)**: Misspellings of the KBBI VI standard form: *silahkan*, *sekedar*, *resiko*, *kadaluarsa* (when the product uses `kedaluwarsa` consistently). These are typographical errors regardless of register.
   - **Tier B: SMS/Chat Abbreviations (Always Wrong in UI & Product Copy)**: Compression abbreviations that destroy written credibility: `yg`, `dgn`, `utk`, `krn`, `tdk`, `bgt`, `dlm`. These are banned in all UI strings and professional writing. No register exception.
   - **Tier C: Phonological Contractions (*Ragam Akrab*)**: Spoken-register reductions of full standard words: **`udah`** (← *sudah*), **`nggak`** (← *tidak*), **`emang`** (← *memang*), **`banget`** (← *sangat*), **`tuh`** (← *itu*, pragmatic). These are **permitted only** when: (1) the product has an explicit *Akrab* persona decision for a specific surface (push notification tone, onboarding nudge, mascot dialogue), AND (2) the contractions are used consistently within that surface, not scattered throughout. They must not appear in error messages, security flows, data-deletion warnings, or any legally sensitive copy, regardless of brand persona.

---

## 8. Loanword Assimilation Tiering (PASTI, PUPI & Trigatra Bangun Bahasa)

Classify foreign terms into three tiers before deciding whether to translate:
1. **Tier 1, Established Indonesian Equivalents (*Lazim, Always Use Indonesian*)**:
   - *download / upload* $\rightarrow$ **unduh / unggah**
   - *link* $\rightarrow$ **tautan**
   - *online / offline* $\rightarrow$ **daring / luring** (in prose/docs; in mobile connectivity badges, **Online / Offline** is also acceptable if consistent)
   - *update* $\rightarrow$ **perbarui / pembaruan**
   - *preview* $\rightarrow$ **pratinjau**
   - *user* $\rightarrow$ **pengguna**
   - *settings* $\rightarrow$ **pengaturan**
   - *notification* $\rightarrow$ **notifikasi / pemberitahuan**
2. **Tier 2, Naturalized Domain Loanwords (*Retain Loanword, See `references/domains/`*)**:
   - Retain terms where the Indonesian community exclusively uses the loanword (*API key*, *endpoint*, *webhook*, *reverse proxy*, *Squat*, *Bench press*, *Dumbbell*, *Drop set*, *Superset*, *Bodyweight*, *Check-in*).
3. **Tier 3, Reject Obscure / Alienating Calques (*Kaku, Avoid in Consumer UI*)**:
   - Never force obscure coinages onto everyday users when they harm comprehension: avoid *tetikus* (use **mouse**), *peladen* (use **server** in consumer/dev UI), *nawala* (use **buletin / newsletter**), *cakram padat* (use **CD**), *rantai kunci* (use **keychain**).
