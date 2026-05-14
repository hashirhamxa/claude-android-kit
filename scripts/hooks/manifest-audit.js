#!/usr/bin/env node

const path = require('path');
const {
  getEditedFilePath,
  isHookEnabled,
  readHookInput,
  readTextFile,
} = require('../lib/utils');

const HOOK_ID = 'cak:manifest-audit';
const COMPONENT_TAGS = ['activity', 'service', 'receiver', 'provider'];

function normalizePathForMatch(filePath) {
  return String(filePath || '').replace(/\\/g, '/');
}

function collectExportedWarnings(content) {
  const warnings = [];

  for (const tagName of COMPONENT_TAGS) {
    const tagPattern = new RegExp(`<${tagName}\\b[\\s\\S]*?>`, 'gi');

    for (const match of content.matchAll(tagPattern)) {
      const tagSource = match[0];
      const hasExportedTrue = /android:exported\s*=\s*"true"/i.test(tagSource);
      const hasPermission = /android:permission\s*=\s*"[^"]+"/i.test(tagSource);

      if (hasExportedTrue && !hasPermission) {
        warnings.push(tagName);
      }
    }
  }

  return warnings;
}

function main() {
  if (!isHookEnabled(HOOK_ID)) {
    return;
  }

  const input = readHookInput();
  const filePath = getEditedFilePath(input);

  if (!filePath || path.basename(filePath) !== 'AndroidManifest.xml') {
    return;
  }

  const content = readTextFile(filePath);
  if (!content) {
    return;
  }

  const exportedWarnings = collectExportedWarnings(content);
  if (exportedWarnings.length > 0) {
    const uniqueTags = Array.from(new Set(exportedWarnings)).join(', ');
    console.error(
      `[cak:manifest-audit] Warning: ${filePath} contains exported ${uniqueTags} declarations without android:permission.`
    );
  }

  const normalizedPath = normalizePathForMatch(filePath).toLowerCase();
  const isDebugOnlyManifest = normalizedPath.includes('/debug/');
  const hasDebuggableTrue = /android:debuggable\s*=\s*"true"/i.test(content);

  if (hasDebuggableTrue && !isDebugOnlyManifest) {
    console.error(
      `[cak:manifest-audit] Warning: ${filePath} sets android:debuggable="true". Keep that in a /debug/ manifest only.`
    );
  }
}

try {
  main();
} catch {
  process.exitCode = 0;
}
