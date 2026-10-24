# branch-guard

Claude Code plugin: warns when you resume a session on a different git branch than the one it last ran on.

When you run `claude --resume`, Claude Code does not check out the branch the session used. The session continues on whatever branch is checked out now, which is easy to miss. This plugin makes the mismatch visible in three places:

- a red line in the status line, `BRANCH MISMATCH: session ran on X, checked out now: Y`, which stays until you check out X again or dismiss it;
- a message at the top of the resumed session;
- a one-line warning that Claude puts at the start of its first reply.

`/branch-guard:dismiss-branch-warning` hides the red line for the current session. Resuming the session again brings the warning back if the branches still differ.

## Install

```
/plugin marketplace add sabbadino/sabba-claude-helpers
/plugin install branch-guard@title-prefix-marketplace
```

Requires Node and git on PATH. Restart Claude Code after installing.

## Manual step: enable the status line

A plugin can ship hooks and commands, but it cannot set the `statusLine` setting. The hook and the dismiss command work as soon as the plugin is installed. The red status line needs one setting that you add yourself:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"$HOME/.claude/branch-guard/statusline.cjs\""
  }
}
```

The path is stable on purpose. The plugin's own folder changes with every version, so the plugin's hook copies the script to `~/.claude/branch-guard/statusline.cjs` each time a session starts. The first session after installing is therefore the first one that has the script in place.

### Where to put the setting

Claude Code reads `statusLine` from three files. It uses a single `statusLine` and does not merge them: the highest-priority file that defines one wins.

| Level | File | Applies to | Priority |
|---|---|---|---|
| User | `~/.claude/settings.json` | every project on your machine | lowest |
| Project | `.claude/settings.json` in the repo | everyone who uses that repo, committed to git | middle |
| Local | `.claude/settings.local.json` in the repo | only you, in that repo, not committed | highest |

**Put it at user level.** It is your personal preference and it then covers every repo.

**Project level can override it.** If a repo defines its own `statusLine` in `.claude/settings.json`, that one wins and the branch warning will not show in that repo. To get it back there without touching the shared file, add the same setting to that repo's `.claude/settings.local.json`. That replaces the project's status line for you only.

### Keeping an existing status line

If a repo already has a status line you want to keep, pass its script as an argument. The branch-guard script runs it first and prints the warning below its output:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"$HOME/.claude/branch-guard/statusline.cjs\" \"/path/to/the/other/statusline.cjs\""
  }
}
```

## How it works

- On resume, the `SessionStart` hook reads the transcript of the session (`transcript_path`) and takes the `gitBranch` of the last user or assistant entry. It compares that with the branch checked out in the session's folder.
- It saves the branch in `~/.claude/branch-guard/state/<session_id>.json`. Once you send a message, the transcript is stamped with the current branch, so the original one is only kept in this file. Nothing deletes these small files. They are safe to remove.
- The status line compares the saved branch with the branch of the folder the session started in, not the current working directory, so `/add-dir` does not cause false warnings.

## Known limits

- Not tested through a real plugin install yet. In particular, `${CLAUDE_PLUGIN_ROOT}` is assumed to expand in the command text, as the plugin docs say it does for commands.
- The status line shows the warning only for a session that has a saved branch, which a resume or the status line's first run creates.
- If you installed the earlier user-level version of these scripts (hooks in `~/.claude/hooks/` registered in `~/.claude/settings.json`), remove its `SessionStart` hook and `statusLine` entry, or both versions run.
