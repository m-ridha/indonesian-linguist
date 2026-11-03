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

test('all required reference modules and scripts exist and are reachable from both root and plugin skill path without symlinks', () => {
  for (const rel of [...REQUIRED_REFERENCES, 'scripts/audit-id.js']) {
    const rootPath = path.join(root, rel);
    const pluginPath = path.join(root, 'skills', SKILL_NAME, rel);

    assert.ok(fs.existsSync(rootPath), `Missing root path: ${rel}`);
    assert.ok(fs.existsSync(pluginPath), `Missing plugin-resolved path: skills/${SKILL_NAME}/${rel}`);

    // Verify plugin paths are real files and directories, not dangling symlinks (ensures Codex/Claude standalone portability)
    const lstat = fs.lstatSync(pluginPath);
    assert.ok(!lstat.isSymbolicLink(), `skills/${SKILL_NAME}/${rel} must be a real file, not a symlink`);

    // Verify intermediate path segments are also real directories and not symlinks
    const relParts = rel.split('/');
    let curPluginSegment = path.join(root, 'skills', SKILL_NAME);
    for (const part of relParts.slice(0, -1)) {
      curPluginSegment = path.join(curPluginSegment, part);
      const segmentStat = fs.lstatSync(curPluginSegment);
      assert.ok(!segmentStat.isSymbolicLink(), `${curPluginSegment} must not be a symlink`);
    }

    // Verify contents match root verbatim
    const rootContent = fs.readFileSync(rootPath);
    const pluginContent = fs.readFileSync(pluginPath);
    assert.ok(rootContent.equals(pluginContent), `skills/${SKILL_NAME}/${rel} content drifted from root ${rel}`);
  }

  // Verify the directory containers themselves are real directories and not symlinks
  assert.ok(!fs.lstatSync(path.join(root, 'skills', SKILL_NAME, 'references')).isSymbolicLink(), 'skills references must not be a symlink');
  assert.ok(!fs.lstatSync(path.join(root, 'skills', SKILL_NAME, 'scripts')).isSymbolicLink(), 'skills scripts must not be a symlink');
});

function isEscapedBacktick(content, pos) {
  let backslashes = 0;
  for (let p = pos - 1; p >= 0 && content[p] === '\\'; p--) backslashes++;
  return backslashes % 2 === 1;
}

// Linear scanner to extract relative Markdown links without quadratic backtracking
function extractRelativeMarkdownLinks(content) {
  const MAX_DOC_LENGTH = 1_000_000;
  if (content.length > MAX_DOC_LENGTH) {
    throw new Error(`Document length (${content.length}) exceeds safety limit of ${MAX_DOC_LENGTH}`);
  }

  const n = content.length;
  const codeRanges = []; // Non-overlapping [start, end] ranges for fenced blocks and inline code spans

  // Phase 1: Identify fenced code blocks and inline code spans in linear time
  let i = 0;
  while (i < n) {
    const ch = content[i];

    // Check for fenced code block (``` or ~~~) at line start (up to 3 leading spaces)
    if (ch === '`' || ch === '~') {
      const fenceChar = ch;
      let fenceLen = 0;
      while (i + fenceLen < n && content[i + fenceLen] === fenceChar) {
        fenceLen++;
      }
      if (fenceLen >= 3) {
        let p = i - 1;
        let spaces = 0;
        while (p >= 0 && content[p] === ' ') {
          spaces++;
          p--;
        }
        if ((p < 0 || content[p] === '\n') && spaces <= 3) {
          const fenceStart = i;
          i += fenceLen;
          let fenceEnd = n;
          while (i < n) {
            if (content[i] === '\n') {
              i++;
              let pClose = i;
              let closeSpaces = 0;
              while (pClose < n && content[pClose] === ' ') {
                closeSpaces++;
                pClose++;
              }
              if (closeSpaces <= 3 && content[pClose] === fenceChar) {
                let closeFenceLen = 0;
                while (pClose + closeFenceLen < n && content[pClose + closeFenceLen] === fenceChar) {
                  closeFenceLen++;
                }
                if (closeFenceLen >= fenceLen) {
                  i = pClose + closeFenceLen;
                  while (i < n && content[i] !== '\n') i++;
                  fenceEnd = i;
                  break;
                }
              }
            } else {
              i++;
            }
          }
          codeRanges.push([fenceStart, fenceEnd]);
          continue;
        }
      }
      // If fenceChar is '~' and not at line start, advance past the entire tilde run to prevent quadratic rescanning
      if (fenceChar === '~') {
        i += Math.max(fenceLen, 1);
        continue;
      }
    }

    // Process inline code spans within the current paragraph
    if (ch === '`') {
      let paraEnd = n;
      let p = i;
      while (p < n) {
        if (content[p] === '\n') {
          let q = p + 1;
          while (q < n && (content[q] === ' ' || content[q] === '\t')) q++;
          if (q >= n || content[q] === '\n' || content[q] === '\r') {
            paraEnd = p;
            break;
          }
          const spaces = q - (p + 1);
          if (spaces <= 3 && (content[q] === '`' || content[q] === '~')) {
            const fc = content[q];
            let fl = 0;
            while (q + fl < n && content[q + fl] === fc) fl++;
            if (fl >= 3) {
              paraEnd = p;
              break;
            }
          }
        }
        p++;
      }

      // Collect all backtick runs in [i, paraEnd)
      const runs = [];
      let cur = i;
      while (cur < paraEnd) {
        if (content[cur] === '`') {
          let rLen = 0;
          while (cur + rLen < paraEnd && content[cur + rLen] === '`') {
            rLen++;
          }
          runs.push({ start: cur, len: rLen });
          cur += rLen;
        } else {
          cur++;
        }
      }

      // Index runs by delimiter length: len -> array of run indices
      const runsByLen = new Map();
      for (let r = 0; r < runs.length; r++) {
        const l = runs[r].len;
        if (!runsByLen.has(l)) runsByLen.set(l, []);
        runsByLen.get(l).push(r);
      }

      // Match code spans per CommonMark Section 6.2 in a single linear pass
      let r = 0;
      const cursors = new Map(); // len -> monotonically advancing position in runsByLen list
      while (r < runs.length) {
        const openRun = runs[r];
        // A backslash-escaped first backtick is literal; the remainder of the run can still open
        const escaped = isEscapedBacktick(content, openRun.start);
        const openLen = escaped ? openRun.len - 1 : openRun.len;
        const openStart = escaped ? openRun.start + 1 : openRun.start;
        if (openLen === 0) {
          r++;
          continue;
        }

        const list = runsByLen.get(openLen) || [];
        let c = cursors.get(openLen) || 0;
        while (c < list.length && list[c] <= r) c++;
        cursors.set(openLen, c);
        const matchIdx = c < list.length ? list[c] : -1;
        if (matchIdx !== -1) {
          const closeRun = runs[matchIdx];
          codeRanges.push([openStart, closeRun.start + closeRun.len]);
          r = matchIdx + 1;
        } else {
          r++;
        }
      }

      i = paraEnd;
      continue;
    }

    i++;
  }

  // Phase 2: Extract links outside code ranges using bounded bracket stack
  const links = [];
  let rangeIdx = 0;
  const bracketStack = [];
  let noClosingParenBefore = -1;
  i = 0;

  while (i < n) {
    while (rangeIdx < codeRanges.length && i >= codeRanges[rangeIdx][1]) {
      rangeIdx++;
    }
    if (rangeIdx < codeRanges.length && i >= codeRanges[rangeIdx][0]) {
      i = codeRanges[rangeIdx][1];
      rangeIdx++;
      continue;
    }

    const ch = content[i];

    if (ch === '\\') {
      i += 2;
      continue;
    }

    // Candidate link start bracket
    if (ch === '[') {
      if (bracketStack.length < 32) {
        bracketStack.push(i);
      }
      i++;
      continue;
    }

    // Candidate link end bracket
    if (ch === ']') {
      if (bracketStack.length > 0) {
        const openIdx = bracketStack.pop();
        const labelLen = i - openIdx - 1;
        // CommonMark: link label length at most 999 characters
        if (labelLen <= 999 && i + 1 < n && content[i + 1] === '(') {
          const urlStart = i + 2;
          if (urlStart >= noClosingParenBefore) {
            let k = urlStart;
            while (k < n && content[k] !== ')' && content[k] !== '\n') {
              if (content[k] === '\\') k++;
              k++;
            }
            if (k < n && content[k] === ')') {
              noClosingParenBefore = -1;
              const rawTarget = content.slice(urlStart, k).trim();
              // Separate destination from optional title (e.g. [guide](./guide.md "Title") or <path>)
              const destMatch = rawTarget.match(/^(?:<([^>]+)>|(\S+))/);
              const destination = destMatch ? (destMatch[1] || destMatch[2]) : '';
              if (destination && !/^(?:https?:|mailto:|#)/i.test(destination)) {
                const cleanTarget = destination.split('#')[0].trim();
                if (cleanTarget) links.push(cleanTarget);
              }
              i = k + 1;
              continue;
            } else {
              noClosingParenBefore = k;
            }
          }
        }
      }
      i++;
      continue;
    }

    i++;
  }

  return links;
}

test('all relative markdown links in SKILL.md, plugin SKILL.md, README.md, CONTRIBUTING.md, and docs resolve to existing files', () => {
  const filesToCheck = [
    'SKILL.md',
    'skills/indonesian-linguist/SKILL.md',
    'README.md',
    'CONTRIBUTING.md',
    'AI_POLICY.md',
    'SECURITY.md',
    'skills/indonesian-linguist/TEST.md',
    'docs/agent-portability.md',
    'docs/sources.md',
    'docs/testing.md',
    'docs/releases.md',
    'references/README.md',
    'references/domains/README.md',
    'scripts/README.md',
  ];

  for (const relFile of filesToCheck) {
    const absFile = path.join(root, relFile);
    if (!fs.existsSync(absFile)) continue;
    const content = fs.readFileSync(absFile, 'utf8');
    const baseDir = path.dirname(absFile);
    for (const targetRel of extractRelativeMarkdownLinks(content)) {
      const resolved = path.resolve(baseDir, targetRel);
      assert.ok(
        fs.existsSync(resolved),
        `Broken relative link in ${relFile}: "${targetRel}" (resolved to ${resolved})`,
      );
    }
  }
});

test('extractRelativeMarkdownLinks handles link titles, code spans, fences, and repeated unmatched brackets safely', () => {
  // Markdown links with titles
  assert.deepEqual(
    extractRelativeMarkdownLinks('See the [guide](./docs/testing.md "Testing Guide") for details.'),
    ['./docs/testing.md'],
  );
  assert.deepEqual(
    extractRelativeMarkdownLinks("See [releases](./docs/releases.md 'Releases') here."),
    ['./docs/releases.md'],
  );
  assert.deepEqual(
    extractRelativeMarkdownLinks('Pointy destination [releases](<./docs/releases.md> "Title").'),
    ['./docs/releases.md'],
  );

  // Multi-backtick inline code spans containing bracketed link examples must not be extracted
  assert.deepEqual(
    extractRelativeMarkdownLinks('Inline single: `[missing](./missing.md)` is skipped.'),
    [],
  );
  assert.deepEqual(
    extractRelativeMarkdownLinks('Inline double: `` `[missing](./missing.md)` `` is skipped.'),
    [],
  );

  // Unmatched backtick runs are treated as literal text and bounded by paragraph / blank line
  assert.deepEqual(
    extractRelativeMarkdownLinks('Press the ` key.\n\nSee [valid](./docs/testing.md).'),
    ['./docs/testing.md'],
  );
  assert.deepEqual(
    extractRelativeMarkdownLinks('Press ` key and see [valid](./docs/testing.md).'),
    ['./docs/testing.md'],
  );

  // Fenced blocks at line start are ignored
  const fenced = '```markdown\n[missing](./missing.md)\n```\n[actual](./docs/testing.md)';
  assert.deepEqual(extractRelativeMarkdownLinks(fenced), ['./docs/testing.md']);

  // Triple backticks in prose without line start do not act as block fence
  const inProse = 'Prose ```[not a link](./missing.md)``` but [valid](./docs/testing.md)';
  assert.deepEqual(extractRelativeMarkdownLinks(inProse), ['./docs/testing.md']);

  // Valid nested link inside bracketed text
  assert.deepEqual(
    extractRelativeMarkdownLinks('[outer [inner](./docs/testing.md)]'),
    ['./docs/testing.md'],
  );

  // Linear scan bound check for repeated unmatched brackets with no newline
  const unmatched = '['.repeat(20000);
  const start = Date.now();
  const links = extractRelativeMarkdownLinks(unmatched);
  const durationMs = Date.now() - start;
  assert.deepEqual(links, []);
  assert.ok(durationMs < 200, `20,000 unmatched brackets took ${durationMs}ms (expected < 200ms)`);

  // Linear scan bound check for many distinct unmatched backtick runs (lengths 1..800)
  let distinctRuns = '';
  for (let len = 1; len <= 800; len++) {
    distinctRuns += '`'.repeat(len) + ' ';
  }
  distinctRuns += '\n\nSee [valid](./docs/testing.md)';
  const t0 = Date.now();
  const distinctLinks = extractRelativeMarkdownLinks(distinctRuns);
  const elapsedDistinct = Date.now() - t0;
  assert.deepEqual(distinctLinks, ['./docs/testing.md']);
  assert.ok(
    elapsedDistinct < 200,
    `800 distinct unmatched backtick runs took ${elapsedDistinct}ms (expected < 200ms)`,
  );

  // Linear scan bound check for many same-length backtick runs (50,000 runs)
  const sameLengthRuns = '` '.repeat(50000) + '\n\nSee [valid](./docs/testing.md)';
  const t1 = Date.now();
  const sameLengthLinks = extractRelativeMarkdownLinks(sameLengthRuns);
  const elapsedSameLength = Date.now() - t1;
  assert.deepEqual(sameLengthLinks, ['./docs/testing.md']);
  assert.ok(
    elapsedSameLength < 200,
    `50,000 same-length backtick runs took ${elapsedSameLength}ms (expected < 200ms)`,
  );

  // Escaped backticks: escaped single backtick does not open a span, so subsequent links are extracted
  assert.deepEqual(
    extractRelativeMarkdownLinks('Escaped backtick: \\` followed by [valid](./docs/testing.md) and stray `'),
    ['./docs/testing.md'],
  );
  // Escaped run of length 2 opens a span of length 1 starting after the escaped backtick
  assert.deepEqual(
    extractRelativeMarkdownLinks('Escaped run: \\``[missing](./missing.md)` and outside [valid](./docs/testing.md)'),
    ['./docs/testing.md'],
  );

  // Linear scan bound check for mid-line tildes (50,000 tildes)
  const midlineTildes = 'word ' + '~'.repeat(50000) + '\n\nSee [valid](./docs/testing.md)';
  const t2 = Date.now();
  const tildeLinks = extractRelativeMarkdownLinks(midlineTildes);
  const elapsedTilde = Date.now() - t2;
  assert.deepEqual(tildeLinks, ['./docs/testing.md']);
  assert.ok(
    elapsedTilde < 200,
    `50,000 mid-line tildes took ${elapsedTilde}ms (expected < 200ms)`,
  );

  // Linear scan bound check for repeated unclosed destination candidates on a long line
  const unclosedDestinations = '[a]( [b]( [c]( [d]( '.repeat(10000) + '\n\nSee [valid](./docs/testing.md)';
  const t3 = Date.now();
  const unclosedLinks = extractRelativeMarkdownLinks(unclosedDestinations);
  const elapsedUnclosed = Date.now() - t3;
  assert.deepEqual(unclosedLinks, ['./docs/testing.md']);
  assert.ok(
    elapsedUnclosed < 200,
    `10,000 unclosed destinations took ${elapsedUnclosed}ms (expected < 200ms)`,
  );
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

const OPENAI_SHORT_DESCRIPTION_REGEX = /^[ \t]*short_description:[ \t]*"([^"\r\n]+)"/m;

test('OpenAI / Codex agent metadata (skills/indonesian-linguist/agents/openai.yaml) is valid', () => {
  const yamlPath = 'skills/indonesian-linguist/agents/openai.yaml';
  assert.ok(fs.existsSync(path.join(root, yamlPath)), `${yamlPath} must exist`);
  const content = read(yamlPath);
  assert.ok(Buffer.byteLength(content, 'utf8') <= 100_000, 'openai.yaml file size must be within safety bounds');
  const shortDescMatch = content.match(OPENAI_SHORT_DESCRIPTION_REGEX);
  assert.ok(shortDescMatch, 'openai.yaml must define short_description');
  const len = shortDescMatch[1].length;
  assert.ok(len >= 25 && len <= 64, `short_description length (${len}) must be between 25 and 64 chars`);
  assert.match(content, /\$indonesian-linguist/, 'openai.yaml default_prompt must reference $indonesian-linguist');
});

test('openai.yaml regex matches strictly on single line without backtracking over repeated blank lines', () => {
  const blankLines = '   \n'.repeat(5000);
  const t0 = Date.now();
  const match = blankLines.match(OPENAI_SHORT_DESCRIPTION_REGEX);
  const elapsed = Date.now() - t0;
  assert.strictEqual(match, null);
  assert.ok(elapsed < 100, `Regex evaluation took too long: ${elapsed}ms`);
});

test('all markdown files have balanced code fences and zero unfinished TODO/TBD/FIXME markers', () => {
  const mdFiles = [
    'SKILL.md',
    'AGENTS.md',
    'README.md',
    'CONTRIBUTING.md',
    'AI_POLICY.md',
    'SECURITY.md',
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
    'SECURITY.md',
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
