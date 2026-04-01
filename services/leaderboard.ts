import { supabase } from '@/lib/supabase';

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
  const pageSize = 1000;
  let offset = 0;
  const all: CompletionAggRow[] = [];
  for (;;) {
    let q = supabase
      .from('quest_completions')
      .select('user_id, aura_earned')
      .eq('quest_source_type', 'official')
      .eq('status', 'active')
      .gte('completed_at', sinceIso);
    if (userIds && userIds.length > 0) {
      q = q.in('user_id', userIds);
    }
    const { data, error } = await q.range(offset, offset + pageSize - 1);
    if (error) throw error;
    const chunk = (data ?? []) as CompletionAggRow[];
    if (chunk.length === 0) break;
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

function aggregateByUser(
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

async function profilesForLeaderboard(
  ordered: { userId: string; score: number }[],
): Promise<LeaderboardRow[]> {
  if (ordered.length === 0) return [];
  const ids = ordered.map((o) => o.userId);
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, total_aura, yearly_aura')
    .in('id', ids);
  if (error) throw error;
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return ordered
    .map(({ userId, score }) => {
      const p = pmap.get(userId);
      if (!p) return null;
      return {
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        total_aura: p.total_aura,
        yearly_aura: p.yearly_aura,
        period_aura: score,
      };
    })
    .filter((r): r is LeaderboardRow => r !== null);
}

/** Official-quest AURA earned in the window (global or restricted to user ids). */
export async function officialAuraLeaderboard(period: LeaderboardPeriod, limit = 50, userIds?: string[]) {
  if (period === 'all') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, total_aura, yearly_aura')
      .order('total_aura', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((p) => ({
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

export async function globalLeaderboard(period: LeaderboardPeriod, limit = 50) {
  return officialAuraLeaderboard(period, limit);
}

export async function friendsLeaderboard(userId: string, period: LeaderboardPeriod, limit = 50) {
  const friendIds = await fetchFriendIds(userId);
  const ids = [...friendIds, userId];
  if (period === 'all') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, total_aura, yearly_aura')
      .in('id', ids)
      .order('total_aura', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((p) => ({
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
