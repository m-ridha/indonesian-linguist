#!/usr/bin/env node
/**
 * Repository Infrastructure & Single-Skill Manifest Verification Suite
 * Modeled on Ponytail's adapter & manifest smoke tests.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const SKILL_NAME = 'indonesian-linguist';
// Valid SemVer 2.0.0 (supports optional prerelease and build metadata, forbidding leading zeroes on numeric parts)
const PINNED_SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?$/;

const VERSIONED_MANIFESTS = [
  'package.json',
  'plugin.json',
  'gemini-extension.json',
  '.claude-plugin/plugin.json',
  '.codex-plugin/plugin.json',
  '.github/plugin/plugin.json',
];

const MARKETPLACE_MANIFESTS = [
  '.agents/plugins/marketplace.json',
  '.claude-plugin/marketplace.json',
];

const REQUIRED_REFERENCES = [
  'references/README.md',
  'references/ui-localization-and-polysemy.md',
  'references/ui-compaction-and-microcopy.md',
  'references/core-grammar-and-eyd.md',
  'references/anti-slop-and-calques.md',
  'references/writing-ux-marketing-seo-academic.md',
  'references/domains/README.md',
  'references/domains/fitness-and-gym.md',
  'references/domains/tech-and-developer.md',
  'scripts/README.md',
];

const LOAD_BEARING_INVARIANTS = [
  'Baku tak mesti kaku',
  'Sesuai input',
  'Hapus penilaian',
  'Minggu beruntun',
  'hiruk pikuk',
  'silakan',
];

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

test('all plugin manifests share the exact same pinned semver version and skill name', () => {
  const versions = VERSIONED_MANIFESTS.map((rel) => {
    const filePath = path.join(root, rel);
    assert.ok(fs.existsSync(filePath), `${rel} must exist`);
    const data = JSON.parse(read(rel));
    assert.equal(data.name, SKILL_NAME, `${rel} name must be "${SKILL_NAME}"`);
    assert.match(data.version, PINNED_SEMVER, `${rel} version must be pinned semver`);
    return data.version;
  });

  const [first, ...rest] = versions;
  for (const v of rest) {
    assert.equal(v, first, 'All manifests must have identical version strings');
  }
});

test('single-skill architecture: skills/indonesian-linguist/SKILL.md matches root SKILL.md verbatim', () => {
  const rootSkill = read('SKILL.md').replace(/\r\n/g, '\n');
  const pluginSkill = read('skills/indonesian-linguist/SKILL.md').replace(/\r\n/g, '\n');
  assert.equal(pluginSkill, rootSkill, 'skills/indonesian-linguist/SKILL.md drifted from root SKILL.md');

  // Ensure only ONE skill folder exists under skills/ so user only ever sees /indonesian-linguist
  const skillDirs = fs
    .readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  assert.deepEqual(
    skillDirs,
    [SKILL_NAME],
    'Only the single "indonesian-linguist" skill directory should exist under skills/',
  );
});

test('SKILL.md has English main description with bilingual trigger tokens', () => {
  const content = read('SKILL.md');
  assert.match(content, /^---\nname:\s*indonesian-linguist\n/m);
  assert.match(content, /Expert Bahasa Indonesia language, writing, translation, and software localization/);
  assert.match(content, /terjemahkan/);
  assert.match(content, /lokalisasi/);
  assert.match(content, /kata baku/);
});

test('AGENTS.md and SKILL.md contain all load-bearing linguistic invariants', () => {
  const skillText = read('SKILL.md');
  const agentsText = read('AGENTS.md');
  for (const phrase of LOAD_BEARING_INVARIANTS) {
    assert.ok(skillText.includes(phrase), `SKILL.md missing invariant: "${phrase}"`);
    assert.ok(agentsText.includes(phrase), `AGENTS.md missing invariant: "${phrase}"`);
  }
});

test('all required reference modules and scripts exist and are reachable from both root and plugin skill path', () => {
  for (const rel of [...REQUIRED_REFERENCES, 'scripts/audit-id.js']) {
    assert.ok(fs.existsSync(path.join(root, rel)), `Missing root path: ${rel}`);
    assert.ok(
      fs.existsSync(path.join(root, 'skills', SKILL_NAME, rel)),
      `Missing plugin-resolved path: skills/${SKILL_NAME}/${rel}`,
    );
  }
});

test('all relative markdown links in SKILL.md, plugin SKILL.md, README.md, CONTRIBUTING.md, and docs resolve to existing files', () => {
  const filesToCheck = [
    'SKILL.md',
    'skills/indonesian-linguist/SKILL.md',
    'README.md',
    'CONTRIBUTING.md',
    'AI_POLICY.md',
    'skills/indonesian-linguist/TEST.md',
    'docs/agent-portability.md',
    'references/README.md',
    'references/domains/README.md',
    'scripts/README.md',
  ];
  const linkRegex = /\[[^\]]+\]\((?!https?:\/\/|mailto:|#)([^)#]+)(?:#[^)]*)?\)/g;

  for (const relFile of filesToCheck) {
    const absFile = path.join(root, relFile);
    if (!fs.existsSync(absFile)) continue;
    const content = fs.readFileSync(absFile, 'utf8');
    const baseDir = path.dirname(absFile);
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const targetRel = match[1];
      const resolved = path.resolve(baseDir, targetRel);
      assert.ok(
        fs.existsSync(resolved),
        `Broken relative link in ${relFile}: "${targetRel}" (resolved to ${resolved})`,
      );
    }
  }
});

test('package.json files list ships all required assets and scripts', () => {
  const pkg = JSON.parse(read('package.json'));
  for (const entry of pkg.files) {
    const clean = entry.replace(/\/$/, '');
    assert.ok(
      fs.existsSync(path.join(root, clean)),
      `package.json files entry "${entry}" does not exist on disk`,
    );
  }
});

test('OpenAI / Codex agent metadata (skills/indonesian-linguist/agents/openai.yaml) is valid', () => {
  const yamlPath = 'skills/indonesian-linguist/agents/openai.yaml';
  assert.ok(fs.existsSync(path.join(root, yamlPath)), `${yamlPath} must exist`);
  const content = read(yamlPath);
  const shortDescMatch = content.match(/^\s*short_description:\s*"([^"]+)"/m);
  assert.ok(shortDescMatch, 'openai.yaml must define short_description');
  const len = shortDescMatch[1].length;
  assert.ok(len >= 25 && len <= 64, `short_description length (${len}) must be between 25 and 64 chars`);
  assert.match(content, /\$indonesian-linguist/, 'openai.yaml default_prompt must reference $indonesian-linguist');
});

test('all markdown files have balanced code fences and zero unfinished TODO/TBD/FIXME markers', () => {
  const mdFiles = [
    'SKILL.md',
    'AGENTS.md',
    'README.md',
    'CONTRIBUTING.md',
    'AI_POLICY.md',
    'skills/indonesian-linguist/TEST.md',
    'scripts/README.md',
    'docs/agent-portability.md',
    'docs/sources.md',
    'docs/testing.md',
    'docs/releases.md',
    'examples/i18n-and-ui-localization.md',
    'examples/writing-and-copywriting.md',
    ...REQUIRED_REFERENCES,
  ];

  for (const rel of mdFiles) {
    const content = read(rel);
    const fenceCount = (content.match(/^```/gm) || []).length;
    assert.equal(fenceCount % 2, 0, `${rel} has unbalanced markdown code fences (${fenceCount})`);
    assert.doesNotMatch(
      content,
      /\b(?:TODO|TBD|FIXME)\b/,
      `${rel} contains unfinished TODO/TBD/FIXME marker`,
    );
  }
});

test('SKILL.md body fits well within Antigravity 24,000-byte skill load limit (EGM standard)', () => {
  const parts = read('SKILL.md').split('---');
  assert.ok(parts.length >= 3, 'SKILL.md must contain YAML frontmatter');
  const body = parts.slice(2).join('---').trim();
  const byteSize = Buffer.byteLength(body, 'utf8');
  assert.ok(
    byteSize <= 24000,
    `SKILL.md body (${byteSize} bytes) exceeds Antigravity 24,000-byte load limit`,
  );
});

test('marketplace manifests (.agents and .claude-plugin) resolve to root package', () => {
  for (const rel of MARKETPLACE_MANIFESTS) {
    assert.ok(fs.existsSync(path.join(root, rel)), `${rel} must exist`);
    const data = JSON.parse(read(rel));
    assert.equal(data.name, SKILL_NAME, `${rel} marketplace name must be "${SKILL_NAME}"`);
    assert.equal(data.plugins.length, 1, `${rel} must register exactly 1 plugin`);
    assert.equal(data.plugins[0].name, SKILL_NAME);
    assert.equal(path.resolve(root, data.plugins[0].source), root);
  }
});

test('open-source governance, PR gatekeeping, and co-located eval files exist', () => {
  const governanceFiles = [
    'LICENSE',
    'CONTRIBUTING.md',
    'AI_POLICY.md',
    '.github/CODEOWNERS',
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/ISSUE_TEMPLATE/bug_report.md',
    '.github/ISSUE_TEMPLATE/feature_proposal.md',
    '.github/ISSUE_TEMPLATE/config.yml',
    'skills/indonesian-linguist/TEST.md',
    'skills/indonesian-linguist/test_scenarios.yaml',
  ];
  for (const rel of governanceFiles) {
    assert.ok(fs.existsSync(path.join(root, rel)), `Missing required governance/eval file: ${rel}`);
  }
  const codeowners = read('.github/CODEOWNERS');
  assert.match(codeowners, /^\*\s+@m-ridha/m, 'CODEOWNERS must require review from @m-ridha');
});

test('.gitignore blocks secrets, local IDE configs, and local agent state while preserving tracked plugin manifests', () => {
  const mustIgnore = [
    '.env',
    '.env.local',
    'service-account-credentials.json',
    'private.pem',
    '.vscode/settings.json',
    '.idea/workspace.xml',
    '.DS_Store',
    'CLAUDE.local.md',
    'AGENTS.local.md',
    '.claude/settings.local.json',
    '.gemini/settings.json',
    '.agents/skills/temp',
  ];

  for (const sample of mustIgnore) {
    const ignored = execFileSync('git', ['check-ignore', sample], {
      cwd: root,
      encoding: 'utf8',
    }).trim();
    assert.equal(ignored, sample, `Expected .gitignore to ignore "${sample}"`);
  }

  const mustTrack = [
    'SKILL.md',
    'AGENTS.md',
    'plugin.json',
    'gemini-extension.json',
    '.claude-plugin/plugin.json',
    '.claude-plugin/marketplace.json',
    '.codex-plugin/plugin.json',
    '.agents/plugins/marketplace.json',
    '.github/plugin/plugin.json',
    'skills/indonesian-linguist/SKILL.md',
    'skills/indonesian-linguist/agents/openai.yaml',
  ];

  for (const tracked of mustTrack) {
    assert.throws(
      () => execFileSync('git', ['check-ignore', tracked], { cwd: root, stdio: 'pipe' }),
      `Expected "${tracked}" NOT to be ignored by .gitignore`,
    );
  }
});
