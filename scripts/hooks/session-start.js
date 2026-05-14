#!/usr/bin/env node

const {
  getSessionStartMaxChars,
  getStateFilePath,
  isHookEnabled,
  isSessionStartContextEnabled,
  readTextFile,
} = require('../lib/utils');

const HOOK_ID = 'cak:session-start';

function buildPayload(additionalContext) {
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext,
    },
  });
}

function main() {
  if (!isHookEnabled(HOOK_ID)) {
    return;
  }

  if (!isSessionStartContextEnabled()) {
    return;
  }

  const maxChars = getSessionStartMaxChars();
  if (maxChars === 0) {
    return;
  }

  const content = readTextFile(getStateFilePath());
  if (!content) {
    return;
  }

  const truncated = content.slice(0, maxChars);
  if (!truncated) {
    return;
  }

  process.stdout.write(buildPayload(truncated));
}

try {
  main();
} catch {
  process.exitCode = 0;
}
