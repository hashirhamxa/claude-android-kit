#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');
const {
  findGradlew,
  getEditedFilePath,
  isHookEnabled,
  readHookInput,
} = require('../lib/utils');

const HOOK_ID = 'cak:kt-lint';

function runKtlint(gradlewPath) {
  const cwd = path.dirname(gradlewPath);

  if (process.platform === 'win32' && gradlewPath.endsWith('.bat')) {
    return spawnSync(gradlewPath, ['ktlintCheck'], {
      cwd,
      encoding: 'utf8',
      shell: true,
      stdio: 'pipe',
    });
  }

  return spawnSync(gradlewPath, ['ktlintCheck'], {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

function main() {
  if (!isHookEnabled(HOOK_ID)) {
    return;
  }

  const input = readHookInput();
  const filePath = getEditedFilePath(input);

  if (!filePath || !filePath.endsWith('.kt')) {
    return;
  }

  const gradlewPath = findGradlew(process.cwd());
  if (!gradlewPath) {
    return;
  }

  const result = runKtlint(gradlewPath);
  if (result.status === 0) {
    return;
  }

  const details = [result.stderr, result.stdout]
    .filter(Boolean)
    .join('\n')
    .trim();

  console.error(`[cak:kt-lint] Warning: ktlintCheck failed after editing ${filePath}.`);
  if (details) {
    console.error(details);
  }
}

try {
  main();
} catch {
  process.exitCode = 0;
}
