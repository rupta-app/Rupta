---
name: i18n-check
description: Find hardcoded strings and missing translation keys between en and es locales
allowed-tools: Read Grep Glob Bash
---

# i18n Audit

Scan for hardcoded strings and translation key mismatches.

## Step 1: Find hardcoded strings in components and screens

Search for user-facing text that should be translation keys. Look in `app/` and `components/` for:

- String literals in JSX text content (between `>` and `</`)
- String props like `title=`, `placeholder=`, `label=` with hardcoded values
- `Alert.alert()` calls with hardcoded strings
- Toast/error messages with hardcoded strings

**Exclude**: className strings, import paths, query keys, icon names, test IDs, style values, route paths.

**Report** each hardcoded string with file path and line number, and suggest a key name.

## Step 2: Compare en and es translation keys

Read both `i18n/en.ts` and `i18n/es.ts`. Extract all nested key paths and compare:

- Keys in `en` but missing from `es` → **must add Spanish translation**
- Keys in `es` but missing from `en` → **orphaned key, likely stale**

Report mismatches with the full key path (e.g., `quests.filterAll`).

## Step 3: Check Spanish for Spain Spanish

Search `i18n/es.ts` for Spain Spanish verb forms that should be Uruguayan:
- `tienes` → `tenés`
- `puedes` → `podés`
- `quieres` → `querés`
- `vienes` → `venís`
- `dices` → `decís`
- `haces` → `hacés`
- `sabes` → `sabés`
- `eres` → `sos`
- Any `tú` → should be `vos`

Report each occurrence with the correct Uruguayan form.

## Output

```
## Hardcoded Strings
- file:line — "string" → suggested key: namespace.keyName

## Missing Translation Keys
- en only: key.path (needs es translation)
- es only: key.path (orphaned?)

## Spain Spanish Found
- es.ts:line — "tienes" → should be "tenés"
```
