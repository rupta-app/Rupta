---
name: notion-card
description: Pick up a Notion card — read it, move to In Progress, and fix/plan/troubleshoot based on complexity
argument-hint: "<notion-url>"
---

# Notion Card

You receive a Notion card link. Your job is to read the card, move it to In Progress, understand the task, choose the right approach based on complexity, execute the work, and wait for the user to confirm before moving to Done.

## Step 1: Read the Card

1. Extract the page ID from the URL (the 32-char hex at the end of the path, insert dashes to form a UUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
2. Call `mcp__notion-personal__API-retrieve-a-page` to get the card properties (title, status, tags)
3. Call `mcp__notion-personal__API-get-block-children` to get the card body/description

## Step 2: Move to In Progress

Call `mcp__notion-personal__API-patch-page` to set:
```json
{ "Status": { "select": { "name": "In Progress" } } }
```

## Step 3: Classify the Task

Read the card title and body carefully. Classify it into one of these categories:

### Category A: Simple Change
**Signals**: text changes, i18n fixes, copy updates, style tweaks, config changes, renaming, small refactors, adding a missing prop, fixing a typo, swapping an icon.

**Action**: Proceed to fix it directly. Read the relevant files, make the changes, verify with `tsc --noEmit`. Report what you changed.

### Category B: New Feature or Significant Addition
**Signals**: "add [feature]", "implement [flow]", "create [screen/component]", new DB tables needed, multiple layers affected (DB + service + hook + screen), new routes, new API integrations.

**Action**: Invoke the `/create-plan` skill with the card title and body as context. The plan skill will research the codebase, propose phases, and get alignment before implementation.

Tell the user:
```
This card requires a new feature. Starting with a plan before implementation.
```

Then invoke: `/create-plan [card title]: [card body]`

### Category C: Bug or Unexpected Behavior
**Signals**: "fix [bug]", "broken", "not working", "crash", "error", "regression", "[thing] shows wrong [value]", "should [X] but [Y]", stack traces, error messages in the card.

**Action**: Invoke the `/troubleshoot` skill with the card title and body as context.

Tell the user:
```
This looks like a bug. Starting structured troubleshooting.
```

Then invoke: `/troubleshoot [card title]: [card body]`

### Category D: Research or Investigation
**Signals**: "investigate", "figure out why", "explore options for", "compare approaches", "audit", "review".

**Action**: Enter plan mode to research and present findings. Don't write code until the investigation is complete and the user decides on a direction.

## Step 4: Execute

Follow through with the chosen approach. When the work is complete, summarize what was done.

## Step 5: Wait for Confirmation

After completing the work, tell the user:
```
Done. Test it and let me know — I'll move the card to Done when you confirm.
```

**Do NOT move the card to Done automatically.** Wait for the user to explicitly confirm. When they do, call:
```json
{ "Status": { "select": { "name": "Done" } } }
```

## Edge Cases

- **If the card has no body** — use just the title. If the title is also vague, ask the user for clarification before proceeding.
- **If the card is already In Progress** — skip the status change, proceed with the work.
- **If you're unsure about classification** — default to Category A (simple) for small-sounding tasks, or ask the user: "This could go a few ways — want me to plan it first or just dive in?"

$ARGUMENTS
