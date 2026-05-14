const fs = require('fs');
const path = require('path');

const DEFAULT_PROFILE = 'standard';
const DEFAULT_SESSION_START_MAX_CHARS = 8000;
const STATE_DIR_NAME = '.claude-android-kit-state';
const STATE_FILE_NAME = 'last-session.md';

const HOOKS_BY_PROFILE = Object.freeze({
  minimal: new Set([
    'cak:session-start',
    'cak:session-end',
    'cak:release-guard',
  ]),
  standard: new Set([
    'cak:session-start',
    'cak:session-end',
    'cak:release-guard',
    'cak:kt-lint',
    'cak:manifest-audit',
  ]),
  strict: new Set([
    'cak:session-start',
    'cak:session-end',
    'cak:release-guard',
    'cak:kt-lint',
    'cak:manifest-audit',
  ]),
});

function readHookInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getHookProfile() {
  const raw = String(process.env.CAK_HOOK_PROFILE || DEFAULT_PROFILE).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(HOOKS_BY_PROFILE, raw) ? raw : DEFAULT_PROFILE;
}

function getDisabledHookIds() {
  return new Set(
    String(process.env.CAK_DISABLED_HOOKS || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
  );
}

function isHookEnabled(hookId) {
  if (!hookId) {
    return false;
  }

  if (getDisabledHookIds().has(hookId)) {
    return false;
  }

  return HOOKS_BY_PROFILE[getHookProfile()].has(hookId);
}

function getSessionStartMaxChars() {
  const raw = String(process.env.CAK_SESSION_START_MAX_CHARS || DEFAULT_SESSION_START_MAX_CHARS).trim();
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_SESSION_START_MAX_CHARS;
}

function isSessionStartContextEnabled() {
  return String(process.env.CAK_SESSION_START_CONTEXT || 'on').trim().toLowerCase() !== 'off';
}

function isSessionPersistenceEnabled() {
  return String(process.env.CAK_SESSION_PERSISTENCE || 'on').trim().toLowerCase() !== 'off';
}

function isReleaseBuildAllowed() {
  return String(process.env.ALLOW_RELEASE_BUILD || '').trim() === '1';
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function getStateFilePath(cwd = process.cwd()) {
  return path.join(cwd, STATE_DIR_NAME, STATE_FILE_NAME);
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  } catch {
    return null;
  }
}

function writeTextFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function getEditedFilePath(hookInput) {
  const rawPath =
    hookInput?.tool_input?.file_path
    || hookInput?.tool_input?.filePath
    || hookInput?.file_path
    || hookInput?.filePath
    || '';

  if (!rawPath || typeof rawPath !== 'string') {
    return null;
  }

  return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
}

function getBashCommand(hookInput) {
  const rawCommand = hookInput?.tool_input?.command || hookInput?.command || '';
  return typeof rawCommand === 'string' ? rawCommand : '';
}

function findGradlew(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);

  while (true) {
    const unixGradlew = path.join(currentDir, 'gradlew');
    const windowsGradlew = path.join(currentDir, 'gradlew.bat');

    if (fs.existsSync(unixGradlew)) {
      return unixGradlew;
    }

    if (fs.existsSync(windowsGradlew)) {
      return windowsGradlew;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

module.exports = {
  findGradlew,
  getBashCommand,
  getEditedFilePath,
  getSessionStartMaxChars,
  getStateFilePath,
  isHookEnabled,
  isReleaseBuildAllowed,
  isSessionPersistenceEnabled,
  isSessionStartContextEnabled,
  readHookInput,
  readTextFile,
  writeTextFile,
};
