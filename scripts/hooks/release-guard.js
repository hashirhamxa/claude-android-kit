#!/usr/bin/env node

const {
  getBashCommand,
  isHookEnabled,
  isReleaseBuildAllowed,
  readHookInput,
} = require('../lib/utils');

const HOOK_ID = 'cak:release-guard';

function isBlockedReleaseCommand(command) {
  return command.includes(':app:installRelease') || command.includes('assembleRelease');
}

function main() {
  if (!isHookEnabled(HOOK_ID)) {
    return;
  }

  const command = getBashCommand(readHookInput());
  if (!command || !isBlockedReleaseCommand(command)) {
    return;
  }

  if (isReleaseBuildAllowed()) {
    return;
  }

  console.error('[cak:release-guard] BLOCKED: release Gradle command detected.');
  console.error('[cak:release-guard] Set ALLOW_RELEASE_BUILD=1 for this command if the release build is intentional.');
  process.exit(2);
}

try {
  main();
} catch {
  process.exitCode = 0;
}
