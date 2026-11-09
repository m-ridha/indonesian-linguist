# Domain Glossary: Medical, Healthcare, Telemedicine & Clinical Patient UX

In telemedicine applications (e.g., *Halodoc, Alodokter, SatuSehat, Mobile JKN*), Electronic Medical Records (*Rekam Medis Elektronik* / RME), laboratory result portals, and patient information leaflets, literal machine translation is not merely awkward: it risks alarming patients or compromising medical safety. Automated translation engines frequently generate dangerous or bizarre calques, such as rendering *Patient discharge* as *Pemecatan pasien* or *Pelepasan muatan*, *Stool sample* as *Sampel bangku*, *Blood culture* as *Budaya darah*, *Over-the-counter* as *Di atas meja kasir*, and *Acute condition* as *Kondisi parah*.

Furthermore, Indonesian clinical documentation and healthcare communication are governed by statutory standards set by **Kementerian Kesehatan RI (Kemenkes)**, **Badan Pengawas Obat dan Makanan (BPOM)**, **BPJS Kesehatan**, and the orthographic standards of **KBBI VI** and **EYD Edisi V**.

Use this reference module whenever translating, localizing, or editing medical records, clinical decision support prompts, telemedicine chat interfaces, diagnostic lab results, and patient education materials.

---

## 1. Domain Overview & Register/Pronoun Lock

### A. Register Selection Across 5 Formality Levels
1. **Beku (Frozen, Statutory & Ritualized)**:
   - *Surfaces*: Statutory informed consent (*Persetujuan Tindakan Kedokteran* / PerMenKes), clinical liability waivers, organ donation pledges, death certificates, hospital bylaws, and statutory confidentiality oaths.
   - *Tone*: Unchanging, formulaic, highly solemn; enforceability as legally binding depends on the specific document and applicable statutory law (e.g., standard provider-exculpatory clauses may be void under consumer protection laws).
2. **Resmi (Formal)**:
   - *Surfaces*: Electronic Medical Records (RME), discharge summaries (*resume medis*), hospital admission documents, laboratory & pathology reports, and official BPOM package inserts / drug leaflets.
   - *Tone*: Objective, precise, clinically rigorous, emotionally neutral.
3. **Konsultatif (Consultative, Empathetic & Reassuring)**:
   - *Surfaces*: Telemedicine doctor-patient chat, appointment booking, triage questionnaires, symptom checkers, digital health companion apps, and patient education articles.
   - *Tone*: Warm, empathetic, clear, calm, and reassuring without sacrificing medical accuracy.
4. **Santai (Casual, restricted on clinical surfaces)**:
   - Casual speech (*nggak/udah*, colloquial particles) is strictly banned on clinical screens, diagnostic results, medication reminders, or consent dialogs, except for second-person pronouns specifically mandated by an explicit project voice or pronoun override (e.g., `--pronoun kamu`). Approved or prescribed Indonesian consent wording must remain unchanged even if it contains otherwise prohibited casual phrasing; however, approval of English source text does not block translating it into Indonesian (newly translated Indonesian copy must be formally approved before being treated as protected wording).
5. **Akrab (Intimate, BANNED by default)**:
   - Intimate slang (*gue/lo*, regional street slang) must never appear in healthcare or telemedicine user interfaces by default, unless an explicitly requested project voice or pronoun override (e.g., specialized peer companion bots) specifically mandates it. Newly authored consent dialogs remain strictly governed by formal/statutory register (Beku/Resmi) even when a project voice mandates intimate pronouns like *gue*; approved or prescribed Indonesian consent wording must remain unchanged even if it contains otherwise prohibited phrasing.

### B. Pronoun Policy: Mandatory Formal `Anda` by Default
- **Second-Person Address**: Strictly lock to **`Anda`** (always capitalized) by default across medical surfaces (including consumer health apps per `SKILL.md` Section 2.A.3), unless an explicitly requested project voice or pronoun override (e.g., `--pronoun lo` or `--pronoun kamu` for a specialized youth wellness bot) specifically mandates otherwise. Health data is personal, intimate, and legally sensitive; addressing patients with casual *kamu* or *-mu* diminishes clinical authority and trust unless deliberately branded.
- **Honorific Alternative**: In direct doctor-patient telemedicine chat or customer care scripts, **`Bapak/Ibu`** (or **`Pasien`**) is standard and respectful.
- **Drop the Pronoun (Implicit UI Controls)**: On interactive buttons and direct instructions, omit the pronoun entirely (*"Masukkan nomor rekam medis"*, not *"Masukkan nomor rekam medis Anda"*).
- **Third-Person Human Restraint**: Refer to inanimate entities (specimens, tests, medications, organs, servers) by repeating the noun or using demonstratives (*"Sampel tersebut"*, *"Data ini"*). Never use *ia* or *mereka* for medical equipment, test results, or physiological parameters.

---

## 2. Calque Traps, Polysemy & Clinical Disambiguation Table

The following table resolves high-frequency false cognates, machine calques, and polysemous terms in medical localization. Every entry prevents a specific translation error:

| English Source | Literal Calque Trap (BANNED) | Natural Indonesian / Clinical Standard | Context & Usage Notes |
| --- | --- | --- | --- |
| **Discharge / Patient discharge** | `Pelepasan muatan / Pemecatan pasien` | **Pemulangan pasien / Pasien pulang / Pasien rawat inap selesai** | Inpatient stay conclusion; never use *pemecatan* (job firing) or *pelepasan muatan* (cargo unshipping) |
| **Discharge summary** | `Ringkasan pelepasan / Ringkasan muatan` | **Ringkasan pulang / Resume medis** | Official statutory clinical document required upon hospital discharge |
| **Admission / Hospital admission** | `Pengakuan / Masuk pengakuan` | **Pendaftaran rawat inap / Admisi rawat inap** | Process of admitting a patient to a bed/ward |
| **Admitted to [hospital/ward]** | `Diakui ke` | **Dirawat di / Menjalani rawat inap di** | Patient inpatient status |
| **Stool / Stool sample / Stool test** | `Bangku / Sampel bangku / Tes kursi` | **Feses / Tinja / Sampel feses / Pemeriksaan feses** | Clinical laboratory specimen; *feses* is preferred in clinical reports, *tinja* in public health guidance |
| **Culture / Blood culture / Urine culture** | `Budaya darah / Kebudayaan urine` | **Kultur / Kultur darah / Kultur urine** | Microbiological incubation test to detect pathogens; note standard KBBI spelling **urine** (not `urin`) |
| **Smear / Pap smear / Blood smear** | `Noda / Coretan darah` | **Apusan / Pap smear / Apusan darah tepi** | Cytological or hematological slide preparation |
| **Positive / Negative** *(diagnostic test)* | `Bagus / Buruk / Menguntungkan` | **Positif / Negatif (Terdeteksi / Tidak terdeteksi)** | In pathology/virology, *positif* often means disease/pathogen presence; clarify with *Terdeteksi / Reaktif* where ambiguity alarms patients |
| **Acute** *(onset/duration)* | `Parah sekali / Kritis` | **Akut (terjadi mendadak / jangka pendek)** | In clinical medicine, *akut* denotes sudden onset or short duration, not necessarily severity; contrast with *kronis* |
| **Chronic** *(duration)* | `Berbahaya / Sangat parah` | **Kronis / Menahun (jangka panjang)** | Denotes persistence over months/years; *menahun* is the natural patient-facing explanation |
| **Over-the-counter (OTC)** | `Di atas meja kasir / Di atas meja` | **Obat tanpa resep** | General availability term (*obat tanpa resep*); for specific classification, check packaging (e.g. *Obat Bebas* vs. *Obat Bebas Terbatas* with warning labels) |
| **Prescription drug / Ethical drug** | `Obat etis / Obat resep moral` | **Obat keras / Obat resep (dengan resep dokter)** | BPOM red circle (*lingkaran merah bergaris tepi hitam dengan huruf K*) category |
| **Side effects** | `Efek sampingan` | **Efek samping** | Secondary pharmacological reaction; *efek sampingan* is grammatically non-standard |
| **Adverse drug reaction (ADR) / Adverse event** | `Peristiwa yang merugikan / Kejadian buruk` | **Kejadian tidak diinginkan (KTD) / Reaksi obat yang tidak diinginkan (ROTD)** | Formal Indonesian pharmacovigilance standard (BPOM / Kemenkes) |
| **Outpatient / Outpatient clinic** | `Pasien luar / Klinik luar` | **Rawat jalan / Poliklinik (Poli)** | Ambulatory care without overnight hospital stay |
| **Inpatient** | `Pasien dalam` | **Rawat inap** | Patient admitted to hospital bed overnight |
| **General Practitioner (GP)** | `Praktisi umum` | **Dokter umum** | Primary care physician |
| **Attending physician / Physician in charge** | `Dokter yang hadir / Dokter yang bertugas` | **Dokter Penanggung Jawab Pelayanan (DPJP)** | Official Indonesian hospital accreditation term for the primary managing specialist |
| **Medical record / Electronic Medical Record (EMR)** | `Catatan riwayat non-medis` | **Rekam medis / Rekam Medis Elektronik (RME)** | Statutory Indonesian terminology per Permenkes No. 24 Tahun 2022 (in patient-facing conversational copy, *catatan medis* is also widely used and accepted alongside *rekam medis*) |
| **Informed consent** | `Persetujuan yang diinformasikan` | **Persetujuan Tindakan Kedokteran (Informed Consent)** | Legal authorization signed before surgical/invasive procedures |
| **Referral / Referral letter** | `Surat penyerahan` | **Rujukan / Surat rujukan** | BPJS Kesehatan and hospital referral between primary (FKTP) and secondary/tertiary facilities (FKRTL) |
| **Triage** | `Penyortiran / Pemilahan` | **Triase** | Emergency room severity sorting (Merah, Kuning, Hijau, Hitam) |
| **Vitals / Vital signs** | `Tanda penting / Tanda vitalitas` | **Tanda-tanda vital (TTV)** | Clinical panel: blood pressure, pulse, respiration, temperature |
| **Blood pressure (BP)** | `Tekanan tensi` | **Tekanan darah** | Expressed as sistolik / diastolik (mmHg) |
| **Fasting blood sugar (FBS)** | `Gula darah cepat` | **Gula darah puasa (GDP)** | Diagnostic laboratory test for diabetes |
| **Complete Blood Count (CBC)** | `Hitungan darah lengkap` | **Darah lengkap (DL) / Hematologi lengkap** | Standard laboratory blood panel |
| **Urinalysis** | `Analisa urin` | **Urinalisis / Analisis urine** | Laboratory analysis of urine; note standard spelling **analisis** and **urine** |
| **Biopsy** | `Pemeriksaan potongan` | **Biopsi** | Tissue sample excision for histopathological evaluation |
| **Benign vs. Malignant** | `Baik vs Jahat` | **Jinak vs. Ganas** | Neoplasm / tumor classification |
| **Prognosis** | `Ramalan penyakit` | **Prognosis** | Medical forecast of disease progression and recovery chances |
| **Remission** | `Pengurangan / Pengampunan` | **Remisi** | Period where disease signs/symptoms abate or disappear |
| **Flare-up / Relapse** | `Kobaran api / Terbakar` | **Kekambuhan / Gejala kambuh** | Worsening or resurgence of chronic disease symptoms |
| **Refill** *(prescription)* | `Isi ulang resep` | **Tebus ulang resep / Penebusan resep lanjutan** | Dispensing recurring medication from an authorized prescription |
| **Dosage / Dose** | `Ukuran obat` | **Dosis / Takaran obat** | Prescribed quantity of pharmaceutical product |
| **Route of administration** | `Rute administrasi` | **Rute pemberian obat / Cara penggunaan** | Method of introducing drug into body (oral, intravena, topikal) |
| **NPO (Nil per os) / Fasting before surgery** | `Nol per mulut` | **Puasa makan dan minum / Pasien dipuasakan** | Clinical pre-operative restriction |
| **PRN (Pro re nata) / As needed** | `Untuk kelahiran ulang` | **Bila perlu / Jika diperlukan (p.r.n.)** | Dosage instruction when symptoms arise (e.g., fever/pain) |
| **Overdose** | `Pemberian berlebih yang salah` | **Overdosis / Kelebihan dosis** | Toxic dose administration |
| **Screening** *(medical)* | `Penyaringan` | **Pemeriksaan dini / Skrining kesehatan** | Proactive population or individual health check |
| **Check-up / Medical check-up (MCU)** | `Pemeriksaan medis` | **Pemeriksaan kesehatan menyeluruh / Medical check-up (MCU)** | Comprehensive diagnostic wellness evaluation |
| **Swab test** | `Uji sapu` | **Tes usap / Swab test** | Mucosal specimen collection |
| **Emergency Room (ER) / Emergency Department (ED)** | `Ruang darurat` | **Instalasi Gawat Darurat (IGD)** | Statutory hospital department |
| **Intensive Care Unit (ICU)** | `Unit perhatian intensif` | **Unit Perawatan Intensif (ICU)** | Critical care inpatient facility |
| **High Care Unit (HCU)** | `Unit perawatan tinggi` | **High Care Unit (HCU)** | Intermediate critical care step-down unit |
| **Operating Room (OR) / Theatre** | `Teater operasi` | **Kamar operasi / Kamar bedah (OK - Operatie Kamer)** | Surgical suite |

---

## 3. High-Frequency Medical `Kata Baku` Enforcement (KBBI VI)

Medical and health documentation in Indonesia is frequently compromised by colloquial or legacy Dutch spellings. Enforce these standard forms strictly:

| ✅ Kata Baku (KBBI VI) | ❌ Bentuk Tidak Baku | Etymology / Confusion Context |
| --- | --- | --- |
| **diagnosis** | `diagnosa` | Standard scientific loan from Greek/English; avoid Dutch *-ose* calque |
| **praktik** | `praktek` | Applied to medical doctor's clinic (*praktik dokter*, *izin praktik*) |
| **apotek** | `apotik` | Pharmacy dispensary facility (*apotek*, but derived role is **apoteker**) |
| **napas** | `nafas` | Respiration (*sesak napas*, *alat bantu napas*) |
| **cedera** | `cidera` | Physical bodily harm/trauma (*cedera kepala*, *cedera otot*) |
| **urine** | `urin` | Excretory fluid; KBBI VI codifies standard terminal *-e* |
| **analisis** | `analisa` | Laboratory test evaluation (*analisis darah*, *analisis urine*) |
| **kanker** | `kangker` | Malignant neoplastic disease |
| **infeksi** | `inpeksi` | Microbial invasion |
| **kuitansi** | `kwitansi` | Payment receipt for clinic/hospital reimbursement |
| **ambulans** | `ambulan` | Emergency transport vehicle |
| **antrean** | `antrian` | Outpatient clinic queue (*nomor antrean*) |
| **steril / sterilisasi** | `seteril / sterilisir` | Decontamination of surgical instruments |
| **virus** | `firus` | Infectious micro-agent |
| **frekuensi** | `frekwensi` | Heart/respiratory rate frequency (*frekuensi napas*) |
| **skrining** | `screening / skriningan` | Health screening; assimilated standard loanword |

---

## 4. Retained Community, Clinical & Regulatory Loanwords

### A. Indonesian Statutory & Health System Acronyms (Retain Intact)
In Indonesian healthcare UX, these statutory acronyms are universally recognized by patients, doctors, and insurers:
- **BPJS Kesehatan**: *Badan Penyelenggara Jaminan Sosial Kesehatan* (national health insurance).
- **JKN**: *Jaminan Kesehatan Nasional* (national health insurance program; app: *Mobile JKN*).
- **SatuSehat**: National digital health platform and patient data exchange by Kemenkes RI.
- **RME**: *Rekam Medis Elektronik* (mandatory electronic health record standard).
- **IGD**: *Instalasi Gawat Darurat* (emergency department; avoid translating as *ER* in Indonesian text).
- **ICU / NICU / PICU**: *Intensive Care Unit / Neonatal ICU / Pediatric ICU*.
- **DPJP**: *Dokter Penanggung Jawab Pelayanan* (chief attending physician).
- **FKTP**: *Fasilitas Kesehatan Tingkat Pertama* (primary care clinic/Puskesmas).
- **FKRTL**: *Fasilitas Kesehatan Rujukan Tingkat Lanjut* (referral hospital).
- **SIP**: *Surat Izin Praktik* (doctor's statutory medical practice license).
- **STR**: *Surat Tanda Registrasi* (medical council registration certificate).

### B. BPOM RI Drug Classification Symbols & Terms
When presenting pharmaceutical information in telemedicine carts or drug dictionaries, align with BPOM packaging classes:
1. **Obat Bebas** (Green circle with black border): Can be bought freely without prescription (e.g., parasetamol).
2. **Obat Bebas Terbatas** (Blue circle with black border, with warning labels P.No. 1 to P.No. 6): Over-the-counter with cautionary instructions.
3. **Obat Keras** (Red circle with black border and black letter **K**): Prescription-only ethical medication (e.g., antibiotik, obat hipertensi).
4. **Obat Golongan Narkotika** (White circle with red border and red cross): Strictly controlled substances.
5. **Obat Golongan Psikotropika** (Red circle with black border and black letter **K**): Strictly controlled psychoactive pharmaceuticals.

### C. Retained Global Medical Loanwords
Keep these terms intact or in standard bracketed loan form; do not force awkward indigenization:
- **Stetoskop, Termometer, Tensimeter (Sphygmomanometer)**.
- **USG (Ultrasonografi), Rontgen (X-Ray), CT Scan, MRI, EKG (Elektrokardiogram)**.
- **Pap smear, Biopsi, Endoskopi, Kolonoskopi**.
- **Infus (Intravenous line), Kateter, Ventilator**.

---

## 5. Telemedicine & Patient Portal UX Microcopy Patterns

### A. Action Buttons & Directives (Base Imperatives / Zero-Prefix)
Interactive controls on patient booking, telemedicine consultations, and laboratory check-out must use base imperative verbs:
- `Book appointment` $\rightarrow$ **`Jadwalkan Konsultasi / Buat Janji Medis`** (never *Membuat janji*)
- `Consult now` $\rightarrow$ **`Konsultasi Sekarang`**
- `Upload prescription` $\rightarrow$ **`Unggah Resep Dokter`**
- `Redeem prescription` $\rightarrow$ **`Tebus Resep`**
- `Buy medicine` $\rightarrow$ **`Beli Obat`**
- `View lab results` $\rightarrow$ **`Lihat Hasil Lab`**
- `Download medical resume` $\rightarrow$ **`Unduh Resume Medis`**
- `Choose doctor` $\rightarrow$ **`Pilih Dokter`**
- `Call ambulance` $\rightarrow$ **`Panggil Ambulans`**

### B. Consultation & Order Status Badges
- `In queue` $\rightarrow$ **`Dalam antrean`** (or **`Menunggu antrean`**)
- `Doctor is typing` $\rightarrow$ **`Dokter sedang mengetik…`**
- `Prescription issued` $\rightarrow$ **`Resep dokter terbit`**
- `Medicine prepared` $\rightarrow$ **`Obat selesai disiapkan`**
- `Delivered` $\rightarrow$ **`Pesanan diterima`** (or **`Terkirim`**)
- `Completed` $\rightarrow$ **`Selesai`**
- `Cancelled by patient` $\rightarrow$ **`Dibatalkan oleh pasien`**
- `Follow-up required` $\rightarrow$ **`Perlu kontrol lanjutan`**

### C. Reassuring Patient Messaging (Anti-Panic & Empathy Invariant)
Clinical findings and system issues must never be translated in a sensationalist or alarmist manner:
- ❌ *Hasil tes Anda positif dan berbahaya!*
- ✅ *Hasil tes menunjukkan hasil positif (terdeteksi). Dokter kami siap mendiskusikan langkah perawatan selanjutnya dengan Anda.*
- ❌ *Gagal menghubungkan ke dokter, kondisi Anda berisiko.*
- ✅ **Sebelum konsultasi dimulai (Gagal terhubung)**: *Belum berhasil terhubung ke dokter. Silakan periksa koneksi internet Anda atau coba hubungkan kembali.*
- ✅ **Saat konsultasi sedang berlangsung (Koneksi terputus)**: *Koneksi terputus saat konsultasi berlangsung. Kami sedang mencoba menyambungkan Anda kembali secara otomatis… Jika sambungan belum pulih, silakan ketuk "Hubungkan Ulang" atau hubungi layanan bantuan.*
