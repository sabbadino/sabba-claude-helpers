#!/usr/bin/env node
// Hides the branch mismatch status line for the current session. Run by /branch-guard:dismiss-branch-warning.
// Sets dismissed:true in the session's state file; the next resume rewrites the file, so a new
// resume warns again.
const fs = require('fs');
const os = require('os');
const path = require('path');

const session = process.env.CLAUDE_CODE_SESSION_ID;
if (!session) {
  console.log('CLAUDE_CODE_SESSION_ID is not set; nothing dismissed.');
  process.exit(1);
}

const file = path.join(os.homedir(), '.claude', 'branch-guard', 'state', `${session}.json`);
let state = {};
try { state = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
state.dismissed = true;
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(state));
console.log(`Branch warning dismissed for session ${session}.`);
