# Security Policy

The `indonesian-linguist` project takes security seriously. This policy explains which versions are supported, how to report security vulnerabilities responsibly, and what to expect during triage and remediation.

---

## 1. Supported Versions

We provide security fixes and maintenance updates for the following versions:

| Version | Supported | Notes |
| :--- | :---: | :--- |
| `1.x` | :white_check_mark: | Latest release and tagged patches on the `main` branch |
| `< 1.0.0` | :x: | Pre-release development tags are unsupported |

Security fixes are merged directly into the `main` branch and tagged in subsequent semver patch releases.

---

## 2. Reporting a Vulnerability

**Please do not report security vulnerabilities in public GitHub issues, discussions, or pull requests.**

We use GitHub's **Private Vulnerability Reporting** to handle security disclosures privately and securely:

1. Navigate to the repository's [Private Vulnerability Reporting page](https://github.com/m-ridha/indonesian-linguist/security/advisories/new).
2. Fill out the report form with:
   - A descriptive title and type of vulnerability (e.g., ReDoS, Prototype Pollution, Resource Exhaustion).
   - Clear steps to reproduce the issue, including proof-of-concept scripts or payload files (`.json`, `.js`, `.md`).
   - The affected component (e.g., `scripts/audit-id.js`, parser helpers, or bundled skill manifests).
   - Potential impact and any suggested mitigations.
3. Submit the advisory. It will only be visible to the repository maintainer (`@m-ridha`).

If you are unable to use GitHub Private Vulnerability Reporting for any reason, you can contact the maintainer directly via the profile contact options listed on [GitHub @m-ridha](https://github.com/m-ridha).

---

## 3. Scope

### In-Scope Vulnerabilities

We welcome security reports regarding:

- **Denial of Service (DoS / ReDoS)**: Catastrophic regular expression backtracking or algorithmic complexity attacks in [`scripts/audit-id.js`](scripts/audit-id.js) or parser utilities when processing untrusted input.
- **Resource Exhaustion & Amplification**: Unbounded memory allocation, infinite traversal loops, prototype-chain cycles, or oversized diagnostic buffer floods.
- **Log Injection / Terminal Escape Tampering**: Bypasses around diagnostic sanitization (`sanitizeDiagnostic`) that allow terminal control sequence injection or output spoofing.
- **Supply Chain & Manifest Integrity**: Malicious or untrusted code execution risks within repository test harnesses, build scripts, or distribution packages.

### Out-of-Scope Issues

The following are outside the scope of security vulnerability reporting:

- **Grammar, Orthography & Spelling Disputes**: Differences of opinion regarding EYD V, KBBI VI, or domain terms. Please open a standard [Issue](https://github.com/m-ridha/indonesian-linguist/issues) or [Feature Proposal](.github/ISSUE_TEMPLATE/feature_proposal.md).
- **Model Output / Prompt Engineering Variations**: Subjective variations in LLM responses when loading the skill.
- **Vulnerabilities in Third-Party Agent Platforms**: Security issues in agent harnesses or IDE extensions (e.g., Claude Code, Antigravity, OpenCode) that are unrelated to this repository's code or manifests.

---

## 4. Response & Remediation Process

When a security vulnerability is reported via GitHub Advisories:

1. **Acknowledgement**: The maintainer will acknowledge receipt of the report within **48 hours**.
2. **Assessment & Triage**: The maintainer will validate the vulnerability, assess its severity (CVSS), and provide an initial assessment within **5 business days**.
3. **Coordinated Patching**: A patch will be developed in a private security fork or branch. Reporters may be invited to collaborate and review the proposed fix.
4. **Disclosure & Advisory**: Once verified, the patch is merged into `main`, a GitHub Security Advisory (GHSA) is published, and a release is tagged. Credit will be given to the reporter (unless anonymity is requested).
