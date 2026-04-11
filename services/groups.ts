import type { Database, QuestCreationRule } from '@/types/database';

import { supabase } from '@/lib/supabase';
import { paginateQuery } from '@/services/_pagination';
import type { ProfileBasic, ProfileFull, ProfileWithAura } from '@/services/_profiles';
import { aggregateByUser, enrichWithProfiles, fetchProfilesByIds, PROFILE_COLS_AURA, PROFILE_COLS_FULL } from '@/services/_profiles';
import type { LeaderboardPeriod } from '@/services/leaderboard';
import { periodSinceIso } from '@/services/leaderboard';

type GroupRow = Database['public']['Tables']['groups']['Row'];
type GroupSettingsRow = Database['public']['Tables']['group_settings']['Row'];

export async function createGroup(ownerId: string, name: string, description?: string): Promise<GroupRow> {
  const { data, error } = await supabase
    .from('groups')
    .insert({ name, description: description ?? null, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGroup(
  groupId: string,
  patch: { name?: string; description?: string | null; avatar_url?: string | null },
): Promise<GroupRow> {
  const { data, error } = await supabase.from('groups').update(patch).eq('id', groupId).select().single();
  if (error) throw error;
  return data;
}

export async function searchMyGroups(userId: string, query: string): Promise<GroupRow[]> {
  const groups = await fetchMyGroups(userId);
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups.filter((g) => g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q));
}

export async function fetchMyGroups(userId: string): Promise<GroupRow[]> {
  const { data: mems, error } = await supabase.from('group_members').select('group_id').eq('user_id', userId);
  if (error) throw error;
  const ids = (mems ?? []).map((m) => m.group_id);
  if (ids.length === 0) return [];
  const { data: groups, error: gErr } = await supabase.from('groups').select('*').in('id', ids);
  if (gErr) throw gErr;
  return groups ?? [];
}

export async function fetchGroupDetail(groupId: string): Promise<{
  group: Pick<GroupRow, 'id' | 'name' | 'description' | 'avatar_url' | 'owner_id' | 'created_at'>;
  members: (Database['public']['Tables']['group_members']['Row'] & { profiles: ProfileWithAura | undefined })[];
}> {
  const { data: group, error } = await supabase.from('groups').select('id, name, description, avatar_url, owner_id, created_at').eq('id', groupId).single();
  if (error) throw error;
  const { data: members, error: mErr } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId);
  if (mErr) throw mErr;
  const enriched = await enrichWithProfiles(members ?? [], 'user_id', PROFILE_COLS_AURA);
  return { group, members: enriched };
}

export async function inviteToGroup(groupId: string, inviterId: string, inviteeId: string): Promise<void> {
  const { error } = await supabase.from('group_invites').insert({
    group_id: groupId,
    inviter_id: inviterId,
    invitee_id: inviteeId,
    status: 'pending',
  });
  if (error) throw error;
}

export async function respondGroupInvite(inviteId: string, accept: boolean): Promise<void> {
  const { error } = await supabase
    .from('group_invites')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', inviteId);
  if (error) throw error;
}

export async function fetchPendingGroupInvites(userId: string): Promise<(Database['public']['Tables']['group_invites']['Row'] & {
  groups: GroupRow | undefined;
  inviter: ProfileBasic | undefined;
})[]> {
  const { data: invites, error } = await supabase
    .from('group_invites')
    .select('*')
    .eq('invitee_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
  const list = invites ?? [];
  if (list.length === 0) return [];
  const gids = [...new Set(list.map((i) => i.group_id))];
  const inviterIds = [...new Set(list.map((i) => i.inviter_id))];
  const [{ data: groups }, { data: inviters }] = await Promise.all([
    supabase.from('groups').select('*').in('id', gids),
    supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', inviterIds),
  ]);
  const gmap = new Map((groups ?? []).map((g) => [g.id, g]));
  const imap = new Map((inviters ?? []).map((p) => [p.id, p]));
  return list.map((i) => ({
    ...i,
    groups: gmap.get(i.group_id),
    inviter: imap.get(i.inviter_id),
  }));
}

type GroupLeaderboardRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_aura: number;
  yearly_aura: number;
  total_group_aura: number;
  period_aura: number;
};

async function fetchGroupCompletionAggRows(groupId: string, sinceIso: string) {
  return paginateQuery<{ user_id: string; aura_earned: number }>(
    (from, to) =>
      supabase
        .from('quest_completions')
        .select('user_id, aura_earned')
        .eq('group_id', groupId)
        .eq('status', 'active')
        .gte('completed_at', sinceIso)
        .range(from, to),
  );
}

/** Group ranks: all-time uses group_member_scores; shorter windows sum completions in the group. */
export async function groupLeaderboard(groupId: string, period: LeaderboardPeriod = 'all'): Promise<GroupLeaderboardRow[]> {
  if (period === 'all') {
    const { data: scores, error } = await supabase
      .from('group_member_scores')
      .select('user_id, total_group_aura')
      .eq('group_id', groupId)
      .order('total_group_aura', { ascending: false });
    if (error) throw error;
    const list = scores ?? [];
    if (list.length === 0) {
      const { data: mems } = await supabase.from('group_members').select('user_id').eq('group_id', groupId);
      const ids = (mems ?? []).map((m) => m.user_id);
      if (ids.length === 0) return [];
      const profiles = await fetchProfilesByIds(ids, PROFILE_COLS_FULL);
      return profiles.map(
        (p): GroupLeaderboardRow => {
          const fp = p as ProfileFull;
          return {
            id: fp.id,
            username: fp.username,
            display_name: fp.display_name,
            avatar_url: fp.avatar_url,
            total_aura: fp.total_aura,
            yearly_aura: fp.yearly_aura,
            total_group_aura: 0,
            period_aura: 0,
          };
        },
      );
    }
    const enriched = await enrichWithProfiles(list, 'user_id', PROFILE_COLS_FULL);
    return enriched
      .filter((s) => s.profiles != null)
      .map((s): GroupLeaderboardRow => {
        const prof = s.profiles! as ProfileFull;
        return {
          id: prof.id,
          username: prof.username,
          display_name: prof.display_name,
          avatar_url: prof.avatar_url,
          total_aura: prof.total_aura,
          yearly_aura: prof.yearly_aura,
          total_group_aura: s.total_group_aura,
          period_aura: s.total_group_aura,
        };
      });
  }

  const since = periodSinceIso(period);
  const rows = await fetchGroupCompletionAggRows(groupId, since);
  const ordered = aggregateByUser(rows, 50);
  if (ordered.length === 0) return [];
  const profiles = await fetchProfilesByIds(
    ordered.map((o) => o.userId),
    PROFILE_COLS_FULL,
  );
  const pmap = new Map(profiles.map((p) => [p.id, p]));
  return ordered
    .map(({ userId, score }) => {
      const p = pmap.get(userId);
      if (!p) return null;
      const fp = p as ProfileFull;
      const row: GroupLeaderboardRow = {
        id: fp.id,
        username: fp.username,
        display_name: fp.display_name,
        avatar_url: fp.avatar_url,
        total_aura: fp.total_aura,
        yearly_aura: fp.yearly_aura,
        total_group_aura: score,
        period_aura: score,
      };
      return row;
    })
    .filter((row): row is GroupLeaderboardRow => row !== null);
}

export async function fetchGroupSettings(groupId: string): Promise<GroupSettingsRow> {
  const { data, error } = await supabase.from('group_settings').select('*').eq('group_id', groupId).single();
  if (error) throw error;
  return data;
}

export async function updateGroupSettings(
  groupId: string,
  patch: { quest_creation_rule?: QuestCreationRule; is_public?: boolean },
): Promise<GroupSettingsRow> {
  const { data, error } = await supabase
    .from('group_settings')
    .update(patch)
    .eq('group_id', groupId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPublicGroups(search?: string): Promise<GroupRow[]> {
  const { data: settings, error } = await supabase
    .from('group_settings')
    .select('group_id')
    .eq('is_public', true);
  if (error) throw error;
  const ids = (settings ?? []).map((s) => s.group_id);
  if (ids.length === 0) return [];
  let q = supabase.from('groups').select('*').in('id', ids);
  const term = search?.trim();
  if (term) {
    q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  const { data: groups, error: gErr } = await q.limit(40);
  if (gErr) throw gErr;
  return groups ?? [];
}

export async function joinPublicGroup(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role: 'member' });
  if (error) throw error;
}

export async function countGroupsOwned(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('groups')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);
  if (error) throw error;
  return count ?? 0;
}

export async function countGroupsMembership(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}
