---
name: test
description: Scaffold test files next to source files following project patterns
allowed-tools: Read Write Glob Grep
argument-hint: "[file path or feature name]"
---

# Scaffold Tests

Create test files for the specified source file or feature.

## Context

```!
ls package.json
```

Check if a test runner is configured. If not, note that `jest` or `vitest` setup may be needed.

## Steps

### 1. Identify target

From `$ARGUMENTS`, find the source file(s) to test. If a feature name is given, find all related files (service, hook, util).

### 2. Create test files

Place test files next to source files with `.test.ts` or `.test.tsx` suffix:

- `services/quests.ts` → `services/quests.test.ts`
- `hooks/useQuests.ts` → `hooks/useQuests.test.ts`
- `lib/aura.ts` → `lib/aura.test.ts`
- `components/ui/Button.tsx` → `components/ui/Button.test.tsx`

### 3. Test structure

**Service tests** — mock Supabase, test query construction and error handling:

```typescript
import { fetchQuests } from './quests';

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  },
}));

describe('fetchQuests', () => {
  it('returns quests when successful', async () => { ... });
  it('throws on supabase error', async () => { ... });
  it('applies category filter when provided', async () => { ... });
});
```

**Utility/lib tests** — pure function testing, no mocks needed:

```typescript
import { auraLevelFromTotal, auraToNextLevel } from './aura';

describe('auraLevelFromTotal', () => {
  it('returns level 1 for 0 aura', () => {
    expect(auraLevelFromTotal(0)).toBe(1);
  });
  it('returns level 2 for 1000 aura', () => {
    expect(auraLevelFromTotal(1000)).toBe(2);
  });
});
```

**Hook tests** — use `@testing-library/react-hooks` or `renderHook`:

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useQuests } from './useQuests';

// Wrap with QueryProvider
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useQuests', () => {
  it('fetches quests', async () => {
    const { result } = renderHook(() => useQuests(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

### 4. Prioritize

- **Pure functions first** (`lib/`, `utils/`): easiest to test, highest value
- **Services second**: mock Supabase client
- **Hooks third**: need QueryProvider wrapper
- **Components last**: need full rendering setup

### 5. Report

List created test files and note any missing test infrastructure.
