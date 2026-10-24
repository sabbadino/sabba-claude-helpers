// Opt-in: a session title starting with "!" (set via /rename) becomes "[repo:branch] title".
// Runs on the next prompt after the rename; nothing else is ever touched.
import { execSync } from 'node:child_process';
import { basename } from 'node:path';

let raw = '';
for await (const c of process.stdin) raw += c;
const input = JSON.parse(raw || '{}');

const title = (input.session_title || '').trim();
if (!title.startsWith('!')) process.exit(0);

const git = (a) => { try { return execSync(`git ${a}`, { cwd: input.cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
const top = git('rev-parse --show-toplevel');
if (!top) process.exit(0);
const prefix = `[${basename(top)}:${git('branch --show-current') || 'detached'}]`;

const bare = title.replace(/^!+\s*/, '');
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', sessionTitle: bare ? `${prefix} ${bare}` : prefix } }));
