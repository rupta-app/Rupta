---
name: review
description: Review current changes for clean code, DRY violations, dead code, and unnecessary comments. Use after implementing a feature and before shipping.
disable-model-invocation: true
model: opus
allowed-tools: Read Glob Grep Bash Agent
---

# Code Review

You are reviewing the current workspace changes in the Rupta social quest app for clean code quality. This is a thorough review focused on DRY, reusability, dead code, and unnecessary comments — not a convention or linting check.

**Before reviewing, load the project conventions:**
- Read `CLAUDE.md` for architecture, naming, DB schema, and styling rules
- Read `hooks/queryKeys.ts` for the centralized query key factory
- Read relevant files in `services/`, `hooks/`, `components/` for the domain being changed

## Step 1: Understand the Feature Scope

Check for changes:

```bash
git status --short && git diff --stat && git diff --cached --stat
```

Then read the full diffs (unstaged + staged):

```bash
git diff && git diff --cached
```

Understand what the feature does before reviewing. Identify which files are new vs modified.

**Scope rule**: The review covers ONLY the files that appear in the diff (new + modified). You may search the rest of the codebase to detect duplication or missing reuse, but every fix you propose or apply must target a file that is part of the feature's changeset. Never modify files outside the diff. If you spot cross-codebase duplication, note it as an **Observation** but do not apply the extraction yourself.

## Step 2: Read Every Changed File in Full

For each file that appears in the diff, **read the entire file** — not just the changed lines. You need full context to spot:
- Duplicated logic elsewhere in the same file
- Functions that already exist in the codebase
- Dead code left behind after refactoring
- Comments that describe the obvious

## Step 3: Search for Duplication and Reuse Opportunities

This is the most important step. For every new function, hook, component, or query introduced:

1. **Search the codebase** for existing functions that do the same or similar thing:
   - Check `services/_profiles.ts` for profile enrichment helpers (`enrichWithProfiles`, `fetchProfilesByIds`, `aggregateByUser`)
   - Check `services/_pagination.ts` for `paginateQuery`
   - Check `services/_media.ts` for `groupMediaByCompletion`
   - Check `hooks/queryKeys.ts` for existing query keys — never hardcode key strings
   - Check `utils/` for `appLang`, `isSameUser`, `formatAuraDisplay`, `questTitle`, `formatTime`
   - Check `components/ui/` for existing primitives (Button, Card, Avatar, Badge, PillToggle, EmptyState, ScreenHeader, PressableScale)
   - Check `components/social/` for UserListItem, GroupCard, FriendRequestActions, RecentCompletionsList
   - Check `components/leaderboard/LeaderboardRow.tsx`
   - Check `components/completion/CompletionForm.tsx` for shared completion form logic

2. **Check placement** — is the new code where it can be reused?
   - Supabase queries must be in `services/`, not inline in hooks or screens
   - Shared business logic must be in `lib/` or the relevant domain service
   - Shared UI logic must be in `hooks/`, `utils/`, or shared components
   - Query keys must use `qk.*` from `hooks/queryKeys.ts`
   - A function named after a specific screen is a reusability anti-pattern

3. **Check for near-duplicates within the changed files** — two or more functions/blocks in the diff that do almost the same thing with minor variations should be unified. If the duplication is between a changed file and an untouched file, report it as an Observation.

## Step 4: Identify Dead Code and Unnecessary Comments

Look for:

### Dead code
- Unused imports
- Unused variables or function parameters
- Commented-out code blocks (use git history, not comments)
- Functions defined but never called
- Unreachable code after early returns
- Leftover debugging code (`console.log`, `console.warn`)

### Unnecessary comments
- Comments that restate the code
- Comments describing what a function does when the name already says it
- TODO/FIXME comments for things that should be done now
- Commented-out alternative implementations
- Section separator comments that add no information

### NOT unnecessary (keep these)
- Comments explaining **why** a non-obvious decision was made
- Comments noting a known limitation or workaround
- Type-ignore comments with a reason

## Step 5: Check Clean Code Principles

### DRY (Don't Repeat Yourself)
- Any logic block that appears 2+ times with only parameter differences should be a single function
- Any Supabase query pattern that duplicates an existing service function
- Any component that is a copy-paste of another with minor changes
- Profile enrichment should use `enrichWithProfiles()` not manual ID extraction + query + Map building

### Architecture Compliance
- **Services**: Pure async functions. No React, no hooks, no state. Throw on error.
- **Hooks**: Wrap services with TanStack Query. Use `qk.*` keys. Invalidate related queries on mutation success. Use `invalidateCompletionRelated()` for completion mutations.
- **Components**: Functional only. NativeWind styling (no StyleSheet.create). Props destructured in signature.
- **Screens**: Extract params with `useLocalSearchParams`, use hooks for data, show loading state.

### Type Safety
- No `any` types. Use `unknown` if truly unknown.
- Supabase types from `types/database.ts` — never manual type definitions for DB rows.
- Zod schemas for user input validation at boundaries.

### i18n
- No hardcoded user-facing strings — use `t('key')`.
- New keys added to both `i18n/en.ts` and `i18n/es.ts`.
- Spanish translations use Uruguayan voseo (vos/tenes/podes), never Spain Spanish.

### Styling
- No hardcoded hex colors — must use `colors.*` from `constants/theme.ts`.
- `expo-image` `<Image>` must use `style` prop, never `className`.
- No `resizeMode` on expo-image — use `contentFit`.
- No `react-native` Image — use `expo-image`.

### Security
- No secrets or API keys in code.
- New tables must have RLS policies.
- User input validated before DB operations.

### Layer Violations
- Screens calling Supabase directly (must go through services -> hooks)
- Services importing React or hooks
- Hooks with inline Supabase queries (must call services)

## Step 6: Report

Present findings grouped by severity:

```
## Review: [feature summary]

### Must Fix
[Issues that violate architecture rules, introduce duplication, or leave dead code]

1. **[Category]** — `file:line`
   **Problem**: [what's wrong]
   **Fix**: [specific action — refactor into X, move to Y, delete Z]

### Should Fix
[Reusability improvements, naming issues, comment cleanup]

### Observations
[Non-blocking suggestions for follow-up work outside the current diff]
```

For each "Must Fix" and "Should Fix" item, provide the concrete fix — don't just describe the problem. Show the code change or point to the existing function that should be reused.

**After presenting the report, ask the user if they want you to apply the fixes.** If yes, apply fixes **only to files in the feature diff** in a single pass, then type-check:

```bash
npx tsc --noEmit
```

$ARGUMENTS
