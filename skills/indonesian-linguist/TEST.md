# Test Plan: `indonesian-linguist`

Offline manifest, link integrity, skill load limit, and deterministic audit checks run via `npm test` (see [`tests/manifests.test.js`](../../tests/manifests.test.js) and [`tests/audit-id.test.js`](../../tests/audit-id.test.js)).

## Interactive Behavioral Verification Checklist

When evaluating `/indonesian-linguist` interactively in chat (or against [`test_scenarios.yaml`](test_scenarios.yaml)), verify:

1. **Progressive Disclosure Routing**:
   - Reads only the relevant module(s) under `references/` for the task rather than loading every reference file at once.
2. **Target vs. Protected Artifacts**:
   - Keeps fenced code blocks, CLI commands, flags, file paths, and JSON keys untouched while localizing or editing target Indonesian strings.
3. **4-Way Verb Voice & Isolated UI Polysemy**:
   - Translates action buttons with `Zero`-prefix imperative verbs (`Simpan`, `Bagikan`, `Hapus penilaian`, `Kembali`) and status badges/completed states with `ter-` (`Tersimpan`, `Terhubung`, `Tercapai!`, `Total beban terangkat`).
   - Resolves `Clear rating` (`Hapus penilaian`), `Light` (`Terang`), `Right` (`Kanan`), `Discard running workout` (`Buang sesi latihan yang sedang berjalan`), and `Sets are drawn` (`Set ditampilkan di grafik`).
4. **Tight-Layout Lexical Compaction**:
   - Compacts segmented pill labels (`As entered` -> `Sesuai input`, `Same as work sets` -> `Ikuti set utama`, `Hold` -> `Jaga`) without using banned SMS abbreviations (`yg`, `dgn`, `utk`, `krn`, `tdk`).
5. **Anti-Slop & EYD V Compliance**:
   - Zero occurrences of `hiruk pikuk`, `di era digital`, `tidak dapat dipungkiri`, `adalah merupakan`, `dikarenakan`, `dalam rangka untuk`, or stylistic em dashes (`—`).
