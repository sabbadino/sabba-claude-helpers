#!/usr/bin/env node
// Status line that keeps the resume branch warning visible. Shows a red line while the session's
// saved branch differs from the branch checked out in the session's project folder, and nothing
// otherwise. Optional argv[2]: another status line script to run first; its output is kept above
// the warning.
//
// The saved branch lives in ~/.claude/branch-guard/state/<session_id>.json. The resume hook
// writes it; this script derives it from the transcript when the file is missing, because on a
// resume Claude Code calls the status line within milliseconds of starting the hook and does not
// call it again until the user acts.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const STATE_DIR = path.join(os.homedir(), '.claude', 'branch-guard', 'state');
const RED = '\x1b[1;37;41m';
const OFF = '\x1b[0m';

let stdin = '';
try { stdin = fs.readFileSync(0, 'utf8'); } catch {}

let out = '';
if (process.argv[2]) {
  try {
    out = execFileSync(process.execPath, [process.argv[2]], {
      input: stdin, encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'ignore'],
    }).replace(/\n+$/, '');
  } catch {}
}

let warning = '';
try {
  const payload = JSON.parse(stdin);
  const file = path.join(STATE_DIR, `${payload.session_id}.json`);

  if (!fs.existsSync(file) && payload.transcript_path && fs.existsSync(payload.transcript_path)) {
    // The same lookup is in resume-branch-check.cjs; this file is copied alone to a stable path,
    // so it cannot share code with it.
    const lines = fs.readFileSync(payload.transcript_path, 'utf8').split('\n');
    let recorded = '';
    for (let i = lines.length - 1; i >= 0 && !recorded; i--) {
      if (!lines[i].includes('"gitBranch"')) continue;
      try {
        const entry = JSON.parse(lines[i]);
        if ((entry.type === 'user' || entry.type === 'assistant') && entry.gitBranch) recorded = entry.gitBranch;
      } catch {}
    }
    if (recorded) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
      fs.writeFileSync(file, JSON.stringify({ recorded }));
    }
  }

  if (fs.existsSync(file)) {
    const { recorded, dismissed } = JSON.parse(fs.readFileSync(file, 'utf8'));
    // project_dir is the repo the session started in. current_dir follows the working directory,
    // which /add-dir or a cd into another repo changes, and would report that repo's branch.
    const cwd = (payload.workspace && (payload.workspace.project_dir || payload.workspace.current_dir)) || payload.cwd || process.cwd();
    const current = execSync('git branch --show-current', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    // Clears itself once the user is back on the recorded branch, or after the user dismisses it.
    if (current && current !== recorded && !dismissed) {
      warning = `${RED} BRANCH MISMATCH: session ran on ${recorded}, checked out now: ${current} | /branch-guard:dismiss-branch-warning to hide ${OFF}`;
    }
  }
} catch {}

process.stdout.write([out, warning].filter(Boolean).join('\n'));
