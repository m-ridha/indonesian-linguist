# Agent Portability (`docs/agent-portability.md`)

`indonesian-linguist` is packaged as a **single-skill, multi-agent distribution** inspired by [Ponytail](https://github.com/DietrichGebert/ponytail) and [bahasa-skills](https://github.com/alvinindra/bahasa-skills).

Regardless of which AI coding agent or CLI harness you use, `indonesian-linguist` exposes **one unified skill** (`/indonesian-linguist`) and **one always-on instruction file** (`AGENTS.md` on workspace/instruction-tier harnesses), while progressively loading specialized reference modules from [`references/`](../references/) on demand.

---

## Supported Agent Adapters

| Host / Agent | Discovery Files Used | How It Works |
| --- | --- | --- |
| **Antigravity (IDE & `agy` CLI)** | `gemini-extension.json`, `SKILL.md`, `skills/indonesian-linguist/SKILL.md` (`AGENTS.md` when in workspace) | Install via `agy plugin install https://github.com/m-ridha/indonesian-linguist` or clone into `~/.gemini/config/skills/indonesian-linguist` to expose `/indonesian-linguist`. (In a workspace checkout, Antigravity also loads `AGENTS.md` automatically; plugin-packaged rules require `rules/AGENTS.md`.) |
| **Claude Code (CLI & Desktop)** | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `skills/indonesian-linguist/SKILL.md` | Install via `/plugin marketplace add m-ridha/indonesian-linguist` and `/plugin install indonesian-linguist@indonesian-linguist`, or clone into `.claude/skills/indonesian-linguist`. |
| **OpenAI Codex (CLI & Desktop)** | `.codex-plugin/plugin.json`, `SKILL.md`, `skills/indonesian-linguist/SKILL.md`, `AGENTS.md` | Install via `codex plugin marketplace add m-ridha/indonesian-linguist` and `codex plugin add indonesian-linguist@indonesian-linguist`, or clone into `~/.agents/skills/indonesian-linguist`. |
| **Gemini CLI** | `gemini-extension.json`, `AGENTS.md`, `commands/indonesian-linguist.toml`, `skills/indonesian-linguist/SKILL.md` | Install via `gemini extensions install https://github.com/m-ridha/indonesian-linguist`. |
| **OpenCode** | `SKILL.md`, `AGENTS.md` | Clone into `~/.agents/skills/indonesian-linguist` (global) or `.agents/skills/indonesian-linguist` (project). |
| **GitHub Copilot CLI** | `.github/plugin/plugin.json`, `commands/indonesian-linguist.toml`, `AGENTS.md` | Install via `copilot plugin marketplace add m-ridha/indonesian-linguist` and `copilot plugin install indonesian-linguist@indonesian-linguist`. |
| **Cursor / Windsurf / Cline / Zed / Jules / Amp** | `AGENTS.md`, `SKILL.md`, `references/` | Copy `AGENTS.md` alongside `SKILL.md` and `references/` into your project root so relative references resolve (or place `AGENTS.md` in `.windsurf/rules/` or `.clinerules/`; for Cursor `.cursor/rules/`, use a `.mdc` rule wrapper or keep `AGENTS.md` at the project root). |

---

## Single-Skill Sync Architecture

Some agent harnesses scan `SKILL.md` at the root of a cloned skill directory (`~/.agents/skills/indonesian-linguist/SKILL.md`), while plugin marketplaces scan `skills/<skill-name>/SKILL.md`.

To guarantee that both installation methods work identically and expose **only one skill** (`indonesian-linguist`):
- Root [`SKILL.md`](../SKILL.md) is the canonical skill file.
- [`skills/indonesian-linguist/SKILL.md`](../skills/indonesian-linguist/SKILL.md) is verified by `npm test` (`tests/manifests.test.js`) to remain byte-for-byte identical to root `SKILL.md`.
- `skills/indonesian-linguist/references` is a relative symlink pointing to `../../references`, so relative links (`references/...`) resolve to the exact same files in every environment.
