#!/usr/bin/env node
// SessionStart hook. Two jobs:
//   1. On every start, copy branch-statusline.cjs, under the same name, to a stable folder (~/.claude/branch-guard/),
//      so the user's `statusLine` setting never has to point inside the plugin cache, whose folder
//      changes with each plugin version.
//   2. On resume, save the branch the session last ran on and, if it differs from the checked-out
//      branch, warn. Never blocks the session.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const HOME_DIR = path.join(os.homedir(), '.claude', 'branch-guard');
const STATE_DIR = path.join(HOME_DIR, 'state');

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(input);

    try {
      fs.mkdirSync(HOME_DIR, { recursive: true });
      fs.copyFileSync(path.join(__dirname, 'branch-statusline.cjs'), path.join(HOME_DIR, 'branch-statusline.cjs'));
    } catch {}

    const { transcript_path: transcript, cwd } = payload;
    if (payload.source !== 'resume' || !transcript || !fs.existsSync(transcript)) return;

    // The transcript is JSONL; the last conversation entry (user or assistant) carrying gitBranch is
    // where the session last ran. Other entry types, such as away_summary recaps, carry a gitBranch
    // that is not the session's own and cause false mismatches.
    // (The same lookup is in branch-statusline.cjs, which must stay a single self-contained file.)
    const lines = fs.readFileSync(transcript, 'utf8').split('\n');
    let recorded = '';
    for (let i = lines.length - 1; i >= 0 && !recorded; i--) {
      if (!lines[i].includes('"gitBranch"')) continue;
      try {
        const entry = JSON.parse(lines[i]);
        if ((entry.type === 'user' || entry.type === 'assistant') && entry.gitBranch) recorded = entry.gitBranch;
      } catch {}
    }
    if (!recorded) return;

    const current = execSync('git branch --show-current', { cwd: cwd || process.cwd(), encoding: 'utf8' }).trim();

    // The status line reads this baseline to keep the warning on screen. It is written on every
    // resume, matching or not, so a baseline left by an earlier resume cannot raise a false warning.
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(path.join(STATE_DIR, `${payload.session_id}.json`), JSON.stringify({ recorded, current }));

    if (!current || current === recorded) return;

    const message = `Branch mismatch: this session last ran on "${recorded}" but "${current}" is checked out now. Check which branch you want before editing or committing.`;
    process.stdout.write(JSON.stringify({
      systemMessage: message,
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `${message} Start your next reply with this warning, in one line, so the user sees it at the bottom of the terminal.`,
      },
    }));
  } catch {
    // A diagnostic hook must never break session start.
  }
});
