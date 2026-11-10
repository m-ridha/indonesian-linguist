# Examples: Indonesian Prose, Copywriting, UX & SEO Transformations

These examples compare standard LLM output (without `indonesian-linguist`) against output governed by `indonesian-linguist` across general translation, marketing copy, UX microcopy, and SEO.

---

## 1. Technical Documentation & Prose (Stripping Slop & Syntactic Calques)

**Prompt**: *"Translate and adapt this paragraph for our Indonesian documentation: `In today's fast-paced digital landscape, rate limiting is not only an option, but a necessity. When a client exceeds the ceiling, it receives a 429 response where they must wait before retrying.`"*

❌ **Without `indonesian-linguist`** *(6 defects: cliché opener, figurative 'lanskap', negative parallelism, 'tarif' & 'langit-langit' calques, inanimate 'ia/mereka', 'di mana' relative clause)*:
> Di era lanskap digital yang serba cepat saat ini, pembatasan tarif bukan hanya sekadar pilihan, melainkan sebuah keharusan yang krusial. Ketika klien melampaui langit-langit, ia akan menerima respons 429 di mana mereka harus menunggu sebelum mencoba kembali.

✅ **With `indonesian-linguist`** *(all six defects resolved: direct opening, accurate developer terminology, zero inanimate pronouns, natural connector)*:
> Pembatasan kuota permintaan (*rate limiting*) melindungi API dari lonjakan trafik berlebih. Saat jumlah permintaan klien melewati batas maksimal, server mengembalikan status `429 Too Many Requests` sehingga klien perlu menunggu sebelum mengirim permintaan ulang.

---

## 2. Social Media & Product Marketing Copy

**Prompt**: *"Write an Instagram announcement caption for 'Kasirin' POS app adding free QRIS payments until October 31, 2026 for small warungs."*

❌ **Without `indonesian-linguist`** *(em dash stylings, generic hook, unsubstantiated claims, 9 hashtags)*:
> Buat kamu pemilik warung, kedai kopi, sampai toko kelontong, ini kabar yang kamu tunggu-tunggu 👀 Di era digital ini, Kasirin hadir bukan hanya sebagai aplikasi kasir biasa, tetapi juga solusi finansial terbaik! Usaha lancar, transaksi gampang, cuan tetap utuh 💸
> `#Kasirin #AplikasiKasir #QRIS #UMKM #WarungNaikKelas #KedaiKopi #TokoKelontong #UsahaDigital #BisnisMudah`

✅ **With `indonesian-linguist`** *(concrete 80-char scene hook, zero slop, bounded claim, single CTA)*:
> Ada pembeli di warungmu pegang HP, bukan dompet. "Bisa bayar QRIS?" Kamu jawab apa?
>
> Sekarang jawabannya gampang: bisa.
> Kasirin sekarang bisa terima pembayaran QRIS untuk warung.
>
> Biaya pembayaran QRIS gratis sampai 31 Oktober 2026.
>
> Buka aplikasi Kasirin, lalu aktifkan QRIS di menu Pembayaran sekarang.
>
> `#kasirin #qriswarung #aplikasikasir #umkm`

---

## 3. Website UX Microcopy & Error States

| Scenario | ❌ Without `indonesian-linguist` | ✅ With `indonesian-linguist` |
| --- | --- | --- |
| **Upload Error** | *"Terjadi kesalahan. Upload gagal. Silahkan ulangi kembali lagi."* | **"Ukuran foto melebihi batas (maks. 5 MB). Kompres foto terlebih dahulu, lalu unggah lagi."** |
| **Destructive Modal** | *"Apakah Anda yakin ingin menghapus latihan ini?"* `[ Ya ]` `[ Tidak ]` | **"Hapus sesi latihan ini? Riwayat set dan PR di dalamnya tidak bisa dikembalikan."** `[ Batal ]` `[ Hapus ]` |
| **Landing Hero** | *"Selamat datang di platform kebugaran terbaik yang berkomitmen membuka potensi penuh tubuh Anda."* | **"Catat beban, repetisi, dan PR tanpa gangguan iklan. Berjalan lancar meski tanpa sinyal di dalam gym."** |

---

## 4. SEO Title Tags (`<title>`)

| Target Keyword | ❌ Without `indonesian-linguist` (Truncated, Title Case) | ✅ With `indonesian-linguist` (≤60 chars, Sentence case, front-loaded) |
| --- | --- | --- |
| `cara mengatur keuangan rumah tangga` | *Cara Mengatur Keuangan Rumah Tangga dengan Gaji UMR Pakai Rumus 50/30/20* (72 chars) | **Cara mengatur keuangan rumah tangga gaji UMR: rumus 50/30/20** (60 chars) |
| `jadwal latihan gym pemula` | *Panduan Lengkap Jadwal Latihan Gym Untuk Pemula Agar Cepat Berotot* (67 chars) | **Jadwal latihan gym pemula 3 hari seminggu (Full Body & PPL)** (59 chars) |
