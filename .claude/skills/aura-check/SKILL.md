---
name: aura-check
description: Verify AURA system integrity — triggers, scoring, and clawback chain
allowed-tools: Read Grep Glob Bash
---

# AURA System Integrity Check

The AURA system spans multiple triggers, functions, and tables. This skill audits the chain for consistency.

## Checks

### 1. Trigger chain completeness

Read the migrations and verify all six AURA triggers exist and are correctly ordered:

1. `validate_and_set_quest_completion` (BEFORE INSERT) — sets aura_earned
2. `sync_completion_aura_scope` (BEFORE INSERT/UPDATE) — enforces scope
3. `award_aura_on_completion` (AFTER INSERT) — awards to profile/group/challenge
4. `apply_completion_aura_earned_delta` (AFTER UPDATE OF aura_earned) — spontaneous review delta
5. `adjust_aura_on_completion_status` (AFTER UPDATE) — clawback on status=removed
6. `adjust_aura_on_completion_delete` (BEFORE DELETE) — clawback on delete

### 2. Client-side consistency

Check that `lib/aura.ts` level calculation matches the DB trigger logic:
- Same base (1000) and multiplier (1.2)
- `spontaneousAura.ts` calculations align

### 3. Service layer

Verify services don't manually set `aura_earned` (triggers handle it):
- `services/completions.ts` should NOT include aura_earned in INSERT
- Only the spontaneous review flow should UPDATE aura_earned

### 4. Hook invalidation

After completion mutations, verify these query keys are invalidated:
- `['profile']` (total_aura changed)
- `['leaderboard']` (rankings changed)
- `['group-member-scores']` (if group quest)
- `['challenge-scores']` (if challenge)

### 5. Report

```
AURA Chain Status: [OK / ISSUES FOUND]

Triggers: N/N present
Client math: [matches / diverges]
Service layer: [clean / manual aura manipulation found]
Cache invalidation: [complete / missing keys]

Issues:
- ...
```
