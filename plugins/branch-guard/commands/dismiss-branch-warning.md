---
description: Hide the red branch mismatch warning in the status line for this session
allowed-tools: Bash(node:*)
---

Run exactly this command with the Bash tool and nothing else:

```
node "${CLAUDE_PLUGIN_ROOT}/hooks/dismiss-branch-warning.cjs"
```

Then reply with its one-line output and stop. Do not read files or investigate.
