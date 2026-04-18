# Rupta

Social **SideQuest** app: real-world activities, photo proof, **AURA** (XP), **Respect** (likes), friends, groups, leaderboards, **Life List**, story sharing, and a minimal **admin** dashboard.

## Stack

| Layer | Choice |
|--------|--------|
| Mobile | Expo SDK 54, React Native, TypeScript, Expo Router |
| Styling | NativeWind (Tailwind) 4.x |
| Backend | Supabase (Auth, Postgres, RLS, Edge Functions) |
| Media | Cloudflare Images + Stream (direct-creator uploads via Supabase edge functions) |
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
# Fill in:
#   EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
#   EXPO_PUBLIC_CF_ACCOUNT_HASH        (Cloudflare → Images → account hash)
#   EXPO_PUBLIC_CF_STREAM_SUBDOMAIN    (Cloudflare → Stream → e.g. customer-abc123)
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

**Media:** the app stores Cloudflare Images IDs / Stream UIDs in `profiles.avatar_url`, `groups.avatar_url`, and `quest_media.media_url`. Delivery URLs are built client-side by `lib/mediaUrls.ts` (`imageUrl`, `videoHlsUrl`, `videoThumbUrl`). Uploads go through the `mint-image-upload` / `mint-stream-upload` edge functions (see [Cloudflare media](#cloudflare-media) below). Legacy `http(s)/file/data/blob` URLs are passed through unchanged.

### 2. Admin dashboard

```bash
cd admin
cp .env.example .env.local
# Fill in:
#   VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY (service role — keep secret)
#   VITE_CF_ACCOUNT_HASH       (same as EXPO_PUBLIC_CF_ACCOUNT_HASH)
#   VITE_CF_STREAM_SUBDOMAIN   (same as EXPO_PUBLIC_CF_STREAM_SUBDOMAIN)
npm install
npm run dev
```

Use admin UI to set `is_admin` on your profile if you need elevated operations outside the dashboard.

### 3. Cloudflare media

Media uploads and delivery run on Cloudflare Images + Stream. Two Supabase edge functions mint one-shot direct-creator upload URLs so the mobile client never touches long-lived Cloudflare credentials.

**Edge functions** (in `supabase/functions/`):

| Function | Purpose | Returns |
|---|---|---|
| `mint-image-upload` | Authenticated POST; body `{ purpose: 'avatar' \| 'group-avatar' \| 'completion-photo' }`. Creates a one-shot Cloudflare Images upload URL. | `{ id, uploadURL }` |
| `mint-stream-upload` | Authenticated POST. Creates a one-shot Cloudflare Stream tus/direct upload URL. | `{ uid, uploadURL }` |

Deploy once:

```bash
npx supabase functions deploy mint-image-upload
npx supabase functions deploy mint-stream-upload
```

**Edge function secrets** (set in Supabase, not in `.env`):

```bash
npx supabase secrets set \
  CLOUDFLARE_ACCOUNT_ID=<cloudflare account id> \
  CLOUDFLARE_API_TOKEN=<token with Images:Edit + Stream:Edit>
```

The functions also read `SUPABASE_URL` and `SUPABASE_ANON_KEY`, which Supabase injects automatically.

**One-shot migration** (for projects that previously stored media in the Supabase `completion-media` bucket):

```bash
# .env must contain:
#   EXPO_PUBLIC_SUPABASE_URL
#   SUPABASE_SERVICE_ROLE_KEY
#   CLOUDFLARE_ACCOUNT_ID
#   CLOUDFLARE_API_TOKEN

node --env-file=.env scripts/migrate-media-to-cloudflare.mjs          # copy + rewrite DB refs
MIGRATION_DRY_RUN=1 node --env-file=.env scripts/migrate-media-to-cloudflare.mjs   # preview only
node --env-file=.env scripts/empty-supabase-media-bucket.mjs          # after migration, clear the bucket
```

`migrate-media-to-cloudflare.mjs` accepts `MIGRATION_TARGET=profiles|groups|media|all` (default `all`) and `MIGRATION_BATCH_SIZE` (default `50`). It skips rows whose value is already a Cloudflare ID (no scheme) and only rewrites rows whose value matches `http(s)://`.

## Project layout

- `app/` — Expo Router screens: `(auth)`, `(onboarding)`, `(main)` tabs + stack.
- `components/` — UI primitives, feed, share, social.
- `services/` — Supabase calls (no React).
- `hooks/` — TanStack Query wrappers.
- `supabase/migrations/` — schema, RLS, triggers, seed.
- `supabase/functions/` — Deno edge functions (Cloudflare upload URL minting).
- `lib/mediaUrls.ts` / `lib/cloudflareMedia.ts` — build Cloudflare delivery URLs and upload to CF via minted URLs.
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
- Signed / token-gated Cloudflare delivery URLs for private media; basic image compression before upload.
- Stronger anti-cheat (rate limits, device signals) — still no ML in v1.
- More story templates (rare quest, weekly recap, group).
- Partial unique + cleanup for duplicate friend requests UX.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run android` / `ios` | Run on device/emulator |
| `node scripts/build-quest-seed.mjs` | Regenerate quest seed migration |
| `node --env-file=.env scripts/migrate-media-to-cloudflare.mjs` | Copy legacy Supabase Storage media to Cloudflare and rewrite DB URLs |
| `node --env-file=.env scripts/empty-supabase-media-bucket.mjs` | Empty the `completion-media` bucket after migration (refuses if any `http(s)` refs remain) |
| `npx supabase functions deploy mint-image-upload` | Deploy the Cloudflare Images upload-URL minter |
| `npx supabase functions deploy mint-stream-upload` | Deploy the Cloudflare Stream upload-URL minter |

---

**Product line:** AURA · Respect · Aura Level · Momentum (streaks, future) · Life List · SideQuest Generator.
