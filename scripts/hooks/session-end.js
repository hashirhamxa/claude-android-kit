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

function isFeedbackLoggingEnabled() {
  return String(process.env.CAK_FEEDBACK_LOGGING || 'on').trim().toLowerCase() !== 'off';
}

function getKitVersion() {
  try {
    const versionPath = path.join(__dirname, '..', '..', 'VERSION');
    const fs = require('fs');
    if (fs.existsSync(versionPath)) {
      return fs.readFileSync(versionPath, 'utf8').trim();
    }
    const installedVersion = path.join(require('os').homedir(), '.claude', '.cak-install-state.json');
    if (fs.existsSync(installedVersion)) {
      const state = JSON.parse(fs.readFileSync(installedVersion, 'utf8'));
      return state.version || null;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeFeedbackEntry(cwd, branchName) {
  if (!isFeedbackLoggingEnabled()) {
    return;
  }
  try {
    const os = require('os');
    const fs = require('fs');
    const feedbackPath = path.join(os.homedir(), '.claude', '.cak-feedback.jsonl');
    const entry = {
      timestamp: new Date().toISOString(),
      project: path.basename(cwd) || cwd,
      branch: branchName || null,
      cwd,
      kit_version: getKitVersion(),
      session_marker: 'stop_hook',
    };
    fs.appendFileSync(feedbackPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // feedback logging must never break a session
  }
}

function main() {
  if (!isHookEnabled(HOOK_ID)) {
    return;
  }

  if (!isSessionPersistenceEnabled()) {
    return;
  }

  const cwd = process.cwd();
  const branchName = findGitBranch(cwd);

  writeTextFile(getStateFilePath(), buildSummary());
  writeFeedbackEntry(cwd, branchName);
}

try {
  main();
} catch {
  process.exitCode = 0;
}
