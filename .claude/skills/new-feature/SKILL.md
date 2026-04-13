---
name: new-feature
description: Scaffold a new feature following project patterns (service, hook, screen, i18n)
allowed-tools: Read Write Edit Glob Grep Bash
argument-hint: "[feature name] [description]"
---

# Scaffold New Feature

Create the boilerplate files for a new feature following existing codebase patterns.

## Context

Existing patterns to follow:

```!
ls services/ hooks/ app/\(main\)/
```

## Steps

### 1. Determine scope

From `$ARGUMENTS`, identify:
- Feature name (e.g., "achievements", "chat")
- What data it needs from Supabase
- Whether it needs a new screen, or extends an existing one

### 2. Create service file

**File**: `services/{featureName}.ts`

Follow the pattern from existing services:

```typescript
import { supabase } from '@/lib/supabase';

export async function fetchFeatureData(userId: string) {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}
```

- Pure async functions, no React
- Throw on error
- Use types from `types/database.ts`

### 3. Create hook file

**File**: `hooks/use{FeatureName}.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFeatureData } from '@/services/{featureName}';

export function useFeatureData(userId: string | undefined) {
  return useQuery({
    queryKey: ['{feature-name}', userId],
    queryFn: () => fetchFeatureData(userId!),
    enabled: Boolean(userId),
  });
}
```

- Wrap every service function
- Use descriptive query keys
- Add `enabled` guards for optional params
- Mutations must invalidate related query keys

### 4. Create screen file

**File**: `app/(main)/{feature-name}.tsx`

```typescript
import { View, Text } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { useTranslation } from 'react-i18next';

export default function FeatureScreen() {
  const { session } = useAuth();
  const { t } = useTranslation();
  const { data, isLoading } = useFeatureData(session?.user?.id);

  if (isLoading) return <FullScreenLoader />;

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <Text className="text-foreground text-lg font-inter-bold">
        {t('{feature}.title')}
      </Text>
    </View>
  );
}
```

- NativeWind classes only
- useTranslation for all strings
- FullScreenLoader while loading
- useAuth for session/profile

### 5. Add i18n keys

Add keys to both `i18n/en.ts` and `i18n/es.ts`:

```typescript
// en.ts
{featureName}: {
  title: 'Feature Title',
  // ...
},

// es.ts — Uruguayan Spanish (vos/tenés/podés)
{featureName}: {
  title: 'Título',
  // ...
},
```

### 6. Styling notes

- Use `colors.*` from `constants/theme.ts` — never hardcoded hex values.
- For images: use `import { Image } from 'expo-image'` with `style` prop (not `className`) and `contentFit` (not `resizeMode`).

### 7. Report

List all created files and next steps (e.g., "add route to navigation", "create migration for new table").
