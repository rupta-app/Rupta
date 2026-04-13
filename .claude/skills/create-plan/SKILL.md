---
name: create-plan
description: Create detailed implementation plans through interactive research. Use when planning a new feature, refactor, or complex change before coding.
disable-model-invocation: true
model: opus
---

# Implementation Plan

You are creating a detailed implementation plan for the Rupta social quest app. This is an Expo/React Native mobile app with a Supabase backend:

- `app/` — Expo Router screens (file-based routing, 48+ screens)
- `services/` — Pure async functions (Supabase queries, no React)
- `hooks/` — TanStack Query v5 wrappers around services
- `components/` — Reusable UI (NativeWind styling)
- `lib/` — Utilities (aura math, storage, quest rules)
- `providers/` — React context (auth only)
- `supabase/migrations/` — Ordered SQL migrations with RLS policies and triggers

**Before planning, load context:**
- Read `CLAUDE.md` for project conventions, architecture, naming, and the full database schema
- Read relevant files in `services/`, `hooks/`, `components/` for the domain being planned
- Read `supabase/migrations/` if the plan involves DB changes
- Read `i18n/en.ts` and `i18n/es.ts` if new user-facing strings are needed
- Read `hooks/queryKeys.ts` for the centralized query key factory

## Initial Response

When invoked:

1. **If arguments were provided** (`$ARGUMENTS`), treat them as the task description. Read any referenced files fully. Begin research immediately.

2. **If no arguments**, respond with:

```
I'll help you create a detailed implementation plan. Let me start by understanding what we're building.

Please provide:
1. The task or feature description
2. Any relevant context, constraints, or specific requirements
3. Which layers this touches (DB, services, hooks, UI, or all)

I'll research the codebase and work with you to create a comprehensive plan.
```

Then wait for input.

## Process

### Step 1: Context Gathering

1. **Read all mentioned files fully** — never partial reads
2. **Research the codebase** — use Explore agents to find:
   - Existing code in the affected domain (services, hooks, screens, components)
   - Patterns to follow from similar features
   - Integration points and dependencies
   - Existing Supabase tables, views, triggers, and RLS policies relevant to the feature
3. **If the task involves a DB change**, check the full chain:
   - Migration SQL (table, RLS, triggers, views)
   - Service functions that query the table
   - Hooks that wrap those services
   - Screens/components that consume the hooks
4. **If the task involves new UI**, check:
   - Existing shared components in `components/ui/`, `components/navigation/`, `components/social/`
   - Similar screens for layout patterns
   - i18n keys needed (both `en.ts` and `es.ts`)
5. **Present findings with file:line references and ask focused questions** — only ask what code research can't answer

### Step 2: Research & Design Options

1. **Spawn parallel agents** to research different aspects concurrently
2. **Identify design options** with pros/cons for non-obvious decisions
3. **Present findings**:
   ```
   Based on my research:

   **Current State:**
   - [Discovery with file:line reference]
   - [Pattern to follow]

   **Design Options:**
   1. [Option A] — [pros/cons]
   2. [Option B] — [pros/cons]

   **Open Questions:**
   - [Question requiring human judgment]
   ```
4. **Get alignment** before proceeding to detailed plan

### Step 3: Plan Structure

Propose the phased structure and get buy-in before writing details:

```
## Proposed Phases:
1. [Phase name] — [what it accomplishes]
2. [Phase name] — [what it accomplishes]

Does this phasing make sense?
```

### Step 4: Write the Plan

Write the plan directly in the conversation (not to a file). Use this structure:

```markdown
# [Feature Name] Implementation Plan

## Overview
[1-2 sentences: what and why]

## Current State
[What exists, what's missing, key constraints. Include file:line references.]

## What We're NOT Doing
[Explicitly out-of-scope items]

## Phase 1: [Name]

### Changes Required

#### [Component/Layer]
**File**: `path/to/file`
**Changes**: [Summary]

[Code snippets where helpful]

### Verification
- [ ] [Specific check — command to run or behavior to verify]

## Phase 2: [Name]
[Same structure...]

## Testing Strategy
[What to test, key edge cases]

## Notes
[Migration concerns, performance, dependencies]
```

### Step 5: Iterate

Present the plan and refine based on feedback. Continue until the user is satisfied.

## Clean Code Principles

Every plan must follow these principles. When proposing where new code goes, be deliberate:

1. **DRY (Don't Repeat Yourself)** — before adding a new function, search for existing ones that do the same or similar thing. If logic already exists in a service, hook, or utility, reuse it. Check `services/_profiles.ts`, `services/_pagination.ts`, `services/_media.ts`, `utils/`, `lib/` for shared helpers.

2. **Place functions where they can be reused**:
   - Supabase queries go in `services/`, not inline in hooks or screens
   - Shared business logic goes in `lib/` or the relevant domain service
   - Shared UI logic goes in `hooks/` or `components/ui/`
   - Query keys go in `hooks/queryKeys.ts`, never hardcoded strings
   - Profile enrichment uses `enrichWithProfiles()` from `services/_profiles.ts`
   - Pagination uses `paginateQuery()` from `services/_pagination.ts`

3. **Follow the existing architecture** — the layered structure exists for a reason:
   - Services are pure async (no React, no hooks, no state). Throw on error.
   - Hooks wrap services with TanStack Query. Use `qk.*` keys from `hooks/queryKeys.ts`.
   - Screens extract params, call hooks, render UI.
   - Components use NativeWind, never StyleSheet.create.
   - New DB tables must have RLS policies. Check existing triggers before duplicating logic.

4. **Single responsibility** — each function/component does one thing. If a plan requires a function that does too much, split it during planning.

5. **Name things by what they do, not where they're used** — a function called `fetchQuestStats` is reusable; a function called `getDataForProfilePage` is not.

## Rupta-Specific Conventions

- **i18n**: All user-facing strings use `t('key')`. Spanish translations use Uruguayan voseo (vos/tenes/podes).
- **Styling**: NativeWind only, `colors.*` from `constants/theme.ts`, no hardcoded hex. `expo-image` uses `style` not `className`.
- **Auth**: OAuth only (Google + Apple). `useAuth()` for session/profile. `session?.user?.id` for uid.
- **DB types**: From `types/database.ts` (generated). Never manual type definitions for DB rows.
- **Mutations**: Use `invalidateCompletionRelated()` from `hooks/queryKeys.ts` for completion-related mutations.
- **Dual AURA**: Official AURA (profile-level) vs Group AURA (group-local). Never mix scopes.
- **Triggers**: Many aura/notification triggers exist in the DB. Check before duplicating logic in code.

## Guidelines

1. **Be skeptical** — question vague requirements, identify edge cases early
2. **Be interactive** — don't write the full plan in one shot; get buy-in at each step
3. **Be thorough** — include file paths, line numbers, specific code patterns
4. **Be practical** — incremental testable changes, consider the full service -> hook -> UI chain
5. **Follow the conventions** — layered architecture, conventional commits, no scope, always check both DB and code sides
6. **No unresolved questions in the final plan** — research or ask before finalizing
7. **Respect existing patterns** — find how similar features are implemented and match that style
8. **Reuse before creating** — during research, actively search for existing functions that overlap with what the plan needs. Call them out: "This already exists at `file:line`, reuse it" or "Nothing exists for this, create it at `path`"

$ARGUMENTS
