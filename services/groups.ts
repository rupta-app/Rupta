import { supabase } from '@/lib/supabase';

export async function createGroup(ownerId: string, name: string, description?: string) {
  const { data, error } = await supabase
    .from('groups')
    .insert({ name, description: description ?? null, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function searchMyGroups(userId: string, query: string) {
  const groups = await fetchMyGroups(userId);
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups.filter((g) => g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q));
}

export async function fetchMyGroups(userId: string) {
  const { data: mems, error } = await supabase.from('group_members').select('group_id').eq('user_id', userId);
  if (error) throw error;
  const ids = (mems ?? []).map((m) => m.group_id);
  if (ids.length === 0) return [];
  const { data: groups, error: gErr } = await supabase.from('groups').select('*').in('id', ids);
  if (gErr) throw gErr;
  return groups ?? [];
}

export async function fetchGroupDetail(groupId: string) {
  const { data: group, error } = await supabase.from('groups').select('*').eq('id', groupId).single();
  if (error) throw error;
  const { data: members, error: mErr } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId);
  if (mErr) throw mErr;
  const uids = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, total_aura')
    .in('id', uids);
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return {
    group,
    members: (members ?? []).map((m) => ({ ...m, profiles: pmap.get(m.user_id) })),
  };
}

export async function inviteToGroup(groupId: string, inviterId: string, inviteeId: string) {
  const { error } = await supabase.from('group_invites').insert({
    group_id: groupId,
    inviter_id: inviterId,
    invitee_id: inviteeId,
    status: 'pending',
  });
  if (error) throw error;
}

export async function respondGroupInvite(inviteId: string, accept: boolean) {
  const { error } = await supabase
    .from('group_invites')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', inviteId);
  if (error) throw error;
}

export async function fetchPendingGroupInvites(userId: string) {
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
    supabase.from('profiles').select('id, username, display_name').in('id', inviterIds),
  ]);
  const gmap = new Map((groups ?? []).map((g) => [g.id, g]));
  const imap = new Map((inviters ?? []).map((p) => [p.id, p]));
  return list.map((i) => ({
    ...i,
    groups: gmap.get(i.group_id),
    inviter: imap.get(i.inviter_id),
  }));
}

export async function groupLeaderboard(groupId: string, mode: 'total' | 'yearly' = 'total') {
  const { data: mems, error } = await supabase.from('group_members').select('user_id').eq('group_id', groupId);
  if (error) throw error;
  const ids = (mems ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];
  const col = mode === 'yearly' ? 'yearly_aura' : 'total_aura';
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, total_aura, yearly_aura')
    .in('id', ids)
    .order(col, { ascending: false });
  if (pErr) throw pErr;
  return profiles ?? [];
}
