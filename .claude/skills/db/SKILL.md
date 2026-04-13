---
name: db
description: Create Supabase migrations with RLS, update TypeScript types
allowed-tools: Read Write Bash Glob Grep Agent
argument-hint: "[description of schema change]"
---

# Supabase Database Migration

Create a new migration based on the requested schema change.

## Context

Current migration files:

```!
ls -1 supabase/migrations/
```

## Steps

### 1. Understand current schema

Read the relevant existing migrations to understand the current state. Pay special attention to:
- Existing triggers on affected tables (see CLAUDE.md for the full trigger list)
- RLS policies already in place
- The AURA system triggers — do not break the award/clawback chain

### 2. Create migration file

**Naming**: `YYYYMMDDHHMMSS_description.sql`
- Use the current date/time for the timestamp
- Use snake_case for the description
- Place in `supabase/migrations/`

### 3. Write SQL

Follow these conventions from existing migrations:

```sql
-- Enable RLS on new tables
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Always create RLS policies for new tables
CREATE POLICY "description" ON new_table
  FOR SELECT TO authenticated
  USING (condition);

-- Use SECURITY DEFINER for helper functions that RLS policies call
CREATE OR REPLACE FUNCTION helper_fn(...)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ ... $$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION helper_fn TO authenticated, service_role;
```

**Rules:**
- Every new table MUST have RLS enabled and at least SELECT/INSERT policies
- Use `auth.uid()` for user identity checks
- Use `is_group_member()` for read policies, `is_group_admin()` for write/delete policies on group resources
- Add proper indexes for columns used in WHERE clauses and JOINs
- Use appropriate constraints (NOT NULL, UNIQUE, CHECK, REFERENCES)
- Include `created_at TIMESTAMPTZ DEFAULT now()` on all new tables

### 4. Regenerate TypeScript types

After verifying the migration looks correct:

```bash
npx supabase db reset
npx supabase gen types typescript --local > types/database.ts
```

### 5. Report

List what was created: tables, columns, policies, triggers, functions, indexes.

Warn about any triggers that might interact with the AURA system.
