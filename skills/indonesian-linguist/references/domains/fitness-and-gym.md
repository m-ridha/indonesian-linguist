# Domain Glossary: Fitness, Gym & Strength Training Subculture

In fitness, strength training, and workout tracking applications (such as *openGym*), rigid dictionary translation produces terms that no Indonesian gym-goer, coach, or athlete ever says in real life. Field research across Indonesian fitness platforms (*latihanfisik.id, fitlink.id, ftlgym.com, primafit.com, naturalfarm.id*, and Strava Indonesia) demonstrates that the Indonesian fitness community systematically retains specific English loanwords while using natural Indonesian for mechanics, anatomy, and metrics.

Use this reference whenever localizing or writing about workouts, gym equipment, exercise catalogues, body metrics, or fitness coaching.

---

## 1. Fundamental Disambiguations (Read First)

### A. `Workout` vs. `Exercise`
- **`Workout`**: Translate as **`sesi latihan`** or **`latihan`** (referring to the overall training session or logged history).
- **`Exercise`**: Translate as **`latihan`** or **`gerakan`** (referring to a specific movement inside a routine or catalogue).
- **CRITICAL BAN**: **NEVER** use the word *"olahraga"* on action buttons or workout builder labels (e.g., `Add exercise` is **`Tambahkan latihan`**, never *"Tambahkan olahraga"*).

### B. Semantic Field & Case-Sensitive Disambiguation: `Body weight` / `Bodyweight` / `Weight` (PUPI §4.5)
An English fitness app uses the words *weight* and *bodyweight* across four distinct semantic fields. Translate each according to its exact UI role and capitalization:

| Exact Source Key | UI / Domain Context | Mandatory Indonesian Translation | Why / Trap to Avoid |
| --- | --- | --- | --- |
| **`'Body weight'`** *(capital B, space)* | User body mass metric on weigh-in screens & body trend charts | **`'Berat badan'`** | Refers to the user's physical mass on a scale |
| **`'body weight'`** *(lowercase, space)* | Equipment/category filter in the exercise catalogue (*pull-up, push-up, dip*) | **`'body weight'`** *(or kalistenik)* | Translating equipment filter `body weight` as *Berat badan* confuses equipment type with body mass |
| **`'Bodyweight'`** *(single word)* | Load mode in routine builder & progression settings | **`'Bodyweight'`** | Standard fitness term for bodyweight training mode; never translate as *Tubuh Penuh* or *Berat badan* |
| **`'weighted'`** *(exercise/equipment)* | Calisthenics performed with external load (*weighted pull-up/dip*) | **`'dengan beban'`** | Never translate as *tertimbang* (which means statistical weighting!) |
| **`'Weight 30d'`** | 30-day body weight summary card on dashboard | **`'Berat badan 30 hari'`** | Explicitly specify *Berat badan* on body-metric cards; never use cryptic *Berat 30h* |
| **`'Weight ({0})'`** / **`'Load'`** | Table column header for lifting resistance in a workout set | **`'Beban ({0})'`** / **`'Beban'`** | In Indonesian gym usage, you lift **beban** (*load*), not *berat* |
| **`'Hold'`** *(weight goal: Lose \| Gain \| Hold)* | Body-weight maintenance target in segmented control | **`'Jaga'`** (`[ Turun \| Naik \| Jaga ]`) | Compact (4 chars) and natural for maintaining body weight (*jaga berat badan*) |
| **`'Hold'`** / **`'{0}s hold'`** *(isometric)* | Isometric exercise duration (*plank, dead hang*) | **`'Tahan'`** / **`'{0} dtk tahan'`** | For longest isometric duration (`Longest hold per workout`), use **`Durasi tahan terlama per sesi`** (never *Penahanan*, which means police detention!) |
| **`'Back'`** *(capital B)* | UI navigation button | **`'Kembali'`** | Interactive screen navigation |
| **`'back'`** *(lowercase b)* | Anatomical muscle group filter in exercise catalogue | **`'punggung'`** | Lowercase muscle tag in catalogue filter (`chest`, `back`, `shoulders`) |

---

## 2. Standard Indonesian Gym Community Loanwords & Equivalents

Never force stiff literal translations onto terms that have established Indonesian gym equivalents or retained loanwords:

| English Term | Stiff Machine Calque (NEVER USE) | Natural Indonesian Gym Standard | Context & Usage Notes |
| --- | --- | --- | --- |
| **Gym / At the gym / My gym** | Sasana / Gimnasium / Di gimnasium | **Gym / Di gym / Gym saya** | Universal daily usage |
| **Check in / Check-out** | Lapor masuk / Lapor keluar | **Check-in / Check-out** | Gym arrival, QR access, geofence check-in |
| **Working set / Work set** | Perangkat kerja / Set pekerjaan | **Set utama** | Primary target sets (*Make it a warm-up set* $\rightarrow$ **Jadikan set pemanasan**) |
| **Warm-up set** | Set hangat | **Set pemanasan** | Preparatory lighter sets |
| **Ramp-up sets** | Set peningkatan | **Set ramp-up** | Progressive feeder sets leading to working weight |
| **Drop set / Drop-set** | Set penurunan / Jatuhkan set | **Drop set / Drop-set** | Immediate weight reduction without rest |
| **Rest-pause** | Istirahat-jeda meledak | **Rest-pause** | Brief intra-set pause at near-failure |
| **Back-off set** | Set mundur | **Back-off set** | Lighter volume set after top set |
| **Superset** | Kumpulan super | **Superset** | Two exercises performed back-to-back |
| **Deload** | Membongkar / Pelepasan muatan | **Deload / Penurunan beban** | Planned recovery week with reduced intensity/volume |
| **Failure / Last set to failure** | Kegagalan total / Set terakhir hingga gagal | **Failure** / **Set terakhir hingga tak kuat lagi** | Muscular failure point (or *hingga failure*) |
| **Intensifier** | Penguat | **Peningkatan Intensitas** | High-intensity training technique (drop set, rest-pause) |
| **Push / Pull / Legs (PPL)** | Dorong / Tarik / Kaki | **Push / Pull / Leg** | Canonical training split name |
| **Upper / Lower** | Atas / Bawah | **Upper / Lower** | Canonical upper/lower body split name |
| **Full Body** | Tubuh Penuh / Seluruh tubuh | **Full Body** | Canonical full-body routine split name |
| **Starter plan** | Rencana awal | **Rencana dasar** | Foundational beginner program |
| **The loop / Your loop** | Lingkaran / Perulangan | **Rotasi / Rotasi kamu** | Rotating training cycle independent of calendar weekdays |
| **Fixed Week** | Minggu Tetap | **Jadwal Tetap** | Fixed weekday training schedule |
| **Personal Record (PR) / New best** | Catatan pribadi / Baru yang terbaik | **PR / Rekor pribadi / Rekor terbaik baru (PR)** | Personal best lift (`Last PR` $\rightarrow$ **PR terakhir**) |
| **Exercise Library** | Perpustakaan latihan | **Katalog latihan** | Searchable database of exercises |
| **Progression (Linear / Double / Triple)** | Kemajuan / Perkembangan linier | **Progresi (linear / ganda / tripel)** | Overload methodology; always use **progresi / progres** |
| **Top of the range** *(progression)* | Puncak rentang / Di atas | **Batas atas repetisi / batas atas rentang repetisi** | Reaching maximum reps in double/triple progression (e.g. 12 reps in 8-12 scheme), signaling ready to increase load |
| **Progress photos** | Foto kemajuan | **Foto progres** | Visual physique tracking photos |
| **Effort per set** | Upaya per set | **Tingkat usaha per set** | RPE / RIR effort logging setting |
| **Cutting & Lean bulk** | Pemotongan & potongan tanpa lemak | **Fase cutting & Lean bulk** | Body composition phases |
| **Thibaudeau (Powerlifting)** | Thibaudeau (angkat beban) | **Thibaudeau (Powerlifting)** | Keep *Powerlifting* intact as a sport name |
| **Five sets of five** | Lima set lima | **Lima set lima repetisi (5x5)** | Classic strength program structure |

---

## 3. Blacklist of Literal Calques (Movements, Equipment, Anatomy & Features)

Automated translators notoriously mangle exercise names, gym equipment, and muscle groups. Strictly enforce this blacklist:

| Source Term (EN) | Comical Machine Calque (BANNED) | Correct Indonesian Equivalent | Category & Notes |
| --- | --- | --- | --- |
| **Squat / Back squat / Front squat** | Jongkok / Jongkok punggung / Jongkok depan | **Squat / Back squat / Front squat** | Movement name (retain English) |
| **Bench press / Incline press** | Pers bangku / Pers bangku miring | **Bench press / Incline bench press** | Movement name (retain English) |
| **Military press / Overhead press** | Pers militer / Pers di atas kepala | **Military press / Overhead press** | Movement name (retain English) |
| **Romanian deadlift (RDL)** | Deadlift Rumania | **Romanian deadlift** | Movement name (retain English) |
| **Nordic curl / Bicep curl** | Ikal Nordik / Ikal bisep | **Nordic curl / Bicep curl** | `Curl` = joint flexion, never hair curls (*ikal*) |
| **Power clean** | Kekuatan bersih | **Power clean** | Olympic weightlifting movement |
| **Seated good morning** | Duduk selamat pagi | **Seated good morning** | Hip-hinge exercise name |
| **Barbell / Bar only** | Batang besi / Hanya bilah | **Barbel / Hanya barbel kosong (Hanya bar)** | Unloaded barbell without plates |
| **Dumbbell / Dumbbells** | Halter *(archaic)* | **Dumbbell** | Modern gym standard |
| **Weight plate / Plate loading** | Piringan / Pemuatan pelat | **Plat beban / Beban plat (plate loading)** | Plate-loaded machines & barbell plates |
| **Weight stack / Single stack** | Tumpukan berat / Tumpukan tunggal | **Tumpukan beban / Beban tunggal** | Selectorized cable machine weight stack |
| **Landmine** | Ranjau darat *(military explosive!)* | **Landmine** | Pivoting barbell floor sleeve |
| **Sled** | Kereta luncur *(snow sled)* | **Sled** | Weighted push/pull turf sled |
| **Sandbag** | Memaksakan *(wrong verb sense)* | **Sandbag / Kantong pasir** | Functional training sandbag |
| **Suspension trainer** | Pelatih suspensi | **Suspension trainer (TRX)** | Bodyweight straps |
| **Rep / Reps** | Perwakilan *(political representative!)* | **Rep / Repetisi** | Repetition count |
| **Form-check (video)** | Pemeriksaan formulir *(paper form!)* | **Cek form / teknik gerakan** | Video posture/technique evaluation |
| **Traps (Trapezius)** | Perangkap *(animal trap!)* | **Traps / Trapezius** | Upper-back muscle group |
| **Abductors** | Penculik *(kidnapper!)* | **Abduktor** | Hip abductor muscles |
| **Obliques** | Oblik / Miring | **Perut Samping (Obliques)** | Side abdominal muscles |
| **Calf / Calves / Lower leg** | Tungkai / Tungkai bawah *(clinical)* | **Betis** | Everyday anatomical term for gym users |
| **Upper leg / Thigh** | Tungkai atas *(clinical)* | **Paha** | Everyday anatomical term |
| **Grip muscles** | Otot pegangan *(door handle)* | **Otot cengkeram** | Forearm & hand grip musculature |
| **Recovering** *(muscle status)* | Memulihkan *(transitive verb)* | **Dalam pemulihan** | Post-workout muscle recovery status |
| **Combat** *(training category)* | Tempur *(military warfare)* | **Bela diri** | Martial arts / combat sports category |
| **Watch app** | Aplikasi Tonton *(verb 'to watch'!)* | **Aplikasi Apple Watch / Smartwatch** | Companion wearable app |
| **Phone watches gyms** | Ponsel menonton gym | **Ponsel memantau lokasi gym** | Background geofencing arrival detection |
| **Quick arrival check** | Pemeriksaan kedatangan cepat | **Deteksi kedatangan cepat** | GPS geofence check-in toggle |
| **Where an exercise is drawn on both figures** *(setting)* | Ketika latihan digambar pada kedua figur | **Pilihan figur untuk latihan yang digambar pada kedua figur tubuh** | Settings description for anatomical illustration options; avoid temporal conjunction (*Ketika...*) |

---

## 4. Unilateral Modifiers, Idioms & 1RM Calculation Terminology

### A. Unilateral Exercise Modifiers (Strict Parallelism)
In exercise names, templates, and instructions, always use **`tiap`** (never mix *masing-masing* and *tiap* across parallel strings):
- `each hand` $\rightarrow$ **`tiap tangan`**
- `each side` $\rightarrow$ **`tiap sisi`**
- `each leg` $\rightarrow$ **`tiap kaki`**

### B. Fitness Idioms & Contextual Phrases
- **Arms progress**: **`Progres otot lengan`** (never *kemajuan senjata*, military arms!).
- **Dodgy [shoulder/knee]**: **`[Bahu/lutut] sering bermasalah / rentan cedera`** (never *cerdik*).
- **1 more rep in the tank** *(RIR)*: **`Masih kuat 1 repetisi lagi / cadangan tenaga`** (never *di dalam tangki*).
- **Warm-up territory**: **`Taraf pemanasan / beban ringan`** (never *wilayah hangat*).
- **Leaning out**: **`Memangkas lemak`** (never *mencondongkan tubuh*).
- **Swapping the movement**: **`Mengganti variasi gerakan`** (never *menukar mesin jam*).
- **Machine taken?**: **`Mesin sedang dipakai orang?`** (never *Mesin diambil?*).
- **Trained out of order**: **`Urutan latihan tidak sesuai jadwal`** (never *terlatih rusak*).
- **From the new order** *(chronology)*: **`Berdasarkan urutan waktu baru`** (never *dari Orde Baru*!).
- **On pace**: **`Sesuai target`** (never *di kecepatan yang sama*).
- **Top of the range** *(rep target)*: **`Batas atas repetisi`** (never *Puncak dari jangkauan*).
- **Lifted in total**: **`Total beban terangkat`** (never *Terangkat total*).
- **Count warm-ups in volume**: **`Hitung pemanasan ke dalam volume`** (never *berdasarkan volume*).

### C. 1RM (One-Rep Max) Estimation Formulas
- **Blend of all**: **`Gabungan semuanya`** (combining all 7 estimation formulas, not *Campuran semuanya*).
- **The classics**: **`Rumus klasik`** (referring to Epley/Brzycki formulas, not literary *karya klasik*).
- **Generous at high reps**: **`Cenderung tinggi pada repetisi tinggi`** (never *murah hati*).
- **More conservative above five reps**: **`Lebih konservatif di atas lima repetisi`**.
- **Calculated from one set, not a tested max**: **`Dihitung dari satu set, bukan tes beban maksimal langsung`**.

---

## 5. Gamification, Streaks & Celebration Microcopy

Align consistency and celebration metrics with established Indonesian fitness app conventions (Strava Indonesia):
- **`Week streak`**: **`Minggu beruntun`** (never *Streak mingguan* or *Runtun mingguan*).
- **`{0} week streak`**: **`{0} minggu beruntun`** (never *Rentetan {0} minggu*).
- **`Most days in a row`**: **`Hari beruntun terbanyak`** (avoid pleonasm *Streak hari terbanyak berturut-turut*).
- **`Active days`**: **`Hari aktif`** (never *Hari-hari aktif*).
- **`[Goal] reached!`**: **`Tercapai!`** (perfective/inchoative `ter-`, never dangling passive *dicapai!*).
- **`Nice!`** *(workout complete celebration button 🏆)*: **`Mantap!`** (energetic and natural, superior to flat *Bagus!*).
- **`Tough session`**: **`Sesi berat`** (physical training intensity, not *Sesi yang sulit* like an exam).
- **`Let's go`**: **`Ayo mulai`** (never literal *ayo pergi*).

---

## 6. Coaching & Notification Personas (Persona-Driven Copy)

When a fitness app offers selectable notification personas, preserve the distinct voice of each persona using natural Indonesian expressions:

1. **Drill Sergeant (*Instruktur Militer*)**:
   - *Tone*: Punchy, commanding, zero excuses.
   - *Address*: Use **`prajurit`** (never literal *rekrut*).
   - *Idiomatic Copy*: *"Gains-mu udah mau kabur tuh!"*, *"Banyak alasan nggak bikin beban terangkat!"*, *"Ayo gerak!"*.
2. **Friendly (*Ramah & Suportif*)**:
   - *Tone*: Warm, validating, low-pressure.
   - *Idiomatic Copy*: *"Hari yang melelahkan? {0} bisa menunggu. Besok kita mulai lagi."*
3. **Guilt Trip (*Sindiran Akrab Teman Gym*)**:
   - *Tone*: Playful gym-bro banter, personifying the barbell or bench waiting in the corner.
   - *Idiomatic Copy*: *"Udah disiapin tempat di bangku latihan. Tapi masih kosong."*
