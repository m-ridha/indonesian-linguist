# Artificial Intelligence & Automated Contribution Policy

We encourage using AI coding assistants (including `/indonesian-linguist` itself) when drafting documentation, domain glossaries, or code changes for this repository. However, **purely autonomous or unreviewed AI contributions are not accepted**. Human contributors must review, verify, and stand behind every submitted line.

## Operational Rules

1. **Human Accountability**: Every Pull Request must have a human author who has personally reviewed, tested, and verified every line of changed code and Indonesian text.
2. **Linguistic Verification (Zero AI Slop)**: AI models frequently hallucinate non-standard Indonesian spellings, English syntactic calques, or literal dictionary translations of polysemous UI terms. Contributors must verify every Indonesian example against **KBBI Edisi VI**, **EYD Edisi V**, and real-world Indonesian practitioner usage before submitting.
3. **Interactive Code Review**: Contributors must directly explain and defend their changes in Pull Request reviews. Copying maintainer review comments into an LLM and pasting unverified model responses back into review threads is prohibited.
4. **Two-Track Scope Alignment**: Contributors planning a new domain glossary under `references/domains/` or a structural change exceeding `100` non-test lines (or touching `>= 3` core files) should open a [Feature / Domain Glossary Proposal Issue](.github/ISSUE_TEMPLATE/feature_proposal.md) first to align with the maintainer before submitting an implementation PR.
5. **No Artificial PR Splitting**: Do not artificially split a single logical feature or domain glossary into multiple smaller pull requests to bypass the 100-line Track 1 threshold.
