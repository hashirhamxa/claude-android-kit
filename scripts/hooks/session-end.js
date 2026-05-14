#!/usr/bin/env node

const path = require('path');
const {
  getStateFilePath,
  isHookEnabled,
  isSessionPersistenceEnabled,
  readTextFile,
  writeTextFile,
} = require('../lib/utils');

const HOOK_ID = 'cak:session-end';

function formatTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function findNearestFile(startDir, fileName) {
  let currentDir = path.resolve(startDir);

  while (true) {
    const candidate = path.join(currentDir, fileName);
    if (readTextFile(candidate) !== null) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function extractClaudeProjectName(content) {
  if (!content) {
    return null;
  }

  const titledClaudeFile = content.match(/^#\s+CLAUDE\.md\s+(?:-|—)\s*(.+)$/im);
  if (titledClaudeFile && titledClaudeFile[1].trim()) {
    return titledClaudeFile[1].trim();
  }

  const genericHeading = content.match(/^#\s+(.+)$/m);
  if (!genericHeading) {
    return null;
  }

  const heading = genericHeading[1].trim();
  return /^CLAUDE\.md$/i.test(heading) ? null : heading;
}

function findGitBranch(startDir) {
  let currentDir = path.resolve(startDir);

  while (true) {
    const gitHeadPath = path.join(currentDir, '.git', 'HEAD');
    const headContent = readTextFile(gitHeadPath);

    if (headContent !== null) {
      const trimmed = headContent.trim();
      if (!trimmed.startsWith('ref: ')) {
        return null;
      }

      const ref = trimmed.slice(5).trim();
      const prefix = 'refs/heads/';
      return ref.startsWith(prefix) ? ref.slice(prefix.length) : null;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function buildSummary() {
  const cwd = process.cwd();
  const claudePath = findNearestFile(cwd, 'CLAUDE.md');
  const claudeProjectName = claudePath ? extractClaudeProjectName(readTextFile(claudePath)) : null;
  const branchName = findGitBranch(cwd);

  const lines = [
    '# Last session',
    '',
    `- Saved: ${formatTimestamp()}`,
    `- Project: ${path.basename(cwd) || cwd}`,
    `- Cwd: ${cwd}`,
  ];

  if (branchName) {
    lines.push(`- Git branch: ${branchName}`);
  }

  if (claudeProjectName) {
    lines.push(`- CLAUDE.md project: ${claudeProjectName}`);
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function main() {
  if (!isHookEnabled(HOOK_ID)) {
    return;
  }

  if (!isSessionPersistenceEnabled()) {
    return;
  }

  writeTextFile(getStateFilePath(), buildSummary());
}

try {
  main();
} catch {
  process.exitCode = 0;
}
