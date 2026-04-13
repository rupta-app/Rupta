---
name: cleanup
description: Find dead code, unused imports, and stale files across the codebase
allowed-tools: Read Grep Glob Bash
---

# Codebase Cleanup Audit

Find dead code, unused exports, stale files, and other cleanup opportunities.

## Checks

### 1. Unused exports

For each file in `services/`, `hooks/`, `lib/`, `utils/`, `components/ui/`:
- Find all exported functions/components
- Search the codebase for imports of each export
- Report exports that are never imported anywhere

### 2. Unused imports

Search for import statements where the imported name is not referenced in the file body. Focus on `app/`, `components/`, `services/`, `hooks/`.

### 3. Stale files

Look for files that might be abandoned:
- Components not referenced in any screen or other component
- Services with no corresponding hook
- Hooks with no consumer

### 4. Duplicate patterns

Search for repeated code patterns:
- Similar Supabase queries across services
- Duplicated UI layouts across screens
- Copy-pasted error handling blocks

### 5. Console statements

Find `console.log`, `console.warn`, `console.error` statements that should be removed before shipping.

### 6. Styling violations

- Hardcoded hex colors that should use `colors.*` from `constants/theme.ts`
- `className` used on expo-image `<Image>` (silently ignored — must use `style`)
- `resizeMode` on expo-image (should be `contentFit`)
- `import { Image } from 'react-native'` (should be `expo-image`)

## Output

```
## Unused Exports
- file.ts: exportName (0 references)

## Unused Imports
- file.ts:line — import { unused } from '...'

## Stale Files
- path/file.ts — no references found

## Duplicate Patterns
- pattern description: file1.ts:line, file2.ts:line

## Console Statements
- file.ts:line — console.log(...)
```
