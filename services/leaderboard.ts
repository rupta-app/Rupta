import { supabase } from '@/lib/supabase';
import { paginateQuery } from '@/services/_pagination';
import type { ProfileFull } from '@/services/_profiles';
import { fetchProfilesByIds, PROFILE_COLS_FULL } from '@/services/_profiles';

import { fetchFriendIds } from '@/services/feed';

export type LeaderboardPeriod = 'week' | 'month' | 'year' | 'all';

export type LeaderboardRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_aura: number;
  yearly_aura: number;
  /** Score for the selected time window (official / friends scope). */
  period_aura: number;
  total_group_aura?: number;
};

export const LEADERBOARD_PAGE_SIZE = 50;

export function periodSinceIso(period: Exclude<LeaderboardPeriod, 'all'>): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  if (period === 'week') {
    const day = d.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setUTCDate(d.getUTCDate() - diff);
  } else if (period === 'month') {
    d.setUTCDate(1);
  } else {
    d.setUTCMonth(0, 1);
  }
  return d.toISOString();
}

type CompletionAggRow = { user_id: string; aura_earned: number };

type RpcGlobalRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_aura: number | string;
  yearly_aura: number | string;
  period_aura: number | string;
};

async function fetchOfficialAuraRowsSince(
  sinceIso: string,
  userIds: string[] | undefined,
): Promise<CompletionAggRow[]> {
  return paginateQuery<CompletionAggRow>((from, to) => {
    let q = supabase
      .from('quest_completions')
      .select('user_id, aura_earned')
      .eq('quest_source_type', 'official')
      .eq('status', 'active')
      .gte('completed_at', sinceIso);
    if (userIds && userIds.length > 0) {
      q = q.in('user_id', userIds);
    }
    return q.range(from, to);
  });
}

function sumOfficialAuraByUser(rows: CompletionAggRow[]): Map<string, number> {
  const sum = new Map<string, number>();
  for (const r of rows) {
    sum.set(r.user_id, (sum.get(r.user_id) ?? 0) + r.aura_earned);
  }
  return sum;
}

async function profilesForLeaderboard(ordered: { userId: string; score: number }[]): Promise<LeaderboardRow[]> {
  if (ordered.length === 0) return [];
  const ids = ordered.map((o) => o.userId);
  const profiles = await fetchProfilesByIds(ids, PROFILE_COLS_FULL);
  const pmap = new Map(profiles.map((p) => [p.id, p]));
  return ordered
    .map(({ userId, score }) => {
      const p = pmap.get(userId);
      if (!p) return null;
      const fp = p as ProfileFull;
      return {
        id: fp.id,
        username: fp.username,
        display_name: fp.display_name,
        avatar_url: fp.avatar_url,
        total_aura: fp.total_aura,
        yearly_aura: fp.yearly_aura,
        period_aura: score,
      };
    })
    .filter((r): r is LeaderboardRow => r !== null);
}

/** One page of global ranks (every profile; window score or all-time total_aura). */
export async function fetchGlobalLeaderboardPage(
  period: LeaderboardPeriod,
  offset: number,
  pageSize = LEADERBOARD_PAGE_SIZE,
): Promise<{ rows: LeaderboardRow[]; hasMore: boolean }> {
  const pSince = period === 'all' ? null : periodSinceIso(period);
  const { data, error } = await supabase.rpc('leaderboard_global_page', {
    p_since: pSince,
    p_limit: pageSize,
    p_offset: offset,
  });
  if (error) throw error;
  const raw = (data ?? []) as RpcGlobalRow[];
  const rows: LeaderboardRow[] = raw.map((p) => ({
    id: p.id,
    username: p.username,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    total_aura: Number(p.total_aura),
    yearly_aura: Number(p.yearly_aura),
    period_aura: Number(p.period_aura),
  }));
  return { rows, hasMore: raw.length === pageSize };
}

/** Friends + self, all periods; window scores include 0 for anyone with no completions in range. */
export async function friendsLeaderboard(userId: string, period: LeaderboardPeriod): Promise<LeaderboardRow[]> {
  const friendIds = await fetchFriendIds(userId);
  const ids = [...new Set([...friendIds, userId])].sort((a, b) => a.localeCompare(b));
  if (ids.length === 0) return [];

  if (period === 'all') {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLS_FULL)
      .in('id', ids)
      .order('total_aura', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((p): LeaderboardRow => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      total_aura: p.total_aura,
      yearly_aura: p.yearly_aura,
      period_aura: p.total_aura,
    }));
  }

  const since = periodSinceIso(period);
  const rows = await fetchOfficialAuraRowsSince(since, ids);
  const sums = sumOfficialAuraByUser(rows);
  const ordered = ids.map((id) => ({ userId: id, score: sums.get(id) ?? 0 }));
  ordered.sort((a, b) => b.score - a.score || a.userId.localeCompare(b.userId));
  return profilesForLeaderboard(ordered);
}
