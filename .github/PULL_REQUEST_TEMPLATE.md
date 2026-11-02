<!-- Title: Use Semantic Commit format: <type>(<optional-scope>): <description>
Allowed types: feat, fix, docs, style, refactor, test, chore
Example: feat(domains): add fintech and banking domain glossary -->

## Contribution Track

Please select the track that matches this Pull Request (see [CONTRIBUTING.md](https://github.com/m-ridha/indonesian-linguist/blob/main/CONTRIBUTING.md)):

- [ ] **Track 1: Linguistic Fix, Glossary Addition, or Minor Patch** (`<= 100` non-test lines and `< 3` core files; no prior issue required)
- [ ] **Track 2: New Domain Glossary, Core Invariant, or Architectural Change** (`Closes #___` | Aligned with maintainer on a prior proposal issue)

## Summary of Key Changes

<!-- Describe what changed and why. -->

## Linguistic Evidence & Rationale

<!-- Cite KBBI VI / EYD V rules, Apple/Android id-ID OS conventions, or Indonesian practitioner usage. Include Before (❌) vs. After (✅) pairs where applicable. -->

| Source / UI Context | Before / Literal Calque (❌) | After / Natural Indonesian (✅) | Reference / Rationale |
| --- | --- | --- | --- |
| | | | |

## Human Accountability Affirmation

- [ ] I am a human contributor. I have personally reviewed, verified, and can explain every line and Indonesian example in this Pull Request (see [AI_POLICY.md](https://github.com/m-ridha/indonesian-linguist/blob/main/AI_POLICY.md)).

## Verification Checklist

- [ ] If root `SKILL.md` was modified, synced `skills/indonesian-linguist/SKILL.md` (`cp SKILL.md skills/indonesian-linguist/SKILL.md`)
- [ ] If `scripts/audit-id.js` was modified, added both positive and negative unit test cases in `tests/audit-id.test.js`
- [ ] Executed `npm test` locally and all tests pass (`0 fail`)
