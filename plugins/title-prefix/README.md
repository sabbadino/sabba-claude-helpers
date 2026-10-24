# title-prefix

Claude Code plugin: prefixes the session title with `[repo:branch]`.

## Use
`/rename !my task` → after your next prompt the title becomes `[my-repo:main] my task`.
Titles that don't start with `!` are never touched. Re-run `/rename !…` to refresh the branch.

Why the next prompt: `/rename` is local and fires no hook; the `UserPromptSubmit` hook applies it.

## Install (user scope)
```
/plugin install title-prefix --marketplace sabbadino/REPO
```
or from a shell: `claude plugin install title-prefix --marketplace sabbadino/claude-title-repo-branch-prefix`

Requires Node and git on PATH.
