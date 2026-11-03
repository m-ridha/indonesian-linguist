# Domain Glossary: Software Engineering, Developer Tools & Native Mobile OS

Empirical testing across Indonesian developer communication and software localization alongside **PUPI §6.4** show that translating foundational developer infrastructure terms into formal Indonesian calques reduces comprehension and causes configuration errors. Conversely, user-facing mobile OS permission instructions must match the exact Indonesian strings shipped by **Apple iOS** and **Google Android (AOSP `id-ID`)**.

Use this reference when localizing developer settings, self-hosted app configurations, authentication flows, privacy permissions, or mobile companion instructions.

---

## 1. Developer & Infrastructure Loanwords (Retain Intact)

When a setting or documentation targets developers, self-hosters, or API integrations, **retain standard English technical terms** rather than inventing stiff calques:

| Technical Source Term | Stiff Calque (AVOID) | Recommended Indonesian Term | Context & Usage Notes |
| --- | --- | --- | --- |
| **API key / key** | Kunci API / kunci | **API key** (or *kunci API* only in explanatory prose) | Keep `API key` intact in input labels and placeholders |
| **Endpoint** | Titik akhir | **Endpoint** | Server/API URL destination |
| **Reverse proxy** | Proksi terbalik | **Reverse proxy** | Nginx / Caddy / Cloudflare infrastructure setting |
| **Webhook** | Kait web | **Webhook** | Event callback URL |
| **Source code** | Kode sumber | **Source code** / **Kode sumber** | In consumer app links (e.g., GitHub link), `Source code` is natural and universally understood |
| **Self-hosted** | Dihosting sendiri | **Self-hosted / Server sendiri** | Deployment model |
| **Rate limiting / Rate limit** | Membatasi tarif *(price tariff!)* | **Pembatasan kuota permintaan (rate limit)** | Never translate `rate` in API rate-limiting as financial *tarif* |
| **Payload** | Muatan | **Payload** | HTTP request/response body |
| **Token / Bearer token** | Tanda / Keping | **Token** | Authentication/API token |
| **Passkey** | Kunci sandi | **Passkey / Kunci sandi** | WebAuthn credential |
| **Backup / Restore** | Cadangan / Pulihkan | **Cadangan (Backup) / Pulihkan** | Data archival and recovery |
| **Sync / Catch up** | Mengejar ketinggalan | **Sinkronisasi / Tersinkronkan** | Background state synchronization |
| **Run** *(background job/AI task)* | Lari *(physical running!)* | **Jalankan / Eksekusi** | Triggering a background job or prompt |
| **Ceiling** *(token/quota limit)* | Langit-langit *(room ceiling!)* | **Batas maksimal / Batas atas** | Upper cap on usage or tokens |

---

## 2. Official Brand, Ecosystem & OS Feature Names (Never Translate)

Per **PUPI §6.4**, official product names, biometric features, and password managers are proper nouns and must **never** be translated literally:

| Official Proper Noun | Literal Translation Error (BANNED) | Correct Form in Indonesian Text |
| --- | --- | --- |
| **iCloud Keychain** | Rantai Kunci iCloud | **iCloud Keychain** |
| **Google Password Manager** | Pengelola Kata Sandi Google | **Google Password Manager** |
| **Face ID / Touch ID** | ID Wajah / ID Sentuh | **Face ID / Touch ID** |
| **Health Connect** | Koneksi Kesehatan | **Health Connect** |
| **Apple Health** | Kesehatan Apple | **Apple Health** |
| **Apple Watch** | Jam Tangan Apple / Aplikasi Tonton | **Apple Watch** (*Aplikasi Apple Watch*) |

---

## 3. Native Android & iOS Indonesian System String Alignment

When an app instructs a user to open their phone's system settings (e.g., enabling background location for geofencing or disabling battery optimization), your Indonesian translation **must match the exact label displayed on the user's Indonesian-language Android or iOS screen**:

| English OS Setting / Gesture | Mismatched Literal Translation | Official Android / iOS `id-ID` String | Where It Appears on Device |
| --- | --- | --- | --- |
| **On / Off** | Menyala / Mati | **Aktif / Nonaktif** | System toggles & feature switches |
| **All the time** *(location permission)* | Sepanjang waktu / Setiap saat | **Izinkan sepanjang waktu** (per-app *Izin lokasi* option) / **Selalu izinkan** (permission-manager section heading & OEM variants) | Android Location Permission settings |
| **While using the app** | Saat menggunakan aplikasi | **Saat aplikasi digunakan** | Android / iOS Location Permission dialog |
| **Unrestricted** *(battery usage)* | Tanpa pembatasan / Bebas | **Tak terbatas** | Android App Battery Management screen |
| **Precise location** *(permission)* | Lokasi tepatnya / Lokasi presisi | **Lokasi akurat** | Official Android AOSP `id-ID` string for precise vs approximate location |
| **Uses where your phone is** *(explainer)* | Menggunakan di mana ponselmu berada | **Menggunakan lokasi ponselmu** | Clean idiomatic phrasing avoiding the banned relative *di mana* |
| **Keep screen awake** | Jaga layar tetap bangun | **Layar tetap menyala** | Display wake-lock toggle |
| **Swipe actions / swipe gesture** | Tindakan geser / gerakan geser | **Fungsi Geser / gestur geser** | Apple Support ID & Android gesture guides |
| **One tap away** | Satu ketukan jauhnya | **Hanya berjarak satu ketukan** | Idiomatic mobile UX phrasing |
| **Signed in** *(connected device status)* | Masuk *(verb command)* | **Terhubung** / **Sudah masuk** | Device sync & session status list |
| **Light / Dark** *(system theme)* | Lampu / Ringan | **Terang / Gelap** | System appearance settings |

---

## 4. Authentication, Privacy & Consent Microcopy

1. **Authentication Phrasal Verbs**:
   - `Sign in / Log in` *(button)* $\rightarrow$ **`Masuk`**
   - `Sign out / Log out` *(button)* $\rightarrow$ **`Keluar`**
   - `Signs out / signs {0} out` *(causal description)* $\rightarrow$ **`mengeluarkan {0}`** (e.g., *"Revoking this device signs it out"* $\rightarrow$ **"Mencabut akses perangkat ini akan mengeluarkannya dari akunmu"**, never translate `signs out` as *menandakan*!).
2. **Privacy & Consent Actions**:
   - `Allow` $\rightarrow$ **`Izinkan`** (imperative base verb, not *Mengizinkan*)
   - `Not allowed` $\rightarrow$ **`Tidak diizinkan`**
   - `Withdraw` *(privacy consent)* $\rightarrow$ **`Tarik izin`** (always include the object *izin* so it does not read like withdrawing cash at an ATM).
   - `Your call` *(privacy autonomy)* $\rightarrow$ **`Keputusanmu`** or **`Kendalimu`** (never *Panggilan kamu*).
3. **Backup, Restore & Overwrite Confirmation Semantics**:
   - `Replacing deletes it / them` *(restore modal warning)* $\rightarrow$ **`Mengganti data akan menghapus data saat ini`** or **`Tindakan penggantian ini akan menghapus data di perangkat`**.
   - *CRITICAL UX INVARIANT*: Never translate `Replacing deletes it` as *"Menimpa cadangan"*. In local restore workflows, the action overwrites *local on-device data* with the contents of the backup file. Translating it as *"Menimpa cadangan"* dangerously reverses the semantic logic, terrifying users into believing their external backup file will be wiped.
4. **App-Level Geofence & Location Event Microcopy**:
   - `Gym spotted / Venue spotted` *(geofence arrival event)* $\rightarrow$ **`Lokasi gym terdeteksi`** (app-level event notification, not an OS setting; avoids literal *Gym terlihat*).
   - `Uses where your phone is` *(explainer)* $\rightarrow$ **`Menggunakan lokasi ponselmu`** (clear conversational microcopy avoiding the banned relative *di mana*).
