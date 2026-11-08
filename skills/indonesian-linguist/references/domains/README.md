# Domain & Subculture Glossaries (`references/domains/`)

In real-world Indonesian localization and writing, **domain-specific community conventions beat literal dictionary calques**. Translating specialized terminology using a general dictionary produces unnatural or comical phrases that immediately alienate practitioners (e.g., translating *Landmine* in a gym app as *Ranjau darat*, *API endpoint* as *titik akhir API*, or *Abductors* as *Penculik*).

This directory houses modular domain and subculture glossaries for `indonesian-linguist`.

---

## Available Domain Modules

| Domain Module | Scope & Triggers |
| --- | --- |
| [fitness-and-gym.md](fitness-and-gym.md) | Strength training, bodybuilding, calisthenics, workout trackers (e.g., openGym, Strava, Hevy), sports anatomy, 1RM estimation, gamification streaks, and coaching personas. |
| [medical-and-healthcare.md](medical-and-healthcare.md) | Telemedicine, electronic medical records (RME / SatuSehat), clinical hospital workflows, diagnostic lab specimens, BPOM drug classifications, and patient-facing consultations. |
| [tech-and-developer.md](tech-and-developer.md) | Software engineering, APIs, cloud infrastructure, authentication/security, official Apple iOS & Google Android Indonesian system strings, and consumer SaaS settings. |

---

## Core Principles Across All Domains

1. **Community Loanword Retention**:
   When a subculture in Indonesia universally uses an English loanword (*Squat*, *Bench press*, *Drop set*, *API key*, *Webhook*), retain it naturally rather than inventing a bureaucratic calque (*Jongkok*, *Pers bangku*, *Kunci API*).
2. **Semantic Field & Case-Sensitivity Disambiguation (PUPI §4.5)**:
   The same English word often maps to different Indonesian terms depending on its exact screen or domain role (e.g., `'Body weight'` = *Berat badan* on a scale card vs. `'Bodyweight'` = *Bodyweight* as a routine load mode; `'Weight 30d'` = *Berat badan 30 hari* vs. `'Weight ({0})'` = *Beban ({0})*).
3. **Zero Calque Tolerance on Idioms**:
   Domain idioms (*1 rep in the tank*, *leaning out*, *rate limiting*, *cold start*) must be translated by their functional meaning in the community, never word-for-word.

---

## How to Add a New Domain Module

To expand `indonesian-linguist` for a new industry or subculture (e.g., `fintech-and-banking.md`, `gaming-and-esports.md`, `ecommerce-and-logistics.md`, `medical-and-health.md`):

1. Create `references/domains/<domain-name>.md`.
2. Structure the file with:
   - **Standard Community Loanwords vs. Calque Traps** (table of EN source, literal machine trap to avoid, recommended Indonesian term, and context).
   - **Semantic Field Disambiguations** (terms whose translation changes by context or capitalization).
   - **Domain Idioms & Phrasal Verbs**.
   - **Tone & Persona Guidelines** (e.g., `Anda` vs. `kamu / -mu`).
3. Register the new file in the routing table in root [`SKILL.md`](../../SKILL.md) and run `npm test` to verify all links.
