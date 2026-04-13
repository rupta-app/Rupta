import { supabase } from '@/lib/supabase';

// -- Profile column constants --------------------------------------------------

export const PROFILE_COLS_BASIC =
  'id, username, display_name, avatar_url' as const;
export const PROFILE_COLS_AURA =
  'id, username, display_name, avatar_url, total_aura' as const;
export const PROFILE_COLS_FULL =
  'id, username, display_name, avatar_url, total_aura, yearly_aura' as const;

export type ProfileBasic = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export type ProfileWithAura = ProfileBasic & { total_aura: number };
export type ProfileFull = ProfileWithAura & { yearly_aura: number };

// -- Enrichment helpers --------------------------------------------------------

/**
 * Fetch profiles for a list of rows keyed by `userIdKey`, then attach each
 * profile under a `profiles` property. Returns a new array — does not mutate.
 */
export async function enrichWithProfiles<
  T extends Record<string, unknown>,
>(
  rows: T[],
  userIdKey: string,
  columns: string = PROFILE_COLS_BASIC,
): Promise<(T & { profiles: ProfileBasic | ProfileWithAura | ProfileFull | undefined })[]> {
  if (rows.length === 0) return [];
  const uids = [...new Set(rows.map((r) => String(r[userIdKey])))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select(columns)
    .in('id', uids);
  const pmap = new Map(
    ((profiles ?? []) as unknown as { id: string }[]).map((p) => [p.id, p]),
  );
  return rows.map((r) => ({
    ...r,
    profiles: pmap.get(String(r[userIdKey])) as
      | ProfileBasic
      | ProfileWithAura
      | ProfileFull
      | undefined,
  }));
}

/** Fetch profiles by their IDs (no row enrichment). */
export async function fetchProfilesByIds(
  ids: string[],
  columns: string = PROFILE_COLS_BASIC,
) {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select(columns)
    .in('id', ids);
  if (error) throw error;
  return (data ?? []) as unknown as (ProfileBasic | ProfileWithAura | ProfileFull)[];
}

// -- Aggregation helper --------------------------------------------------------

/** Sum `aura_earned` per `user_id`, sort descending, return top `limit` entries. */
export function aggregateByUser(
  rows: { user_id: string; aura_earned: number }[],
  limit: number,
): { userId: string; score: number }[] {
  const sum = new Map<string, number>();
  for (const r of rows) {
    sum.set(r.user_id, (sum.get(r.user_id) ?? 0) + r.aura_earned);
  }
  return [...sum.entries()]
    .map(([userId, score]) => ({ userId, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
