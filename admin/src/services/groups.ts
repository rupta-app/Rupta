import { adminClient } from '@/lib/supabaseAdmin';

export interface AdminGroup {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
  owner: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  settings: {
    quest_creation_rule: string;
    is_public: boolean;
  } | null;
  member_count: number;
}

export interface AdminGroupMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    total_aura: number;
  } | null;
}

interface FetchGroupsParams {
  search?: string;
  page: number;
  pageSize: number;
}

export async function fetchGroups({ search, page, pageSize }: FetchGroupsParams) {
  let query = adminClient
    .from('groups')
    .select(
      `
      id, name, description, avatar_url, owner_id, created_at,
      owner:profiles!groups_owner_id_fkey(display_name, username, avatar_url),
      settings:group_settings(quest_creation_rule, is_public),
      members:group_members(id)
    `,
      { count: 'exact' },
    );

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;

  const normalized = (data ?? []).map((g) => ({
    ...g,
    owner: Array.isArray(g.owner) ? g.owner[0] ?? null : g.owner,
    settings: Array.isArray(g.settings) ? g.settings[0] ?? null : g.settings,
    member_count: Array.isArray(g.members) ? g.members.length : 0,
  })) as AdminGroup[];

  return { data: normalized, total: count ?? 0 };
}

export async function fetchGroupMembers(groupId: string, page: number, pageSize: number) {
  const { data, error, count } = await adminClient
    .from('group_members')
    .select(
      `
      id, user_id, role, joined_at,
      profile:profiles(display_name, username, avatar_url, total_aura)
    `,
      { count: 'exact' },
    )
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;

  const normalized = (data ?? []).map((m) => ({
    ...m,
    profile: Array.isArray(m.profile) ? m.profile[0] ?? null : m.profile,
  })) as AdminGroupMember[];

  return { data: normalized, total: count ?? 0 };
}

export async function updateGroupSettings(
  groupId: string,
  settings: { quest_creation_rule?: string; is_public?: boolean },
) {
  const { error } = await adminClient
    .from('group_settings')
    .update(settings)
    .eq('group_id', groupId);
  if (error) throw error;
}

export async function updateMemberRole(groupId: string, userId: string, role: string) {
  const { error } = await adminClient
    .from('group_members')
    .update({ role })
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function removeMember(groupId: string, userId: string) {
  const { error } = await adminClient
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteGroup(groupId: string) {
  const { error } = await adminClient.from('groups').delete().eq('id', groupId);
  if (error) throw error;
}
