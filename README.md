# sabba-claude-helpers

A Claude Code plugin marketplace. Each plugin lives in its own folder under `plugins/` and is listed in `.claude-plugin/marketplace.json`.

| Plugin | What it does |
|---|---|
| [title-prefix](plugins/title-prefix/README.md) | Prefixes the session title with `[repo:branch]` when you `/rename !name`. |
| [branch-guard](plugins/branch-guard/README.md) | Warns when a session is resumed on a different git branch than it last ran on. |

## Install

```
/plugin marketplace add sabbadino/sabba-claude-helpers
/plugin install title-prefix@title-prefix-marketplace
/plugin install branch-guard@title-prefix-marketplace
```

## Add a plugin

1. Create `plugins/<name>/.claude-plugin/plugin.json` with its name, version and description, plus its own `hooks/`, `commands/` and so on.
2. Reference scripts from `hooks/hooks.json` through `${CLAUDE_PLUGIN_ROOT}`, never through a path outside the plugin folder.
3. Add an entry to `.claude-plugin/marketplace.json` with `"source": "./plugins/<name>"`.
4. Run `claude plugin validate .` from the repo root.
