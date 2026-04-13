---
name: ship
description: Ship current changes — create branch, commit logically, push, and open a PR. Use when ready to push and create a pull request.
allowed-tools: Bash Read Glob Grep
argument-hint: "[commit message] [--pr]"
---

# Ship Changes

You are shipping the current workspace changes in the Rupta social quest app. This is a single git repository.

- **Remote**: `origin` (GitHub)
- **Main branch**: `main`

## Commit Rules

- **Conventional commits**, one-liner, no scope parentheses
- Examples: `feat: add quest filtering by category`, `fix: correct aura clawback on delete`, `refactor: extract shared completion helpers`
- **Never add a `Co-Authored-By` trailer**
- **Never use `--no-verify`** — if pre-commit hooks fail, fix the issue
- **Never amend commits** — always create new ones

## PR Rules

- **Title**: short (under 70 chars), same style as commit message
- **Body**: only a `## Summary` section with short bullet points
- **No** test plan checklists, no emoji, no verbose sections

## Process

### Step 1: Assess Changes

```bash
git status --short
git diff --stat
git diff --cached --stat
```

If no changes, stop and report "Nothing to ship."

### Step 2: Analyze and Group Changes

1. **Read the full diff** (`git diff` for unstaged, `git diff --cached` for staged)
2. **Read recent commit history** (`git log --oneline -10`) to match the commit style
3. **Group changes logically** — determine if this is one commit or multiple:
   - One conceptual change = one commit
   - Multiple unrelated changes = multiple commits (e.g., a bug fix + a new feature = 2 commits)
   - Migrations or config changes that are prerequisites = separate commit before the feature commit
4. **Draft commit messages** — conventional, one-liner, no scope, no co-author

### Step 3: Determine Branch

```bash
git branch --show-current
```

- If on `main`, create a feature branch: `feat/short-description`, `fix/short-description`, `refactor/short-description`
- If already on a feature branch, use it
- Ask the user to confirm the branch name if it's ambiguous

### Step 4: Create Branch, Commit, Push

1. **Create the branch** if needed: `git checkout -b <branch-name>`
2. **Stage and commit** each logical group:
   - Stage specific files (not `git add .` or `git add -A`)
   - Never stage `.env`, `.env.*`, credentials, or files in `.gitignore`
   - Commit with a HEREDOC:
     ```bash
     git commit -m "$(cat <<'EOF'
     feat: add quest filtering by category
     EOF
     )"
     ```
3. **Push** to remote: `git push -u origin HEAD`

### Step 5: Create PR (if `--pr` flag, user asks, or branch has no PR yet)

Check if a PR already exists:
```bash
gh pr list --head $(git branch --show-current) --json number,url
```

If no PR exists, create one:
```bash
gh pr create --title "feat: short description" --body "$(cat <<'EOF'
## Summary
- Brief bullet point describing the change
- Another point if needed
EOF
)"
```

If a PR already exists, skip creation and report the existing PR URL.

### Step 6: Report

```
Done.

- **Branch**: <branch-name>
- **Commits**: <list of commit hashes + messages>
- **PR**: <PR URL>
```

## Edge Cases

- **If only staged changes exist**, commit those only
- **If there are untracked files**, check if they should be committed (new source files yes, temp files no)
- **If pre-commit hooks fail**, fix the issue and create a new commit (never `--no-verify`)
- **If the branch already exists on remote**, ask the user before force-pushing
- **If there are uncommitted changes you're unsure about**, ask the user what to include

$ARGUMENTS
