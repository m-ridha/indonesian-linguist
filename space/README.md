---
title: Indonesian Linguist
emoji: 🇮🇩
colorFrom: emerald
colorTo: teal
sdk: static
pinned: false
---

# Indonesian Linguist: Indonesian Text and UI Localization Linter

Indonesian Linguist adalah linter teks dan pemeriksa lokalisasi antarmuka (UI microcopy) Bahasa Indonesia yang 100% deterministik, berjalan sepenuhnya di peramban (client-side), dan berlandaskan kaidah resmi **EYD V** (*Ejaan Yang Disempurnakan Edisi V*) serta **KBBI VI** (*Kamus Besar Bahasa Indonesia Edisi VI*).

Mesin analisis ditenagai langsung oleh aturan linguistik dari repositori [m-ridha/indonesian-linguist](https://github.com/m-ridha/indonesian-linguist).

## Fitur Utama

- **100% Deterministik**: Bekerja menggunakan pencocokan aturan dan kamus KBBI/EYD tanpa memanggil API model LLM (0 token LLM, tanpa risiko halusinasi).
- **Privasi Penuh (Client-Side Only)**: Teks atau berkas yang Anda masukkan diproses secara lokal di memori peramban tanpa pernah dikirimkan ke server eksternal mana pun.
- **Deteksi Format Otomatis**: Mendukung prosa bebas (Markdown, artikel, teks biasa) dan katalog lokalisasi JSON (`i18n` key-value).
- **Pembersihan Slop & Kalke**: Mendeteksi kalke terjemahan mesin (seperti `punggung` untuk tombol navigasi `Back`, `menandakan` untuk `Signs out`, `diundi` untuk `Sets are drawn`) dan klise AI (`di era digital`, `hiruk pikuk`, `adalah merupakan`).
- **Perbaikan Satu Klik**: Menerapkan perbaikan kata baku secara aman berurutan mundur (*reverse-order*) untuk mencegah pergeseran indeks karakter.
