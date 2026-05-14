#!/usr/bin/env node
// cak.js — Claude Android Kit lifecycle CLI
// Usage: node scripts/cak.js <command>
//
// Commands:
//   list-installed   list all CAK-managed files from the state file
//   doctor           check each listed file still exists; report [OK] or [MISSING]
//   repair           re-copy missing files from the kit source
//   uninstall        remove all state-tracked files and the state file
//   version          print the CAK version

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const KIT_ROOT    = path.resolve(__dirname, '..');
const INSTALL_ROOT = path.join(os.homedir(), '.claude');
const STATE_FILE  = path.join(INSTALL_ROOT, '.cak-install-state.json');

// ── state helpers ─────────────────────────────────────────────────────────────

function readState() {
  if (!fs.existsSync(STATE_FILE)) {
    process.stderr.write(`[ERROR] State file not found: ${STATE_FILE}\n`);
    process.stderr.write('Run install.sh / install.ps1 first.\n');
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (err) {
    process.stderr.write(`[ERROR] Could not parse state file: ${err.message}\n`);
    process.exit(1);
  }
}

// ── source path reconstruction ────────────────────────────────────────────────
// Reverses the install mapping: dest path → kit source path.
// Mapping:
//   ~/.claude/rules/cak/<pack>/X  →  <kit_root>/rules/<pack>/X
//   ~/.claude/<anything else>/X   →  <kit_root>/<anything else>/X

function destToSource(destPath) {
  const sep         = path.sep;
  const installLen  = INSTALL_ROOT.length + sep.length;
  const rel         = destPath.slice(installLen);                // relative to ~/.claude/

  const rulesCakPfx = ['rules', 'cak'].join(sep) + sep;
  if (rel.startsWith(rulesCakPfx)) {
    const afterCak = rel.slice(rulesCakPfx.length);             // e.g. common/git-workflow.md
    return path.join(KIT_ROOT, 'rules', afterCak);
  }

  return path.join(KIT_ROOT, rel);
}

// ── commands ──────────────────────────────────────────────────────────────────

function cmdVersion() {
  const versionFile = path.join(KIT_ROOT, 'VERSION');
  if (!fs.existsSync(versionFile)) {
    process.stdout.write('0.2.0\n');
    return;
  }
  process.stdout.write(fs.readFileSync(versionFile, 'utf8').trim() + '\n');
}

function cmdListInstalled() {
  const state = readState();
  const files = state.files || [];

  process.stdout.write(`CAK ${state.version}  profile: ${state.profile}  installed: ${state.installedAt}\n`);
  process.stdout.write(`${files.length} managed file(s):\n\n`);
  for (const f of files) {
    process.stdout.write(`  ${f}\n`);
  }
}

function cmdDoctor() {
  const state = readState();
  const files = state.files || [];

  let missing = 0;
  for (const f of files) {
    if (fs.existsSync(f)) {
      process.stdout.write(`[OK]      ${f}\n`);
    } else {
      process.stdout.write(`[MISSING] ${f}\n`);
      missing++;
    }
  }

  process.stdout.write(`\n${files.length} files checked — `);
  if (missing === 0) {
    process.stdout.write('all present.\n');
  } else {
    process.stdout.write(`${missing} missing. Run "node scripts/cak.js repair" to restore them.\n`);
  }
}

function cmdRepair() {
  const state = readState();
  const files = state.files || [];

  let repaired = 0;
  let skipped  = 0;
  let failed   = 0;

  for (const destPath of files) {
    if (fs.existsSync(destPath)) {
      skipped++;
      continue;
    }

    const srcPath = destToSource(destPath);
    if (!fs.existsSync(srcPath)) {
      process.stderr.write(`[ERROR] Source not found for repair: ${srcPath}\n`);
      process.stderr.write('        Ensure you are running from the kit root.\n');
      failed++;
      continue;
    }

    try {
      const destDir = path.dirname(destPath);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      process.stdout.write(`[REPAIRED] ${destPath}\n`);
      repaired++;
    } catch (err) {
      process.stderr.write(`[ERROR] Could not repair ${destPath}: ${err.message}\n`);
      failed++;
    }
  }

  process.stdout.write(`\nRepair complete — ${repaired} restored, ${skipped} already present`);
  if (failed > 0) {
    process.stdout.write(`, ${failed} failed`);
  }
  process.stdout.write('.\n');

  if (failed > 0) {
    process.exit(1);
  }
}

function cmdUninstall() {
  const state = readState();
  const files = state.files || [];

  let removed  = 0;
  let gone     = 0;

  for (const f of files) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      process.stdout.write(`Removed: ${f}\n`);
      removed++;
    } else {
      process.stdout.write(`Already gone: ${f}\n`);
      gone++;
    }
  }

  fs.unlinkSync(STATE_FILE);
  process.stdout.write(`Removed state file: ${STATE_FILE}\n`);
  process.stdout.write(`CAK uninstalled (${removed} files removed, ${gone} already absent).\n`);
}

// ── dispatch ──────────────────────────────────────────────────────────────────

const COMMANDS = {
  'list-installed': cmdListInstalled,
  'doctor':         cmdDoctor,
  'repair':         cmdRepair,
  'uninstall':      cmdUninstall,
  'version':        cmdVersion,
};

function showHelp() {
  process.stdout.write(`
CAK lifecycle CLI

Usage: node scripts/cak.js <command>

Commands:
  list-installed   list all CAK-managed files from the state file
  doctor           check each file still exists; report [OK] or [MISSING]
  repair           re-copy missing files from the kit source
  uninstall        remove all state-tracked files and the state file
  version          print the CAK version

State file: ${STATE_FILE}
`.trimStart());
}

const cmd = process.argv[2];

if (!cmd || cmd === '--help' || cmd === '-h') {
  showHelp();
} else if (COMMANDS[cmd]) {
  try {
    COMMANDS[cmd]();
  } catch (err) {
    process.stderr.write(`[ERROR] ${err.message}\n`);
    process.exit(1);
  }
} else {
  process.stderr.write(`[ERROR] Unknown command: ${cmd}\n`);
  showHelp();
  process.exit(1);
}
