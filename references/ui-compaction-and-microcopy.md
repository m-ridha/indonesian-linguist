# UI Lexical Compaction, Tight Layouts & Microcopy Patterns

Indonesian translations expand character length by **20% to 35%** compared to English. In mobile interfaces, segmented controls (`.seg`), pill selectors, table column headers, and bottom navigation bars, naive translation causes text truncation (`ellipsis`), line-wrapping glitches, or layout overflow.

Use this reference to achieve **lexical compaction** without ever resorting to informal chat/SMS abbreviations.

---

## 1. Absolute Ban on Chat / SMS Abbreviations in UI

**NEVER** shorten UI strings using informal Indonesian text-messaging abbreviations. They destroy product credibility and read like an unedited draft:

| Banned SMS Slang | Standard Full Word | How to Compact Properly in Tight UI |
| --- | --- | --- |
| ❌ `yg` | **yang** | Drop `yang` via *Zero Relative Pronoun* (e.g., *Latihan selesai*, not *Latihan yg selesai*) |
| ❌ `dgn` | **dengan** | Use `via`, `pakai`, or a compound noun (e.g., *Masuk dengan Google* or *Sesuai input*) |
| ❌ `utk` | **untuk** | Replace with `ke`, `bagi`, or imperative verb phrasing |
| ❌ `krn` | **karena** | Restructure into cause-effect clauses or concise alerts |
| ❌ `tdk` / `gk` / `ga` | **tidak / belum** | Use `non-`, `tanpa`, or direct status (`Nonaktif`, `Belum dinilai`) |
| ❌ `bgt` | **sangat / sekali** | Use a stronger adjective (`berat`, `ketat`, `tinggi`) |
| ❌ `dlm` | **dalam** | Use `di` or omit where redundant |
| ❌ `spt` | **seperti** | Use `sesuai` or `mirip` |

---

## 2. Lexical Compaction Strategies for Segmented Controls & Pills

In segmented controls (`grid-auto-columns: 1fr`), every option shares equal width with the widest sibling. Apply these four compaction techniques:

### A. Nominal/Prepositional Compaction (Replace Relative Clauses)
Instead of translating English participles as long `Seperti yang di-...` clauses, use crisp noun phrases:

| English UI String | Bloated Clause (Clips in UI) | Compact UI Equivalent | Character Savings |
| --- | --- | --- | --- |
| **As entered** | *Seperti yang dimasukkan* (23 chars) | **Sesuai input** (12 chars) | **-48%** |
| **Same as work sets** | *Sama seperti set utama* (22 chars) | **Ikuti set utama** (15 chars) | **-32%** |
| **Hold** *(weight goal: Lose \| Gain \| Hold)* | *Pertahankan* (11 chars) / *Tahan* (ambiguous) | **Jaga** (4 chars: `[ Turun \| Naik \| Jaga ]`) | **-64%** |
| **Each** *(dumbbell weight mode)* | *Masing-masing dumbbell* (22 chars) | **Per dumbbell** / **Tiap tangan** (11-12 chars) | **-45%** |
| **Both** *(dumbbell weight mode)* | *Keduanya bersamaan* (18 chars) | **Total sepasang** (14 chars) | **-22%** |
| **Weight means** | *Berat artinya* (calque) | **Format input beban** / **Arti angka beban** | Clear & idiomatic |
| **Less / More time** | *Lebih sedikit / banyak waktu* | **Durasi lebih singkat / lebih lama** | Natural duration label |
| **Less / More volume** | *Volumenya lebih sedikit* | **Volume lebih sedikit / banyak** | Parallel metric structure |

### B. Zero Relative Pronoun (Dropping `yang`)
In Indonesian UI labels, `yang` before a stative verb or adjective can often be omitted cleanly:
- *Latihan yang selesai* $\rightarrow$ **`Latihan selesai`**
- *Perangkat yang terhubung* $\rightarrow$ **`Perangkat terhubung`**
- *Beban yang diangkat* $\rightarrow$ **`Beban terangkat`** (*Total beban terangkat*)

### C. Permitted Standard Abbreviations (KBBI & UI Convention)
Only use standard, officially recognized metric and editorial abbreviations when space is constrained:
- **Time & Duration**: `dtk` (detik), `mnt` (menit), `jam`, `hr` (hari, only in tight chart axes; prefer `hari`), `bln` (bulan), `thn` (tahun).
  - *Note*: On dashboard summary cards (e.g., `Weight 30d`), write **`Berat badan 30 hari`** rather than cryptic `30h`. Use `dtk` in compact table headers like **`Istirahat (dtk)`** (*Rest (s)*) or **`{0} dtk tahan`** (*{0}s hold*).
- **Units & Measures**: `kg`, `lb`, `cm`, `m`, `km`, `km/jam`, `kkal`, `%`.
- **UI Qualifiers**: `mis.` (misalnya, never *misal* or *cth* in formal/clean placeholders), `maks.` (maksimal), `min.` (minimal), `no.` (nomor), `vol.` (volume), `est.` / `perkiraan`.

---

## 3. Component-by-Component UX Writing Standards

Practitioners at major Indonesian digital products (Gojek, Tokopedia, tiket.com) follow four ordered principles: **Jelas** (Clear) > **Ringkas** (Concise) > **Konsisten** (Consistent) > **Berguna** (Helpful). Clarity always beats brevity, and both beat trying to be funny.

### A. Error Messages (*Pesan Galat*)
Every error message must state **what happened in plain human terms + how to fix it**, without blaming the user or exposing raw status codes:
- ❌ *"Terjadi kesalahan. Silahkan coba lagi."* (Vague + misspelled *silahkan*)
- ❌ *"Error 422: Unprocessable Entity"* (Raw developer jargon)
- ❌ *"Anda salah memasukkan format email."* (Blaming tone)
- ✅ **"Format email belum lengkap (contoh: `nama@email.com`)."**
- ✅ **"Kata sandi salah. Coba lagi, atau atur ulang lewat 'Lupa kata sandi'."**
- ✅ **"Koneksi terputus. Periksa jaringanmu, lalu coba lagi."**

### B. Empty States (*Layar Kosong*)
An empty state has three jobs: state that it is empty without sounding like an error, explain the value of filling it, and provide one clear action button:
- ❌ *"Tidak ada data ditemukan."* (Cold database output)
- ✅ **"Belum ada sesi latihan yang dicatat. Mulai latihan pertamamu agar grafik progres muncul di sini."** + `[ Mulai latihan ]`

### C. Destructive Confirmation Modals
Name the specific object and consequence in the heading/body, and make the confirm button echo the exact verb (never pair *"Apakah Anda yakin?"* with `[ Ya ]` / `[ Tidak ]`):
- ❌ *"Apakah Anda yakin ingin menghapus?"* `[ Ya ]` `[ Tidak ]`
- ✅ **"Hapus 3 sesi latihan? Data yang dihapus tidak bisa dikembalikan."** `[ Batal ]` `[ Hapus ]`

### D. Notifications & Push Copy
Lead with the actionable news in the first clause so it survives lock-screen truncation:
- ✅ **Title**: `Istirahat selesai 💪`, **Body**: `Saatnya set berikutnya.`
- ✅ **Title**: `Latihan direncanakan hari ini`, **Body**: `Sudah ada di jadwalmu. Ayo mulai latihan 💪`

**Register Decision for Push & Nudge Copy**:

Choose one register tier and apply it consistently to **all notifications on the same surface**. Never mix formal and intimate tones across nudge types on the same surface:

| Register | When to Use | Pronoun / Voice | Colloquial Contractions? |
| --- | --- | --- | --- |
| *Konsultatif* | SaaS, productivity, B2B, health data | `Anda` / `-nya` | No |
| *Santai* | Consumer lifestyle, fitness standard | `kamu` / `-mu` | No |
| *Akrab* | Explicit gym-buddy persona, mascot dialogue, motivational drill copy | `kamu` / `-mu` | ✅ Permitted (see §7.3 in core-grammar-and-eyd.md for Tier C contractions) |

When an app defines **multiple notification tones** (e.g., friendly, guilt, and drill, as in workout-missed nudges), each tone must still obey its declared register tier. A drill-sergeant tone can use *nggak* and *udah*. The same app's rest-timer push should stay *Santai* (`"Istirahat selesai. Saatnya set berikutnya."`). The tones are parallel surfaces. Each gets its own register, but neither bleeds into the other.

**Hard stops: no colloquial register regardless of persona**:
- Error messages and failure states (*"Gagal menyimpan. Coba lagi."*)
- Security, authentication, and permission prompts
- Data-deletion and destructive-action confirmations
- Subscription expiry and billing notices

**Caller & Lifecycle State Audit (Notifications & Shared Strings)**:
When reviewing notifications and system banners, verify the runtime trigger context:
- **Inspect all callers of a shared string**: If a string resource is reused across multiple events, verify that the wording accurately reflects every trigger condition.
- **Differentiate scheduled reminders from live execution**: A reminder saying a scheduled time *"has started"* is misleading if dispatched after the window ends or if the background worker hasn't run. Prefer neutral, action-oriented wording: **`Buka aplikasi untuk memeriksa alarm terjadwal.`**
- **Audit the source text first**: When a translated notification feels ambiguous or contradictory, check whether the English source itself conflated lifecycle states before attempting to fix it in Indonesian.

---

## 4. Text Expansion as Layout Guidance, Not a Test Invariant

Indonesian text expansion (+20% to +35%) is an empirical spatial layout guideline for UI containers and mobile viewports, **not** a validation invariant or test assertion:
- **Do not enforce the expansion-ratio heuristic in test suites**: Do not require `indonesianText.length > englishText.length`. Lexical compaction legitimately produces shorter Indonesian strings in many UI controls (e.g., *Lewati alarm berikutnya* vs *Lewati alarm terjadwal berikutnya*; *Sesuai input* vs *As entered*). Explicit maximum-length and layout-fit boundary tests (e.g., `text.length <= MAX_CHARS`) remain recommended.
- **Evaluate layout visually and dynamically**: Test UI strings on narrow viewports (320px–360px width) and with accessibility large-font scaling enabled (Dynamic Type / Android font scaling $\ge 1.5\times$).
- **Preserve semantic fidelity over artificial padding**: If a concise Indonesian translation accurately conveys the user action or message, keep it compact rather than inflating it to meet arbitrary length heuristics.
