# UI Localization, Isolated Polysemy & Interactive Grammar

When localizing software dictionaries (`id.js`, `id.json`, ARB, PO, `strings.xml`), strings often appear as isolated words or short fragments without surrounding context. As documented in Indonesian NLP benchmarks (**IndoLEM**, **IndoMMLU**) and **PUPI §4.5**, automated translation frequently maps isolated English words to the wrong part of speech or literal dictionary sense.

Use this reference to resolve UI polysemy, button verb morphology, form antecedents, and placeholder grammar.

---

## 1. Master Polysemy Resolution Table (UI & Interactive Controls)

Always translate isolated UI keys according to their **interactive role on screen**, never their literal anatomical, legal, or physical dictionary meaning:

| English Key / Phrase | Literal Calque Trap (NEVER USE) | Natural Indonesian UI Equivalent | Interactive Context & Rationale |
| --- | --- | --- | --- |
| **Back** | Punggung *(anatomical noun)* | **Kembali** | Navigation button to previous screen |
| **Clear** | Jernih *(visual adjective)* | **Bersihkan** / **Hapus** | Action to empty an input, filter, or history |
| **Clear rating** | Peringkat yang jelas | **Hapus penilaian** | `Clear` is an imperative verb; `rating` is an evaluation score |
| **Share** | Membagikan *(active me- verb)* | **Bagikan** | Imperative action button |
| **Copy** | Menyalin *(active me- verb)* | **Salin** | Clipboard action button |
| **Skip** | Melewati *(active me- verb)* | **Lewati** | Action to bypass onboarding or an item |
| **Hop over / skip / bypass** | Lanjutkan / meneruskan *(180° inverted!)* | **Melewati / melompati** | Navigation skipping over a completed/inactive item (e.g., *Prev and Next hop over a finished exercise* $\rightarrow$ **Sebelumnya dan Berikutnya melewati latihan yang sudah selesai**) |
| **Open** | Membuka *(active me- verb)* | **Buka** | Action to open a file, modal, or link |
| **Close** | Menutup *(active me- verb)* | **Tutup** | Action to close a dialog or sheet |
| **Fold away / Collapse** | Lipat *(folding laundry/paper)* | **Ciutkan** / **Tutup** | Accordion/collapsible UI control (paired with *Bentangkan / Tampilkan*) |
| **Undo** | Membuka *(lexical error)* | **Urungkan** / **Batal** | Action to revert the last change |
| **Dismiss** | Membubarkan *(dispersing a crowd)* | **Tutup** / **Abaikan** | Closing a banner, toast, or prompt |
| **Reset** *(verb)* | Menyetel ulang | **Atur ulang** | Restoring settings/state to default |
| **Reset everything** *(command)* | Kode atur ulang | **Atur ulang semuanya** | Imperative destructive action |
| **Reset code** *(noun phrase)* | Setel ulang kode *(verb)* | **Kode atur ulang** | Noun phrase for a recovery/reset token |
| **Save** | Menyimpan *(active me- verb)* | **Simpan** | Committing changes |
| **Done** | Dilakukan *(passive)* | **Selesai** | Confirmation button |
| **Cancel** | Membatalkan *(active me- verb)* | **Batal** | Dialog cancellation |
| **Delete / Remove** | Menghapus | **Hapus** | Destructive removal action |
| **Search** | Mencari *(active me- verb)* | **Cari** | Imperative search trigger |
| **Edit** *(button / modal)* | Sunting / Menyunting *(overly formal)* | **Edit** / **Ubah** | Consumer/companion apps prefer **Edit** (*Edit profil*, *Edit kartu*, *Edit catatan*, *Lanjutkan mengedit*) |
| **Fill in** | Mengisi | **Isi** / **Lengkapi otomatis** | Form input action |
| **Log** *(nav / action button)* | Catatan *(noun)* / Masuk *(login)* | **Catat** | Imperative verb to record an entry/workout |
| **Logged [workouts/items]** | Latihan yang login | **Sesi latihan yang dicatat** | Past participle of recording data, not account login |
| **Signs out / signs {0} out** | Menandakan *(to signify)* | **Mengeluarkan {0}** | Authentication sign-out action (e.g., *mengeluarkan akunmu dari browser ini*) |
| **Allow / Not allowed** | Mengizinkan / Tidak diperbolehkan | **Izinkan / Tidak diizinkan** | Permission grant button & status |
| **Withdraw** *(consent/permission)* | Menarik *(bank withdrawal)* | **Tarik izin** | Revoking privacy/data consent (always specify the object *izin*) |
| **Move up / Move down** | Naik / Turun | **Pindah ke atas / Pindah ke bawah** | Reordering list items or rows |
| **Advanced** | Canggih *(sophisticated)* | **Lanjutan** | Advanced settings menu |
| **Fine-tuning** | Penyempurnaan | **Penyesuaian** | Granular configuration controls |
| **Details** | *(left untranslated)* | **Detail** / **Rincian** | Item breakdown view |
| **On / Off** *(toggle state)* | Menyala / Mati *(lightbulb)* | **Aktif / Nonaktif** | Standard Apple & Android ID toggle states |
| **Light / Dark** *(theme)* | Lampu / Ringan | **Terang / Gelap** | Display appearance mode |
| **Right / Left** *(side/layout)* | Benar *(correct)* | **Kanan / Kiri** | Spatial orientation or anatomical side |
| **Compact** *(layout view)* | Kompak *(tight-knit group)* | **Ringkas** | Dense UI layout mode (*Kartu \| Daftar \| Ringkas*) |
| **Cards** *(layout view)* | Kartu-kartu *(plural reduplication)* | **Kartu** | Card layout mode |
| **floor** *(chart / heatmap)* | Lantai *(building floor)* | **batas bawah** | Minimum threshold on a chart or legend |
| **ceiling** *(quota / limit)* | Langit-langit *(room ceiling)* | **batas atas / batas maksimal** | Maximum cap or token limit |
| **Not scored / Not rated yet** | Tidak mencetak gol / Belum diberi peringkat | **Belum dinilai** | Item awaiting user evaluation/rating (not sports goal or leaderboard rank) |
| **Rate / Rating** *(effort/quality)* | Peringkat *(leaderboard rank)* | **Nilai / Penilaian** | Evaluating effort or quality (*Pilih penilaian*) |
| **Sets are drawn** *(chart)* | Set diundi *(lottery draw)* | **Set ditampilkan di grafik** | Graphical plotting on a canvas |
| **People** *(user count)* | Rakyat *(citizens/nation)* | **Pengguna / Orang** | Community or participant count |
| **Set current** | Atur arus *(electric current)* | **Jadikan aktif / Jadikan latihan aktif** | Marking an item as currently active |
| **Discard running [workout/task]** | Buang latihan lari | **Buang sesi latihan yang sedang berjalan** | `Running` = currently in progress, not the sport of running |
| **Session** | Sidang *(court/parliament)* | **Sesi** | App/workout session |
| **Round** *(circuit/interval)* | Bulat *(spherical)* | **Putaran** / **Ronde** | Interval or circuit round |
| **Pairs** *(equipment/items)* | Berpasangan | **Pasang** | Unit counter for paired items |
| **Added ({0})** | Ditambahkan ({0}) | **Tambahan ({0})** | Noun label for extra quantity/load added |
| **Land here** *(empty state)* | Mendarat di sini *(airplane)* | **Muncul di sini** | Empty-state microcopy for incoming items |
| **Live here** *(empty state)* | Tinggal di sini *(reside)* | **Tersimpan di sini** | Empty-state microcopy for stored items |
| **Back-to-back** *(timing)* | Punggung ke punggung | **Berurutan tanpa jeda** | Consecutive execution without rest |
| **Nudge** *(notification)* | Dorongan / Menyenggol | **Pengingat / Ingatkan** | Gentle reminder notification |
| **Catch up** *(data sync)* | Mengejar ketinggalan | **Sinkronisasi data / Tersinkronkan** | Background state synchronization |
| **Life happens** *(empathy copy)* | Kehidupan terjadi | **Ada urusan mendadak?** | Empathetic microcopy when a user misses a schedule |
| **Your call** *(privacy/choice)* | Panggilan kamu *(phone call)* | **Keputusanmu / Kendalimu** | User autonomy over settings |
| **Feel free to leave, it keeps going** | Jangan ragu untuk pergi, ini terus berlanjut | **Kamu boleh tinggalkan halaman ini, proses tetap berjalan** | Background job reassurance copy |

---

## 2. The 4-Way Verb Voice / Diathesis Matrix (`Zero` vs. `meN-` vs. `di-` vs. `ter-`)

As highlighted in Southeast Asian linguistic diagnostic benchmarks (**SEA-HELM / LINDSEA** and **IndoMMLU**), English-centric models frequently confuse Indonesian verbal voice prefixes when translating short UI labels vs. explanatory sentences:

| Indonesian Voice Form | Grammatical Role | Where to Use in Software & UI | Concrete Examples |
| --- | --- | --- | --- |
| **1. Base Verb (`Zero` prefix)** | Direct imperative command | Interactive buttons, menu actions, CTAs | **`Simpan`**, **`Hapus`**, **`Bagikan`**, **`Salin`**, **`Cari`**, **`Catat`**, **`Ciutkan`**, **`Izinkan`**, **`Jaga`** (never `Menyimpan` or `Mencari` on a button) |
| **2. Active (`meN-`)** | Agent-focused transitive action | Feature descriptions, onboarding prose, tooltips | *"Fitur ini **memungkinkan** kamu **mencatat** beban dan **memantau** progres."* |
| **3. Intentional Passive (`di-`)** | Patient-focused transitive process | Process explanations, confirmation warnings, chart descriptions | *"Data yang **dihapus** tidak bisa **dikembalikan**."*, *"Set **ditampilkan** di grafik."* |
| **4. Perfective / Stative (`ter-`)** | Completed state, status badge, or achieved milestone | Status pills, achievement banners, lifetime totals, disabled button states | **`Tersimpan`** (*Saved*), **`Terhubung`** (*Signed in / Connected*), **`Tercapai!`** (*Goal reached!*,  never dangling *dicapai!*), **`Terputus`** (*Disconnected*), **`Tak terbatas`** (*Unrestricted*), **`Total beban terangkat`** (*Lifted in total*) |

**Title vs. Subtitle Verb Harmony**:
Align the verb family in a setting row's subtitle with its title. If the setting title is **"Lewati latihan yang sudah selesai"** (*Skip completed exercises*), the explanatory subtitle must use the matching active verb **"melewati"** (*"...Sebelumnya dan Berikutnya melewati latihan yang sudah selesai"*).

---

## 3. Pronoun Antecedent Resolution in Form Captions

In UI forms, helper captions beneath an input field often use English neutral pronouns (`it`, `this`, `them`) to refer back to the field's label above.
- **Trap**: Translating `it` vaguely or binding it to a nearby noun inside the caption creates circular nonsense.
  - *Source (under `E-mail (optional)` input)*: `"Lets you sign in with it instead of your name. Nothing is ever sent to it."`
  - ❌ **Broken Antecedent**: *"Memungkinkan kamu masuk dengan nama tersebut, bukan dengan namamu..."* (Conflated `it` with `name`!)
  - ✅ **Explicit Entity Resolution**: **"Memungkinkan kamu masuk dengan alamat email tersebut, bukan dengan namamu. Tidak ada pesan apa pun yang akan dikirim ke sana."**
- **Rule**: Always replace `it` in form captions with the explicit noun of the input field (*alamat email tersebut*, *kata sandi ini*, *kunci API tersebut*).

---

## 4. Inanimate Pronoun Prohibition (`ia` / `mereka`)

In standard Indonesian grammar (EYD V / Tata Bahasa Baku Bahasa Indonesia), third-person pronouns **`ia`**, **`dia`**, and **`mereka`** are restricted to **human beings (insan)** or personified living creatures.
- **Trap**: English uses *it* and *they/them* for everything (servers, browsers, changes, workout sets, files). Translating these literally into *ia* or *mereka* is one of the most jarring translation calques in software localization.
- **Examples**:
  - *Source*: `"First it checks whether the server has every change... then you choose what happens to them. Merge them."`
  - ❌ **Calque**: *"Pertama ia memeriksa apakah server memiliki setiap perubahan... kamulah yang memilih apa yang akan terjadi pada mereka. Gabungkan mereka."*
  - ✅ **Natural Indonesian**: **"Sistem akan memeriksa terlebih dahulu apakah server memiliki semua perubahan... kamu bisa memilih tindakan untuk perubahan tersebut. Gabungkan perubahan."**
  - *Source*: `"They all go on the day below."` (referring to routines/exercises)
  - ❌ **Calque**: *"Mereka semua pergi pada hari di bawah."*
  - ✅ **Natural Indonesian**: **"Semuanya akan dijadwalkan pada hari di bawah ini."**

---

## 5. Binary Gender Collocation & Paradigm Symmetry

When localizing demographic selectors, body diagrams, or profile fields:
- Binary gender pairs MUST belong to the **same lexical register**:
  - Pair A (Modern UI / Lifestyle standard): **`Male: 'Pria'`** and **`Female: 'Wanita'`**
  - Pair B (Formal / Census / Medical standard): **`Male: 'Laki-laki'`** and **`Female: 'Perempuan'`**
- **Never mix registers** (e.g., *Pria* paired with *Perempuan* violates paradigmatic symmetry).

---

## 6. Plural Placeholders & Quantitative Syntax

1. **Number Precedes Noun**:
   In Indonesian, numerals and quantity placeholders always come **before** the noun they quantify:
   - ✅ **`{0} perubahan`**, **`{0} file`**, **`{0} foto`**, **`{0} hasil`**, **`{0} pengukuran`**, **`{0} minggu beruntun`**
   - ❌ *Perubahan `{0}`*, *File `{0}`* (unless `{0}` is an ID/index like *Set 1*, *Minggu ke-2*).
2. **No Plural Reduplication with Quantifiers or Metric Headers**:
   - When a number or quantifier is present, the noun stays singular: **`3 latihan`** (never *3 latihan-latihan*).
   - In dashboard metric headers, use the unmarked collective noun: **`Hari aktif`** (*Active days*), **`Kartu`** (*Cards*), **`Catatan`** (*Notes*), never *Hari-hari aktif* or *Kartu-kartu*.
