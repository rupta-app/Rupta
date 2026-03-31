# Rupta

Social **SideQuest** app: real-world activities, photo proof, **AURA** (XP), **Respect** (likes), friends, groups, leaderboards, **Life List**, story sharing, and a minimal **admin** dashboard.

## Stack

| Layer | Choice |
|--------|--------|
| Mobile | Expo SDK 54, React Native, TypeScript, Expo Router |
| Styling | NativeWind (Tailwind) 4.x |
| Backend | Supabase (Auth, Postgres, Storage, RLS) |
| State / data | Zustand (onboarding draft), TanStack Query (server state) |
| Validation | Zod 3 |
| i18n | i18next + expo-localization (EN + ES) |
| Admin | Vite + React + Tailwind (separate app in `admin/`) |

## What was built (MVP)

- **Auth:** email/password, forgot password; OAuth-ready via Supabase (not wired in UI).
- **Onboarding:** language, profile, personal info, categories, activity styles, bio → sets `profiles.onboarding_completed`.
- **Home feed:** friends’ + own completions, suggested quest, pull-to-refresh, Respect/comment counts.
- **Quest catalog:** search, category chips, detail, save to Life List.
- **Complete flow:** photo proof (required), caption, rating, co-participants (friends), AURA via DB trigger.
- **Share card:** `CompletedStoryCard` + `react-native-view-shot` → save to library / system share sheet (`expo-sharing`; pick Instagram there).
- **Social:** Respect toggle, comments, reports (completion → `under_review`).
- **Friends:** search, requests, accept/reject, profiles.
- **Groups:** create, invites, members, group AURA leaderboard.
- **Leaderboards:** global + friends, all-time + yearly.
- **Generator:** rule-based picker from catalog (no LLM).
- **Notifications:** in-app list (DB + triggers for respect, comment, friend request, group invite); weekly suggestion can be inserted with `notifications` policy (self-row).
- **Profile:** AURA, Aura Level (formula in `lib/aura.ts`), stats, recent completions, Life List link.
- **Admin (`admin/`):** users (status, admin flag), completions (status), reports (status) using **service role** key.

## What is mocked vs real

| Area | Notes |
|------|--------|
| Supabase | **Real** once `.env` is set and migrations applied. Without env, the app shows a “Connect Supabase” screen. |
| Quest data | **Real** after running migrations + seed SQL (`147` quests). |
| Push notifications | **Not implemented** (in-app only). |
| OAuth | **Not wired** (architecture: Supabase Auth). |
| Instagram | **System share sheet** (`expo-sharing`); user picks Instagram. Direct Stories-only APIs need a dev build + native module if you require that flow. |
| Video proof | **Scaffold only** (schema allows `video`; UI is photo-first). |

## Prerequisites

- Node 20+
- [Supabase](https://supabase.com) project
- `react-native-view-shot` is included in Expo Go. If you add other custom native modules, use an **EAS Dev Build** or `expo prebuild`.

## Setup

### 1. Mobile app

```bash
cp .env.example .env
# Edit .env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npx expo start
```

Apply database migrations (Supabase SQL editor or CLI):

1. Run [`supabase/migrations/20250324000001_initial_schema.sql`](supabase/migrations/20250324000001_initial_schema.sql)
2. Run [`supabase/migrations/20250324000002_seed_quests.sql`](supabase/migrations/20250324000002_seed_quests.sql)

Regenerate quests seed anytime:

```bash
node scripts/build-quest-seed.mjs
```

**Auth note:** disable email confirmation for local dev (Supabase Auth settings) or confirm emails before testing login.

**Storage:** bucket `completion-media` is created by migration (public read). Adjust policies if you want private media + signed URLs.

### 2. Admin dashboard

```bash
cd admin
cp .env.example .env.local
# VITE_SUPABASE_URL + VITE_SUPABASE_SERVICE_ROLE_KEY (service role — keep secret)
npm install
npm run dev
```

Use admin UI to set `is_admin` on your profile if you need elevated operations outside the dashboard.

## Project layout

- `app/` — Expo Router screens: `(auth)`, `(onboarding)`, `(main)` tabs + stack.
- `components/` — UI primitives, feed, share, social.
- `services/` — Supabase calls (no React).
- `hooks/` — TanStack Query wrappers.
- `supabase/migrations/` — schema, RLS, triggers, seed.
- `admin/` — Vite admin SPA.

## AURA & Aura Level

- Quests define `aura_reward`. Inserts into `quest_completions` increment `profiles.total_aura` and `yearly_aura` (trigger).
- Level curve: see `lib/aura.ts` (1000 base step, +20% per subsequent level).

## Technical debt / shortcuts

- Feed/social queries use **manual joins** in TS for predictable PostgREST behavior with RLS.
- Instagram direct-Stories integration was removed for Expo Go compatibility; reintroduce a native module in a dev build if you need Meta `appId` / Stories-only APIs.
- `group_invites` partial unique index only enforces one **pending** invite per pair; rejected invites can be re-sent.
- Yearly AURA reset is **not** scheduled (cron/job left for later).
- Some screens use minimal headers instead of unified stack header config.
- `types/database.ts` kept for reference; Supabase client is **untyped** generic to avoid `Insert: never` drift.

## What to build next

- OAuth (Apple / Google) with Supabase providers.
- Push notifications (Expo Notifications + edge functions).
- EAS Build pipelines + TestFlight / Play Internal.
- Private media + signed URLs; basic image compression before upload.
- Stronger anti-cheat (rate limits, device signals) — still no ML in v1.
- More story templates (rare quest, weekly recap, group).
- Partial unique + cleanup for duplicate friend requests UX.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run android` / `ios` | Run on device/emulator |
| `node scripts/build-quest-seed.mjs` | Regenerate quest seed migration |

---

**Product line:** AURA · Respect · Aura Level · Momentum (streaks, future) · Life List · SideQuest Generator.
