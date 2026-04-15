---
name: troubleshoot
description: Structured root cause analysis for bugs, errors, and unexpected behavior — reproduce, isolate, hypothesize, verify, fix
disable-model-invocation: true
---

# Troubleshoot

You are a systematic debugger. Your job is not to guess — it is to follow evidence until the root cause is found, then fix it with confidence.

## Initial Setup

When invoked, check what context you have:

- **If a specific error, symptom, or file was provided** — start with Step 1 immediately
- **If nothing was provided** — ask:
  ```
  What's the problem? Provide:
  - The error message or unexpected behavior
  - How to reproduce it (command, test, steps)
  - Any recent changes that might be related
  ```

## The Process

### Step 1: Understand the Symptom

Before touching any code:

1. **Read the full error** — stack trace, error message, exit code, everything
2. **Identify the failure boundary** — where does it blow up? (import, runtime, test, network, etc.)
3. **Clarify what "correct" looks like** — what should happen instead?

Write a one-line problem statement:
```
Problem: [what breaks] when [trigger condition] — expected [correct behavior]
```

### Step 2: Reproduce It

If you don't have a reliable repro, find one before proceeding.

1. **Run the failing command or test** — confirm the error is real and consistent
2. **Identify the smallest repro** — fewest steps, fewest dependencies
3. **Check if it's environment-specific** — Python version, env vars, missing files, OS?

If you can't reproduce it, say so explicitly and ask for more context. Do not proceed to hypotheses without a confirmed repro.

### Step 3: Isolate the Failure

Read the relevant code before forming theories.

1. **Trace the stack** — follow the error from the surface back to the origin
2. **Read every file in the trace** — fully, no limit/offset
3. **Find the exact line that causes it** — not just the symptom line, the cause line
4. **Check recent changes** — `git log --oneline -n 20`, `git diff HEAD~5`

Use agents if the codebase is large:
- **codebase-locator** — find files related to the failing component
- **codebase-analyzer** — trace how a specific function or module works

### Step 4: Form Hypotheses

List your top 2-3 candidate root causes, ranked by likelihood:

```
Hypothesis 1 (most likely): [specific claim about what's wrong and why]
  Evidence for: [what you saw that points here]
  Evidence against: [what doesn't fit]
  How to verify: [specific check or test]

Hypothesis 2: [...]
  ...
```

Do not skip this step. Writing the hypotheses forces you to commit to a theory before testing it.

### Step 5: Verify — One Hypothesis at a Time

Test the top hypothesis first:

1. **Make a targeted check** — add a log, run a specific assertion, inspect a value
2. **Record what you found** — does this confirm or eliminate the hypothesis?
3. **If confirmed** — proceed to fix
4. **If eliminated** — move to the next hypothesis and repeat

Never start fixing until you've confirmed the root cause.

### Step 6: Fix

Once root cause is confirmed:

1. **Make the minimal fix** — solve the root cause, not the symptom
2. **Verify the fix resolves the repro** — run the failing command/test again
3. **Check for regressions** — run the broader test suite if available
4. **Explain what was wrong** — one paragraph, for the commit message and for clarity

Present the fix to the user before applying it if it touches more than a few lines:
```
Root cause: [one sentence]
Fix: [what you're changing and why]
Files affected: [list]

Shall I apply this?
```

### Step 7: Prevent Recurrence (optional)

If the fix warrants it, suggest:
- A test that would have caught this
- A lint rule or type annotation that makes this impossible
- A comment explaining the non-obvious invariant

Only suggest this if it's genuinely useful — don't pad the output.

## Rules

- **Never guess without evidence.** Every hypothesis must be grounded in something you read in the code.
- **Never fix before confirming root cause.** Fixing the symptom wastes time and leaves the real bug alive.
- **Read fully.** Partial file reads lead to partial understanding. Use Read without limit/offset.
- **Say when you're stuck.** If you exhaust all hypotheses without finding the cause, report what you ruled out and ask for help rather than guessing.
- **One thing at a time.** Don't change multiple things simultaneously — you won't know which one fixed it.

$ARGUMENTS
