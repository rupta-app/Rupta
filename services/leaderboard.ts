import { supabase } from '@/lib/supabase';
import { paginateQuery } from '@/services/_pagination';
import type { ProfileFull } from '@/services/_profiles';
import { aggregateByUser, fetchProfilesByIds, PROFILE_COLS_FULL } from '@/services/_profiles';

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

async function profilesForLeaderboard(
  ordered: { userId: string; score: number }[],
): Promise<LeaderboardRow[]> {
  if (ordered.length === 0) return [];
  const ids = ordered.map((o) => o.userId);
  const profiles = await fetchProfilesByIds(ids, PROFILE_COLS_FULL);
  const pmap = new Map(profiles.map((p) => [p.id, p]));
  return ordered
    .map(({ userId, score }) => {
      const p = pmap.get(userId);
      if (!p) return null;
      const fp = p as ProfileFull;
      const row: LeaderboardRow = {
        id: fp.id,
        username: fp.username,
        display_name: fp.display_name,
        avatar_url: fp.avatar_url,
        total_aura: fp.total_aura,
        yearly_aura: fp.yearly_aura,
        period_aura: score,
      };
      return row;
    })
    .filter((r): r is LeaderboardRow => r !== null);
}

/** Official-quest AURA earned in the window (global or restricted to user ids). */
export async function officialAuraLeaderboard(period: LeaderboardPeriod, limit = 50, userIds?: string[]): Promise<LeaderboardRow[]> {
  if (period === 'all') {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLS_FULL)
      .order('total_aura', { ascending: false })
      .limit(limit);
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
  const rows = await fetchOfficialAuraRowsSince(since, userIds);

  const ordered = aggregateByUser(rows, limit);
  return profilesForLeaderboard(ordered);
}

export async function globalLeaderboard(period: LeaderboardPeriod, limit = 50): Promise<LeaderboardRow[]> {
  return officialAuraLeaderboard(period, limit);
}

export async function friendsLeaderboard(userId: string, period: LeaderboardPeriod, limit = 50): Promise<LeaderboardRow[]> {
  const friendIds = await fetchFriendIds(userId);
  const ids = [...friendIds, userId];
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
  return officialAuraLeaderboard(period, limit, ids);
}
