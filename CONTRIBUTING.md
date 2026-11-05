# Contributing to `indonesian-linguist`

We welcome contributions from linguists, software localization engineers, developers, and Indonesian domain practitioners!

All contributions to `indonesian-linguist` are governed by a **Pull Request + Maintainer Review Gate**: every change must be submitted via a Pull Request and explicitly reviewed and approved by the repository maintainer (`@m-ridha`, enforced via [`.github/CODEOWNERS`](.github/CODEOWNERS)) and pass all automated CI checks before merging into `main`.

---

## 1. Core Philosophy & Design Principles

Before opening an issue or Pull Request, align your change with our three core principles (inspired by [Ponytail](https://github.com/DietrichGebert/ponytail) and the [Elephant-Goldfish Model](https://github.com/google/elephant-goldfish-model)):

1. ***"Baku tak mesti kaku, santai bukan sembarangan"***: Every rule must produce Bahasa Indonesia that is both **grammatically accurate** (EYD Edisi V & KBBI VI) and **contextually natural** in real-world software, prose, or subculture usage.
2. **High-Signal, Zero-Bloat Context (YAGNI)**: Every line in `SKILL.md` and `references/` consumes model context tokens. Do not add speculative filler, unverified regional dialect roleplay, or stub registries.
3. **Single-Skill Entry Point (`/indonesian-linguist`)**: Users only ever invoke **one** unified skill (`indonesian-linguist`). New domains or linguistic rules belong in modular files under `references/` and are routed from `SKILL.md`.
4. **Humans Own the Outcomes**: Using AI tools (including `/indonesian-linguist` itself) to help draft a contribution is welcome, but every PR requires a human author who has personally verified the linguistic accuracy and can explain it in review. See [`AI_POLICY.md`](AI_POLICY.md).

---

## 2. Which Track Is My Contribution?

Contributions follow a two-track intake model defined in [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md):

### Track 1: Linguistic Fix, Glossary Addition, or Minor Patch (`<= 100` Non-Test Lines, `< 3` Core Files)
You can open a **Pull Request directly** (without a prior issue) for:
- Adding missing `Kata Baku` vs. `Tidak Baku` entries in [`references/core-grammar-and-eyd.md`](references/core-grammar-and-eyd.md).
- Adding isolated UI polysemy or lexical compaction cases in [`references/ui-localization-and-polysemy.md`](references/ui-localization-and-polysemy.md) or [`references/ui-compaction-and-microcopy.md`](references/ui-compaction-and-microcopy.md).
- Expanding an existing domain glossary under [`references/domains/`](references/domains/README.md) (e.g., [`fitness-and-gym.md`](references/domains/fitness-and-gym.md) or [`tech-and-developer.md`](references/domains/tech-and-developer.md)).
- Fixing false positives or adding deterministic rules and unit tests in [`scripts/audit-id.js`](scripts/audit-id.js) and [`tests/audit-id.test.js`](tests/audit-id.test.js).

### Track 2: New Domain Glossary, Core Invariant, or Architectural Change (`> 100` Lines or `>= 3` Core Files)
If you want to:
- Add a **brand-new domain or subculture glossary** under `references/domains/<domain-name>.md` (e.g., `fintech-and-banking.md`, `gaming-and-esports.md`, `ecommerce-and-logistics.md`),
- Modify the 10 non-negotiable linguistic invariants in [`SKILL.md`](SKILL.md) and [`AGENTS.md`](AGENTS.md), or
- Change multi-agent plugin manifests or CLI behavior,

please follow our two-stage alignment workflow:
1. **Open a Proposal Issue**: Use the [Feature / Domain Glossary Proposal template](.github/ISSUE_TEMPLATE/feature_proposal.md) to outline the domain, target register/pronoun, and 5-10 sample before/after terms.
2. **Submit the Pull Request**: Once the maintainer aligns on scope, open a Pull Request referencing the issue (`Closes #<issue>`) using the template in [`references/domains/README.md`](references/domains/README.md).

---

## 3. Linguistic Evidence Requirements

Every linguistic or localization rule added to this repository must be backed by concrete evidence in the Pull Request description:

| Contribution Category | Required Evidence in PR |
| --- | --- |
| **Orthography / `Kata Baku` / Affixation** | Cite the official **KBBI Edisi VI** entry or **EYD Edisi V** (Permendikbudristek No. 18/2021) rule. |
| **UI Polysemy / Microcopy / Compaction** | Include **Before (`❌`) vs. After (`✅`)** pairs and specify the UI surface (e.g., action button vs. status badge vs. segmented pill vs. form caption). |
| **Domain / Subculture Glossary** | Demonstrate authentic Indonesian practitioner usage (or official Apple iOS / Google Android `id-ID` OS strings) and list the literal calque traps it prevents. |
| **`scripts/audit-id.js` Rule Change** | Include both a **positive test case** (catches the error) and a **negative test case** (does not trigger false positives on valid Indonesian or retained loanwords) in [`tests/audit-id.test.js`](tests/audit-id.test.js). |

---

## 4. Step-by-Step Pull Request Workflow

1. **Fork & Create a Semantic Branch**:
   Fork the repository and create a branch from `main` using `<type>/<short-kebab-slug>` (`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`):

   ```bash
   git checkout -b feat/fintech-glossary
   ```

2. **Keep Root and Plugin Assets Synchronized**:
   If you edit the root [`SKILL.md`](SKILL.md), [`references/`](references/), or [`scripts/`](scripts/), always sync the plugin mirror before committing:

   ```bash
   npm run sync
   ```

   *(The `npm run sync` script copies all files under `scripts/` except `scripts/sync-skill.js` — including any git-ignored files — along with `SKILL.md` and `references/`, into `skills/indonesian-linguist/`. Our automated test suite in [`tests/manifests.test.js`](tests/manifests.test.js) detects missing or changed plugin copies of current non-ignored root files, but does not detect plugin-only files left behind after a root file is deleted or renamed. It also fails if `SKILL.md` exceeds Antigravity's 24,000-byte load limit.)*
3. **Run Offline Verification & Self-Audit**:
   Run the zero-dependency test suite and deterministic auditor locally (detailed guidelines in [`docs/testing.md`](docs/testing.md)):

   ```bash
   npm test
   node scripts/audit-id.js docs/*.md scripts/README.md references/README.md references/domains/README.md
   ```

4. **Commit & Open a Pull Request (Semantic Commit Style)**:
   - Follow [Semantic Commit Messages](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716#file-semantic-commit-messages-md) (`<type>(<optional-scope>): <description>`) for both commit messages and the PR title:
     - `feat(domains): add fintech and banking domain glossary`
     - `fix(audit): prevent false positive on lowercase anatomical back`
     - `docs(eyd): add correlative conjunction pairs from Recehan Bahasa`
     - Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
   - Complete every section of [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md), including the **Human Accountability Affirmation**.
5. **Maintainer Review, Merge & Releases**:
   - The repository maintainer (`@m-ridha`) is automatically requested for review via [`.github/CODEOWNERS`](.github/CODEOWNERS).
   - Address any review feedback in the PR thread. Once CI passes and the maintainer approves, the maintainer will merge the PR.
   - For version bumps and release execution, maintainers follow the EGM draft release process documented in [`docs/releases.md`](docs/releases.md).

---

## 5. Recommended GitHub Repository Settings (For Maintainers)

To enforce the Pull Request + Maintainer Review workflow on GitHub (`Settings -> Branches -> Branch protection rules` or `Rulesets` for `main`):
- Enable **Require a pull request before merging**
  - Enable **Require approvals** (`1` required approval)
  - Enable **Require review from Code Owners** (routes all reviews to `@m-ridha` via [`.github/CODEOWNERS`](.github/CODEOWNERS))
  - Enable **Dismiss stale pull request approvals when new commits are pushed**
- Enable **Require status checks to pass before merging** (select the `test` job from [`.github/workflows/test.yml`](.github/workflows/test.yml))
- Enable **Do not allow bypassing the above settings** for non-maintainers.

---

## 6. License

By contributing to `indonesian-linguist`, you agree that your contributions will be licensed under the [MIT License](LICENSE).
