#!/usr/bin/env node
/**
 * Synchronize root canonical assets (SKILL.md, references/, scripts/)
 * into skills/indonesian-linguist/ for standalone agent environments (Codex, Claude, etc.)
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const targetSkillDir = path.join(root, 'skills', 'indonesian-linguist');

function syncFile(src, dest) {
  const srcContent = fs.readFileSync(src);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, srcContent);
}

function syncDir(srcDir, destDir, ignoreFiles = []) {
  if (fs.existsSync(destDir)) {
    const stat = fs.lstatSync(destDir);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(destDir);
    }
  }
  fs.mkdirSync(destDir, { recursive: true });

  const srcEntries = fs.readdirSync(srcDir, { withFileTypes: true });
  const srcNames = new Set(srcEntries.map((e) => e.name));

  // Prune destination entries that no longer exist in source (excluding ignored files)
  const destEntries = fs.readdirSync(destDir, { withFileTypes: true });
  for (const destEntry of destEntries) {
    if (ignoreFiles.includes(destEntry.name)) {
      continue;
    }
    if (!srcNames.has(destEntry.name)) {
      const destPath = path.join(destDir, destEntry.name);
      fs.rmSync(destPath, { recursive: true, force: true });
    }
  }

  for (const entry of srcEntries) {
    if (ignoreFiles.includes(entry.name)) {
      continue;
    }
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      syncDir(srcPath, destPath, ignoreFiles);
    } else if (entry.isFile()) {
      syncFile(srcPath, destPath);
    }
  }
}

// 1. Sync SKILL.md
syncFile(path.join(root, 'SKILL.md'), path.join(targetSkillDir, 'SKILL.md'));

// 2. Sync references/
syncDir(path.join(root, 'references'), path.join(targetSkillDir, 'references'));

// 3. Sync scripts/ (omit repo-maintenance scripts like sync-skill.js)
syncDir(path.join(root, 'scripts'), path.join(targetSkillDir, 'scripts'), ['sync-skill.js']);

console.log('✓ Synchronized SKILL.md, references/, and scripts/ into skills/indonesian-linguist/');
