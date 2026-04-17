# Rupta — Social Quest App

## Language Rules

- **Code, comments, docs, commit messages, variable names**: always English.
- **App-facing content** (translations, quest text, UI copy): targets **Uruguayan Spanish** (`es` locale) as the primary locale. Use **vos/tenés/podés** verb forms, never Spain Spanish (tú/tienes/puedes).
- The `en` locale exists for English speakers but `es` is the default user-facing language.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54, React Native 0.81, React 19 |
| Routing | Expo Router 6 (file-based, typed routes) |
| Styling | NativeWind 4 (Tailwind CSS for RN) |
| Backend | Supabase (Postgres, Auth, Storage, RLS) |
| Server state | TanStack Query v5 (30s staleTime, 1 retry) |
| Images | expo-image (cached, use `style` not `className`, `contentFit` not `resizeMode`) |
| Client state | React Context (auth); Zustand for ephemeral UI state (onboarding draft, carousel index, video mute/position) |
| Validation | Zod |
| i18n | i18next + react-i18next + expo-localization |
| Icons | lucide-react-native |
| Auth | OAuth only (Google + Apple) — no password auth |
| Admin | Separate Vite + React SPA in `admin/` |

## Directory Structure

```
rupta/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (auth)/             # Login, register
│   ├── (onboarding)/       # 7-step onboarding flow
│   └── (main)/             # Authenticated app
│       ├── (tabs)/         # Bottom tabs: home, explore, groups, leaderboard, profile
│       ├── quest/[id]      # Quest detail (modal)
│       ├── group/[id]/     # Group nested routes (detail, settings, people, quests)
│       ├── completion/[id] # Completion detail
│       └── ...             # 20+ other routes
├── services/               # Pure async functions — Supabase queries, no React
├── hooks/                  # TanStack Query wrappers around services
├── components/             # Reusable UI
│   ├── ui/                 # Primitives (Button, Input, Card, Avatar, Badge, Modal)
│   ├── auth/               # AuthScreenShell, SocialSignInButtons
│   ├── feed/               # FeedPostCard, FeedPostActions
│   ├── completion/         # CompletionComments, CompletionReportModal
│   ├── share/              # CompletedStoryCard (view-shot)
│   ├── social/             # RespectButton
│   ├── navigation/         # MainAppHeader, ScreenHeader
│   └── onboarding/         # OnboardingStepShell
├── providers/              # React context providers
│   ├── AuthProvider.tsx    # Session + profile context
│   └── QueryProvider.tsx   # TanStack Query client config
├── stores/                 # Zustand stores (onboarding draft, carousel index, video mute/position)
├── lib/                    # Utilities and configuration
│   ├── supabase.ts         # Supabase client init (AsyncStorage, auto-refresh)
│   ├── aura.ts             # AURA level math (exponential thresholds)
│   ├── storage.ts          # Upload helpers (completion photos, avatars)
│   ├── questCompletionRules.ts  # Repeatability/cap logic
│   ├── oauth.ts            # OAuth configuration
│   ├── pickImage.ts        # Image picker wrapper
│   ├── share.ts            # Share sheet
│   └── shareLinks.ts       # Deep link generation
├── types/
│   └── database.ts         # Generated Supabase types (DO NOT edit manually)
├── constants/
│   ├── categories.ts       # QUEST_CATEGORIES, ACTIVITY_STYLES
│   ├── theme.ts            # Design tokens (colors, spacing, radii)
│   ├── Colors.ts           # Color definitions
│   └── branding.ts         # Brand constants
├── utils/
│   ├── categoryLabel.ts    # Category display labels (EN/ES)
│   ├── formatTime.ts       # Relative time formatting
│   ├── questCopy.ts        # Bilingual quest title/description getter
│   └── spontaneousAura.ts  # Spontaneous quest AURA math
├── schemas/
│   └── auth.ts             # Zod schemas (login, register)
├── i18n/
│   ├── index.ts            # i18next init, locale detection, setAppLanguage()
│   ├── en.ts               # English translations (canonical keys — type-exported)
│   └── es.ts               # Spanish translations (must match en.ts structure exactly)
├── supabase/
│   ├── config.toml         # Local dev config
│   └── migrations/         # Ordered SQL migrations (see DB section)
├── admin/                  # Vite admin dashboard (separate package.json)
│   └── src/App.tsx         # Users, Completions, Reports management (service role)
├── scripts/
│   └── build-quest-seed.mjs  # Generates quest seed SQL
└── assets/                 # Images, fonts
```

## Architecture: Data Flow

```
Supabase (Postgres + RLS)
  → services/*.ts        (pure async functions, throw on error)
  → hooks/*.ts           (TanStack Query useQuery/useMutation wrappers)
  → components/*.tsx     (UI, consume hooks)
  → app/**/*.tsx         (screens, compose components)
```

### Service Pattern

Services are pure TypeScript functions that call Supabase directly. No React, no hooks, no state.

```typescript
// services/quests.ts
export async function fetchQuests(filters?: QuestFilters) {
  let query = supabase.from('quests').select('*').eq('is_active', true);
  if (filters?.category) query = query.eq('category', filters.category);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
```

For complex queries, prefer DB views (e.g., `feed_completions_enriched`) over multi-query client-side joins. When views aren't possible, fetch tables in parallel with `Promise.all()` and join client-side using Maps for O(1) lookup.

### Hook Pattern

Hooks wrap services with TanStack Query. Every query needs a unique key array.

```typescript
// hooks/useQuests.ts
export function useQuests(filters?: QuestFilters) {
  return useQuery({
    queryKey: ['quests', filters],
    queryFn: () => fetchQuests(filters),
    enabled: true,
  });
}
```

Mutations invalidate related query keys on success:

```typescript
export function useCreateCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCompletion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['completions'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
```

### Screen Pattern

Screens extract route params, call hooks, render UI:

```typescript
export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { data: quest, isLoading } = useQuest(id);
  if (isLoading) return <FullScreenLoader />;
  return <View>...</View>;
}
```

## Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Components | PascalCase file + export | `Button.tsx`, `FeedPostCard.tsx` |
| Screens | kebab-case (Expo Router) | `complete-quest.tsx`, `friend-requests.tsx` |
| Hooks | camelCase, `use` prefix | `useQuests.ts`, `useFriendsList.ts` |
| Services | camelCase | `completions.ts`, `leaderboard.ts` |
| Utils | camelCase | `formatTime.ts`, `questCopy.ts` |
| Variables | camelCase | `questId`, `friendIds` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `QUEST_CATEGORIES` |
| Types/Interfaces | PascalCase | `QuestRow`, `FeedPost`, `QuestFilters` |
| Booleans | `is`/`has`/`should` prefix | `isLoading`, `hasPermission` |
| Query keys | descriptive arrays | `['quests', filters]`, `['feed', userId]` |

## Routing Structure

```
app/
├── index.tsx               → Auth check → onboarding or (main)
├── (auth)/                 → Stack: login, register
├── (onboarding)/           → Stack: welcome → language → profile-setup → personal-info → categories → activity-style → bio
└── (main)/
    ├── (tabs)/             → Tabs: home, explore, groups, leaderboard, profile
    ├── quest/[id]          → Modal presentation
    ├── complete-quest/[questId]
    ├── complete-group-quest/[questId]
    ├── completion/[id]
    ├── share-card/[completionId]
    ├── group/[id]/         → Nested layout: index, settings, people, create-quest, create-challenge, challenge/[challengeId]
    ├── group-quest/[id]
    ├── user/[id]
    ├── friends, friend-requests, notifications, messages
    ├── generator            → SideQuest Generator (rule-based picker)
    ├── create-group, edit-profile, settings
    ├── life-list, unified-search, search-users
    ├── upgrade, quick-complete
    ├── spontaneous-sidequest → Create custom quest
    └── suggest-quest        → Suggest quest to catalog
```

Modal screens use `presentation: 'modal'` + `animation: 'slide_from_bottom'` in the layout.

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User data (username, avatar, city, DOB, categories, total_aura, yearly_aura, status, plan) |
| `quests` | Official + spontaneous quest catalog (bilingual title/desc, category, aura_reward, difficulty, repeatability) |
| `quest_completions` | Proof records (user, quest/group_quest, aura_earned, caption, rating, visibility, aura_scope) |
| `quest_media` | Photos/videos for completions |
| `quest_suggestions` | User-submitted quest ideas |
| `saved_quests` | Bookmarked quests (life list) |

### Groups & Challenges

| Table | Purpose |
|-------|---------|
| `groups` | User-created groups |
| `group_members` | Membership (role: owner/admin/member) |
| `group_settings` | Per-group config (quest_creation_rule, is_public) |
| `group_quests` | Group-scoped quests |
| `group_challenges` | Time-bounded competitions (scoring_mode: official_only/group_only/mixed) |
| `group_member_scores` | Aggregated group aura per user |
| `challenge_scores` | Challenge leaderboard |

### Social

| Table | Purpose |
|-------|---------|
| `friendships` | Confirmed friends (user_a_id < user_b_id constraint) |
| `friend_requests` | Pending/accepted/rejected requests |
| `blocked_users` | Block relationships |
| `reactions` | "Respect" likes (unique per user/completion) |
| `comments` | Comments on completions (max 500 chars) |
| `completion_participants` | Tagged co-participants |
| `notifications` | In-app notifications |
| `reports` | User reports (fake_proof, harassment, etc.) |

### Quest Source Types

1. **Official** (`quest_source_type='official'`): catalog quests with set aura_reward, repeatability rules
2. **Group** (`quest_source_type='group'`): created by group members, group-scoped aura only
3. **Spontaneous** (`quest_source_type='spontaneous'`): user-created feed posts, aura=0 until reviewed

## AURA System

### Dual-Scoped AURA

- **Official AURA** (profile-level): earned from official + approved spontaneous quests → `profiles.total_aura`, `profiles.yearly_aura`
- **Group AURA** (group-local): earned from group quests → `group_member_scores.total_group_aura`
- **Challenge AURA**: earned during active challenges → `challenge_scores.score`

### Level Calculation (`lib/aura.ts`)

Exponential progression: Level 2 = 1000 AURA, each subsequent level adds `1000 * 1.2^(n-2)`.

### Critical Database Triggers (DO NOT duplicate or break)

| Trigger | On | Purpose |
|---------|-----|---------|
| `validate_and_set_quest_completion` | BEFORE INSERT `quest_completions` | Validates repeatability, sets aura_earned |
| `sync_completion_aura_scope` | BEFORE INSERT/UPDATE `quest_completions` | Enforces aura_scope based on quest source |
| `award_aura_on_completion` | AFTER INSERT `quest_completions` | Awards aura to profile/group/challenge |
| `apply_completion_aura_earned_delta` | AFTER UPDATE OF aura_earned `quest_completions` | Applies aura delta (spontaneous reviews) |
| `adjust_aura_on_completion_status` | AFTER UPDATE `quest_completions` | Claws back aura on status → removed |
| `adjust_aura_on_completion_delete` | BEFORE DELETE `quest_completions` | Claws back aura on cascade delete |
| `handle_new_user` | AFTER INSERT `auth.users` | Auto-creates profile |
| `on_friend_request_accepted` | AFTER UPDATE `friend_requests` | Creates friendship row |
| `add_group_owner_member` | AFTER INSERT `groups` | Adds owner as member |
| `add_group_settings_row` | AFTER INSERT `groups` | Creates group_settings |
| `notify_on_respect` | AFTER INSERT `reactions` | Creates notification |
| `notify_on_comment` | AFTER INSERT `comments` | Creates notification |
| `notify_on_friend_request` | AFTER INSERT `friend_requests` | Creates notification |
| `touch_profile_updated_at` | BEFORE UPDATE `profiles` | Updates timestamp |

### RLS Helper Functions

- `is_group_member(p_group_id, p_user_id)` — SECURITY DEFINER function used in all group-related RLS policies to prevent recursion. Do not bypass.
- `is_group_admin(p_group_id, p_user_id)` — SECURITY DEFINER function checking owner/admin role. Used in write/delete policies on group resources.

## Database Views

| View | Purpose |
|------|---------|
| `feed_completions_enriched` | Pre-joined feed data (completions + profiles + quests + group_quests + groups + first media). Used by `services/feed.ts` instead of 5 parallel queries. |

Note: Views aren't in generated types. Use `as 'table_name'` cast on `.from()` when querying views with the typed Supabase client.

## Storage

- **Bucket**: `completion-media` (public read)
- **Path convention**: `{userId}/filename.ext`
- **RLS**: Users can only write to their own `{uid}/` folder prefix
- Avatars use upsert with cache-busting `?t={timestamp}` query params

## i18n

- **Setup**: `i18n/index.ts` — i18next with expo-localization auto-detection
- **Files**: `i18n/en.ts` (canonical — exports `TranslationKeys` type), `i18n/es.ts` (must satisfy same type)
- **Usage**: `const { t } = useTranslation()` → `t('namespace.key')`
- **DB fields**: Bilingual columns (`title_en`/`title_es`, `description_en`/`description_es`)
- **Dynamic selection**: `lang === 'es' ? quest.title_es : quest.title_en`
- **Every `en` key must have a matching `es` key and vice versa.**

## Styling

- **NativeWind** (Tailwind for React Native) — all styling via className props
- **Dark-first**: background `#0A0A0F`, surface `#14141F`, primary purple `#8B5CF6`
- **Design tokens**: `constants/theme.ts` mirrors Tailwind config — always use `colors.*` imports instead of hardcoded hex
- **No StyleSheet.create** — use Tailwind utilities exclusively
- **Variants**: Button component uses variant maps (primary/secondary/ghost/danger)
- **Font**: Inter (regular/semibold/bold)
- **expo-image**: Use `import { Image } from 'expo-image'` (not react-native). `className` does NOT work on expo-image (no cssInterop registered) — use explicit `style` props instead. Use `contentFit` instead of `resizeMode`.

## Admin Panel

Separate Vite + React app at `admin/` with its own `package.json`. Uses Supabase **service role** key (not anon key). Manages:
- Users: view/flag profiles, toggle admin status
- Completions: set status (active/under_review/removed)
- Reports: change status (pending/reviewed/resolved/dismissed)

Run with: `npm run admin` (or `cd admin && npm run dev`)

## Scaffolded but NOT Implemented

These features have partial code/types but are **not functional yet**. Don't assume they work:

- **Video proof**: proof_type selector exists in group quest creation, but `services/completions.ts` hardcodes `media_type: 'photo'`. No video upload or picker.
- **Push notifications**: `services/notifications.ts` manages DB notifications only. No expo-notifications or push service integration.
- **OAuth password auth**: Only Google + Apple OAuth are implemented. No email/password flow despite login form existing.
- **Group invites**: Table and triggers exist but no invite UI flow.
- **Completion participants**: Table exists but tagging UI is minimal.

## Commands

```bash
npx expo start              # Dev server
npm run android             # Android
npm run ios                 # iOS
npm run web                 # Web
npm run admin               # Admin dashboard (Vite)
npx supabase start          # Local Supabase
npx supabase db reset       # Reset local DB (runs all migrations)
npx supabase gen types typescript --local > types/database.ts  # Regenerate types
node scripts/build-quest-seed.mjs  # Regenerate quest seed SQL
```

## Git Conventions

### Commits
- **Format**: `type: description` — one line, no scope, no period, imperative mood
- **Types**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`
- **No** `Co-Authored-By` attribution
- **No** `--no-verify` or `--amend` (always create new commits)

### Pull Requests
- **Title**: short (under 70 chars), same style as commit message
- **Body**: `## Summary` with short bullet points only
- **No** test plan checklists, no emoji, no verbose sections

## Migration Naming

Format: `YYYYMMDDHHMMSS_description.sql` — e.g., `20250401100000_spontaneous_quests.sql`

Migrations are in `supabase/migrations/` and run in lexicographic order. Always include RLS policies for new tables.
