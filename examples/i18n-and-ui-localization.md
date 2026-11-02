# Examples: Software Localization (i18n) & Mobile UI Transformations

These real-world before-and-after comparisons come directly from production localization audits (including the 2,575-key UI pack and 5,632-exercise catalogue localization of **openGym**). They illustrate how `indonesian-linguist` resolves isolated string polysemy, tight UI overflow, form pronoun conflation, and absurd literal calques.

---

## 1. Isolated UI Key Polysemy & Button Verb Morphology

Without `indonesian-linguist`, models translate short i18n keys using their most frequent dictionary sense or active `me-` verbs:

```javascript
// ❌ BEFORE (Naive LLM Translation — 10 fatal UX/polysemy errors)
export default {
  'Back': 'Punggung',                                 // Anatomical back!
  'Clear rating': 'Peringkat yang jelas',             // Visual adjective + leaderboard rank!
  'Share': 'Membagikan',                              // Active me- verb on button
  'Fold away': 'Lipat',                               // Folding laundry
  'Discard running workout': 'Buang latihan lari',    // Sport of running!
  'Sets are drawn': 'Set diundi',                     // Lottery draw!
  'Logged workouts': 'Latihan yang login',            // Account login!
  'Light': 'Lampu',                                   // Lightbulb!
  'Right': 'Benar',                                   // Correct vs. Wrong!
  'Add exercise': 'Tambahkan olahraga',               // Generic 'sport' instead of exercise
}

// ✅ AFTER (With indonesian-linguist — 100% idiomatic interactive Indonesian)
export default {
  'Back': 'Kembali',
  'Clear rating': 'Hapus penilaian',
  'Share': 'Bagikan',
  'Fold away': 'Ciutkan',
  'Discard running workout': 'Buang sesi latihan yang sedang berjalan',
  'Sets are drawn': 'Set ditampilkan di grafik',
  'Logged workouts': 'Sesi latihan yang dicatat',
  'Light': 'Terang',
  'Right': 'Kanan',
  'Add exercise': 'Tambahkan latihan',
}
```

---

## 2. Tight Segmented Controls: Lexical Compaction vs. Banned SMS Slang

In mobile segmented pills (`.seg-inline`, `grid-auto-columns: 1fr`), verbose clauses get clipped with `...`, while chat abbreviations (`yg`, `dgn`) look amateurish:

```javascript
// ❌ BEFORE (Overflows pill width OR uses banned SMS slang)
export default {
  'As entered': 'Seperti yang dimasukkan',            // 23 chars — clips in 3-pill row
  'Same as work sets': 'Sama spt set kerja',          // Uses SMS slang 'spt' + calque 'set kerja'
  'Lose': 'Turunkan',
  'Gain': 'Tingkatkan',
  'Hold': 'Pertahankan',                              // 11 chars — overflows weight target pill
  'Completed exercises': 'Latihan yg selesai',        // Banned SMS slang 'yg'
}

// ✅ AFTER (With indonesian-linguist — crisp lexical compaction, zero slang)
export default {
  'As entered': 'Sesuai input',                       // 12 chars (-48% width)
  'Same as work sets': 'Ikuti set utama',             // 15 chars, idiomatic gym term
  'Lose': 'Turun',
  'Gain': 'Naik',
  'Hold': 'Jaga',                                     // 4 chars (-64% width)
  'Completed exercises': 'Latihan selesai',           // Zero relative pronoun
}
```

---

## 3. Semantic Field & Case-Sensitive Disambiguation (`Weight` & `Bodyweight`)

```javascript
// ❌ BEFORE (Conflates body weight, equipment filters, and lifting load)
export default {
  'Body weight': 'Berat badan',
  'body weight': 'Berat badan',                       // Breaks equipment filter tag!
  'Bodyweight': 'Berat badan',                        // Breaks load-mode selector!
  'weighted': 'tertimbang',                           // Statistical weighting!
  'Weight 30d': 'Berat 30h',                          // Ambiguous 'Berat' + cryptic '30h'
  'Weight ({0})': 'Berat ({0})',                      // Unnatural for lifting load column
}

// ✅ AFTER (With indonesian-linguist — exact semantic field separation)
export default {
  'Body weight': 'Berat badan',                       // User body mass on scale/chart
  'body weight': 'body weight',                       // Calisthenics equipment filter
  'Bodyweight': 'Bodyweight',                         // Routine load mode
  'weighted': 'dengan beban',                         // Calisthenics with external weight
  'Weight 30d': 'Berat badan 30 hari',                // Clear dashboard card header
  'Weight ({0})': 'Beban ({0})',                      // Lifting resistance table column
}
```

---

## 4. Form Antecedent Resolution, Navigation Verbs & Inanimate Pronouns

```javascript
// ❌ BEFORE (Circular antecedent, inverted navigation verb, inanimate 'ia/mereka')
export default {
  // Under 'E-mail (optional)' field:
  'Lets you sign in with it instead of your name. Nothing is ever sent to it.':
    'Memungkinkan kamu masuk dengan nama tersebut, bukan dengan namamu. Tidak ada yang dikirim ke sana.',

  // Under 'Skip completed exercises' toggle:
  'In Cards and Focus, Prev and Next hop over a finished exercise.':
    'Di Kartu dan Fokus, Sebelumnya dan Berikutnya lanjutkan latihan yang sudah selesai.',

  // Sync conflict modal:
  'First it checks whether the server has every change, then you choose what happens to them. Merge them.':
    'Pertama ia memeriksa apakah server memiliki setiap perubahan, lalu kamu memilih apa yang terjadi pada mereka. Gabungkan mereka.',
}

// ✅ AFTER (With indonesian-linguist — accurate antecedent, verb alignment, zero inanimate pronouns)
export default {
  'Lets you sign in with it instead of your name. Nothing is ever sent to it.':
    'Memungkinkan kamu masuk dengan alamat email tersebut, bukan dengan namamu. Tidak ada pesan apa pun yang akan dikirim ke sana.',

  'In Cards and Focus, Prev and Next hop over a finished exercise.':
    'Di Kartu dan Fokus, Sebelumnya dan Berikutnya melewati latihan yang sudah selesai.',

  'First it checks whether the server has every change, then you choose what happens to them. Merge them.':
    'Sistem akan memeriksa terlebih dahulu apakah server memiliki semua perubahan, lalu kamu bisa memilih tindakan untuk perubahan tersebut. Gabungkan perubahan.',
}
```

---

## 5. Gym & Developer Subculture Loanwords vs. Comical Calques

```javascript
// ❌ BEFORE (Comical machine calques)
export default {
  'Landmine': 'Ranjau darat',
  'Abductors': 'Penculik',
  'Traps': 'Perangkap',
  'Bench press': 'Pers bangku',
  'Power clean': 'Kekuatan bersih',
  'Seated good morning': 'Duduk selamat pagi',
  'Form-check': 'Pemeriksaan formulir',
  'API key': 'Kunci API',
  'Reverse proxy': 'Proksi terbalik',
  'iCloud Keychain': 'Rantai Kunci iCloud',
}

// ✅ AFTER (With indonesian-linguist — community & developer standards)
export default {
  'Landmine': 'Landmine',
  'Abductors': 'Abduktor',
  'Traps': 'Traps',
  'Bench press': 'Bench press',
  'Power clean': 'Power clean',
  'Seated good morning': 'Seated good morning',
  'Form-check': 'Cek form',
  'API key': 'API key',
  'Reverse proxy': 'Reverse proxy',
  'iCloud Keychain': 'iCloud Keychain',
}
```
