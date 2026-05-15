#!/usr/bin/env node
// cak-feedback-report.js -- Weekly feedback aggregator for claude-android-kit
//
// Usage:
//   node scripts/cak-feedback-report.js [--weeks N] [--projects path1,path2,...]
//
// Reads:
//   ~/.claude/.cak-feedback.jsonl        passive session log (written by session-end hook)
//   <project>/.claude/cak-feedback.md   manual per-project reflection log
//
// Writes: markdown report to stdout. Pipe to a file if you want to save it.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ── arg parsing ───────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { weeks: 1, projects: [process.cwd()] };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--weeks' && argv[i + 1]) {
      const n = Number.parseInt(argv[++i], 10);
      if (Number.isInteger(n) && n > 0) args.weeks = n;
    } else if (argv[i] === '--projects' && argv[i + 1]) {
      args.projects = argv[++i].split(',').map(p => p.trim()).filter(Boolean);
    }
  }
  return args;
}

// ── date helpers ──────────────────────────────────────────────────────────────

function weeksAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

// ── JSONL reader ──────────────────────────────────────────────────────────────

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const entries = [];
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  return entries;
}

// ── markdown feedback reader ──────────────────────────────────────────────────

const TAG_RE = /^\s*-\s+(\d{4}-\d{2}-\d{2})\s+\[(help|noise|wrong|missing|bug)\]\s+(.+)$/i;

function readProjectFeedback(projectPath) {
  const feedbackFile = path.join(projectPath, '.claude', 'cak-feedback.md');
  if (!fs.existsSync(feedbackFile)) return [];

  const lines = fs.readFileSync(feedbackFile, 'utf8').split('\n');
  const entries = [];
  for (const line of lines) {
    const m = line.match(TAG_RE);
    if (m) {
      entries.push({
        date: m[1],
        tag: m[2].toLowerCase(),
        text: m[3].trim(),
        project: path.basename(projectPath),
      });
    }
  }
  return entries;
}

// ── sparkline ────────────────────────────────────────────────────────────────

const SPARKS = [' ', '_', '.', ':', '-', '=', '+', '|', '!', '#'];

function sparkline(counts) {
  if (counts.length === 0) return '(no data)';
  const max = Math.max(...counts, 1);
  return counts.map(c => SPARKS[Math.min(Math.floor((c / max) * (SPARKS.length - 1)), SPARKS.length - 1)]).join('');
}

// ── agent/command pattern extraction ─────────────────────────────────────────

const AGENT_RE   = /@([\w-]+)/g;
const COMMAND_RE = /\/([\w-]+)/g;

function extractMentions(text) {
  const mentions = [];
  let m;
  while ((m = AGENT_RE.exec(text)) !== null) mentions.push('@' + m[1]);
  while ((m = COMMAND_RE.exec(text)) !== null) mentions.push('/' + m[1]);
  return mentions;
}

// ── known kit surface ────────────────────────────────────────────────────────

const KNOWN_AGENTS = [
  '@android-architect',
  '@android-build-resolver',
  '@android-security-reviewer',
  '@compose-reviewer',
  '@gradle-resolver',
  '@kmp-migration-planner',
  '@kotlin-reviewer',
  '@room-migration-planner',
];

const KNOWN_COMMANDS = [
  '/new-android',
  '/new-kmm',
  '/new-feature',
  '/compose-review',
  '/gradle-fix',
  '/ui-from-image',
  '/audit-kit',
];

const KNOWN_SKILLS = [
  'new-project-android',
  'new-project-kmm',
  'feature-vertical-slice',
  'gradle-troubleshooting',
  'ui-from-image',
];

const KNOWN_HOOKS = [
  'session-start',
  'session-end',
  'release-guard',
  'kt-lint',
  'manifest-audit',
];

// ── report sections ──────────────────────────────────────────────────────────

function sessionActivitySection(sessions, weeks) {
  const out = [];
  out.push('## Session activity');

  if (sessions.length === 0) {
    out.push('');
    out.push('No sessions recorded in .cak-feedback.jsonl for this period.');
    out.push('');
    out.push('Enable session logging: install with --profile full and ensure CAK_FEEDBACK_LOGGING is not set to off.');
    return out.join('\n');
  }

  out.push('');
  out.push('- Total sessions: ' + sessions.length);

  // per-project counts
  const byProject = {};
  for (const s of sessions) {
    byProject[s.project] = (byProject[s.project] || 0) + 1;
  }
  const projectRows = Object.entries(byProject).sort((a, b) => b[1] - a[1]);
  out.push('');
  out.push('Sessions per project:');
  out.push('');
  out.push('  Project                          Count');
  out.push('  ' + '-'.repeat(42));
  for (const [proj, count] of projectRows) {
    out.push('  ' + proj.padEnd(33) + count);
  }

  // most active branch
  const byBranch = {};
  for (const s of sessions) {
    if (s.branch) byBranch[s.branch] = (byBranch[s.branch] || 0) + 1;
  }
  const topBranch = Object.entries(byBranch).sort((a, b) => b[1] - a[1])[0];
  if (topBranch) {
    out.push('');
    out.push('- Most active branch: ' + topBranch[0] + ' (' + topBranch[1] + ' sessions)');
  }

  // sparkline per day
  const dayBuckets = {};
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayBuckets[isoDate(d)] = 0;
  }
  for (const s of sessions) {
    const day = (s.timestamp || '').slice(0, 10);
    if (day in dayBuckets) dayBuckets[day]++;
  }
  const dayCounts = Object.values(dayBuckets);
  out.push('');
  out.push('- Sessions per day: [' + sparkline(dayCounts) + '] (oldest -> newest)');

  return out.join('\n');
}

function feedbackByTagSection(feedbackEntries) {
  const out = [];
  out.push('## Project feedback');

  if (feedbackEntries.length === 0) {
    out.push('');
    out.push('No manual feedback entries found in .claude/cak-feedback.md for any of the specified projects.');
    out.push('');
    out.push('To start logging: node scripts/cak.js feedback --init');
    return out.join('\n');
  }

  const TAGS = ['help', 'noise', 'wrong', 'missing', 'bug'];
  for (const tag of TAGS) {
    const entries = feedbackEntries.filter(e => e.tag === tag);
    out.push('');
    out.push('### [' + tag + '] -- ' + entries.length + ' entr' + (entries.length === 1 ? 'y' : 'ies'));
    if (entries.length === 0) {
      out.push('');
      out.push('None.');
    } else {
      out.push('');
      for (const e of entries) {
        out.push('- ' + e.date + ' [' + e.project + '] ' + e.text);
      }
    }
  }

  return out.join('\n');
}

function signalsSection(feedbackEntries) {
  const out = [];
  out.push('## Signals');

  if (feedbackEntries.length === 0) {
    out.push('');
    out.push('No manual feedback entries. Cannot compute signals.');
    return out.join('\n');
  }

  // most cited helpful agent/command
  const helpMentions = {};
  for (const e of feedbackEntries.filter(f => f.tag === 'help')) {
    for (const m of extractMentions(e.text)) {
      helpMentions[m] = (helpMentions[m] || 0) + 1;
    }
  }
  const topHelp = Object.entries(helpMentions).sort((a, b) => b[1] - a[1]);

  out.push('');
  out.push('Most-cited helpful agent or command:');
  if (topHelp.length === 0) {
    out.push('  (no @agent or /command mentions in [help] entries)');
  } else {
    for (const [name, count] of topHelp.slice(0, 5)) {
      out.push('  ' + name.padEnd(35) + count + ' mention' + (count > 1 ? 's' : ''));
    }
  }

  // most cited annoying thing
  const noiseMentions = {};
  for (const e of feedbackEntries.filter(f => f.tag === 'noise')) {
    for (const m of extractMentions(e.text)) {
      noiseMentions[m] = (noiseMentions[m] || 0) + 1;
    }
  }
  const topNoise = Object.entries(noiseMentions).sort((a, b) => b[1] - a[1]);

  out.push('');
  out.push('Most-cited noise source:');
  if (topNoise.length === 0) {
    out.push('  (no @agent or /command mentions in [noise] entries)');
  } else {
    for (const [name, count] of topNoise.slice(0, 5)) {
      out.push('  ' + name.padEnd(35) + count + ' mention' + (count > 1 ? 's' : ''));
    }
  }

  // most cited missing thing
  const missingEntries = feedbackEntries.filter(f => f.tag === 'missing');
  out.push('');
  out.push('Most-cited missing things (' + missingEntries.length + '):');
  if (missingEntries.length === 0) {
    out.push('  (none)');
  } else {
    for (const e of missingEntries) {
      out.push('  - [' + e.project + '] ' + e.text);
    }
  }

  // wrong entries verbatim
  const wrongEntries = feedbackEntries.filter(f => f.tag === 'wrong');
  out.push('');
  out.push('Wrong-advice entries (' + wrongEntries.length + '):');
  if (wrongEntries.length === 0) {
    out.push('  (none)');
  } else {
    for (const e of wrongEntries) {
      out.push('  - ' + e.date + ' [' + e.project + '] ' + e.text);
    }
  }

  return out.join('\n');
}

function recommendationsSection(feedbackEntries, sessions) {
  const out = [];
  out.push('## Recommendations');

  const recs = [];

  // Check for kit surface items never mentioned in [help]
  const helpText = feedbackEntries.filter(f => f.tag === 'help').map(f => f.text).join(' ');
  const unusedAgents = KNOWN_AGENTS.filter(a => !helpText.includes(a));
  if (unusedAgents.length > 0 && feedbackEntries.filter(f => f.tag === 'help').length >= 3) {
    recs.push('Agents with no [help] mentions (consider whether they are discoverable or useful): ' + unusedAgents.join(', '));
  }

  // Missing entries clustering
  const missingEntries = feedbackEntries.filter(f => f.tag === 'missing');
  const missingWords = {};
  for (const e of missingEntries) {
    const words = e.text.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (w.length > 4) missingWords[w] = (missingWords[w] || 0) + 1;
    }
  }
  const clusteredMissing = Object.entries(missingWords).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]);
  if (clusteredMissing.length > 0) {
    for (const [word, count] of clusteredMissing) {
      recs.push('v0.3.0 candidate: "' + word + '" appears in ' + count + ' [missing] entries -- consider a new skill or agent covering this area.');
    }
  } else if (missingEntries.length >= 3) {
    recs.push('You have ' + missingEntries.length + ' [missing] entries. Review them together: are any related enough to become a new skill or agent?');
  }

  // Hook noise
  const noiseEntries = feedbackEntries.filter(f => f.tag === 'noise');
  const hookNoise = {};
  for (const e of noiseEntries) {
    for (const hook of KNOWN_HOOKS) {
      if (e.text.toLowerCase().includes(hook)) {
        hookNoise[hook] = (hookNoise[hook] || 0) + 1;
      }
    }
  }
  for (const [hook, count] of Object.entries(hookNoise)) {
    if (count >= 3) {
      recs.push('Hook "' + hook + '" has ' + count + ' [noise] entries. Consider tuning it or disabling it with CAK_DISABLED_HOOKS=cak:' + hook + '.');
    }
  }

  // Wrong advice clustering on one agent
  const wrongEntries = feedbackEntries.filter(f => f.tag === 'wrong');
  const agentWrong = {};
  for (const e of wrongEntries) {
    for (const m of extractMentions(e.text)) {
      if (m.startsWith('@')) agentWrong[m] = (agentWrong[m] || 0) + 1;
    }
  }
  for (const [agent, count] of Object.entries(agentWrong)) {
    if (count >= 2) {
      recs.push('Agent ' + agent + ' has ' + count + ' [wrong] entries. Review its system prompt for the pattern causing incorrect advice.');
    }
  }

  // Thin data notice
  const totalFeedback = feedbackEntries.length;
  const totalSessions = sessions.length;
  if (totalFeedback < 5) {
    recs.push('Not enough manual feedback entries (' + totalFeedback + ') to draw reliable conclusions. Keep logging for another week or two.');
  }
  if (totalSessions < 3) {
    recs.push('Not enough session data (' + totalSessions + ' sessions in period) to draw session-level conclusions.');
  }

  out.push('');
  if (recs.length === 0) {
    out.push('No evidence-based recommendations at this time. Data looks good or is too thin to flag anything specific.');
  } else {
    for (const r of recs) {
      out.push('- ' + r);
    }
  }

  return out.join('\n');
}

// ── main ──────────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv);
  const cutoff = weeksAgo(args.weeks);

  // read passive session log
  const jsonlPath = path.join(os.homedir(), '.claude', '.cak-feedback.jsonl');
  const allSessions = readJsonl(jsonlPath);
  const sessions = allSessions.filter(s => {
    try {
      return new Date(s.timestamp) >= cutoff;
    } catch {
      return false;
    }
  });

  // read manual project feedback
  const allFeedback = [];
  for (const projectPath of args.projects) {
    const absPath = path.resolve(projectPath);
    const entries = readProjectFeedback(absPath);
    for (const e of entries) {
      try {
        if (new Date(e.date) >= cutoff) allFeedback.push(e);
      } catch {
        allFeedback.push(e); // include if date is unparseable
      }
    }
  }

  const lines = [];

  lines.push('# CAK Feedback Report');
  lines.push('Generated: ' + nowIso());
  lines.push('Period: last ' + args.weeks + ' week' + (args.weeks === 1 ? '' : 's'));
  lines.push('Projects: ' + args.projects.map(p => path.basename(path.resolve(p))).join(', '));
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(sessionActivitySection(sessions, args.weeks));
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(feedbackByTagSection(allFeedback));
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(signalsSection(allFeedback));
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(recommendationsSection(allFeedback, sessions));
  lines.push('');

  process.stdout.write(lines.join('\n'));
}

main();
