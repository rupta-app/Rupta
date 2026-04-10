import { supabase } from '@/lib/supabase';

export async function fetchFriendIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('user_a_id, user_b_id')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
  if (error) throw error;
  const ids: string[] = [];
  (data ?? []).forEach((row) => {
    if (row.user_a_id === userId) ids.push(row.user_b_id);
    else ids.push(row.user_a_id);
  });
  return ids;
}

export async function fetchBlockedIds(userId: string) {
  const { data, error } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.blocked_id));
}

export type HomeFeedFilter = 'all' | 'official' | 'unofficial';

export async function fetchHomeFeed(
  userId: string,
  friendIds: string[],
  filter: HomeFeedFilter = 'all',
) {
  const blocked = await fetchBlockedIds(userId);
  const ids = [...friendIds, userId].filter((id) => !blocked.has(id));
  if (ids.length === 0) return [];

  let q = supabase
    .from('quest_completions')
    .select('*')
    .in('user_id', ids)
    .eq('status', 'active')
    .order('completed_at', { ascending: false })
    .limit(50);

  if (filter === 'official') {
    q = q.eq('quest_source_type', 'official');
  } else if (filter === 'unofficial') {
    q = q.or(
      'and(quest_source_type.eq.group,visibility.in.(public,friends)),and(quest_source_type.eq.spontaneous,visibility.in.(public,friends))',
    );
  }

  const { data: completions, error } = await q;
  if (error) throw error;
  const rows = (completions ?? []).filter((r) => !blocked.has(r.user_id as string));
  if (rows.length === 0) return [];

  const pIds = [...new Set(rows.map((r) => r.user_id))];
  const officialQids = [...new Set(rows.map((r) => r.quest_id).filter(Boolean))] as string[];
  const groupQids = [...new Set(rows.map((r) => r.group_quest_id).filter(Boolean))] as string[];
  const groupIds = [...new Set(rows.map((r) => r.group_id).filter(Boolean))] as string[];
  const cIds = rows.map((r) => r.id);

  const [profilesRes, questsRes, groupQuestsRes, groupsRes, mediasRes] = await Promise.all([
    supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', pIds),
    officialQids.length
      ? supabase.from('quests').select('*').in('id', officialQids)
      : Promise.resolve({ data: [] as { id: string }[] }),
    groupQids.length
      ? supabase.from('group_quests').select('*').in('id', groupQids)
      : Promise.resolve({ data: [] as { id: string }[] }),
    groupIds.length
      ? supabase.from('groups').select('id, name').in('id', groupIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase.from('quest_media').select('*').in('completion_id', cIds),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const questMap = new Map((questsRes.data ?? []).map((q) => [q.id, q]));
  const groupQuestMap = new Map((groupQuestsRes.data ?? []).map((gq) => [gq.id, gq]));
  const groupMap = new Map((groupsRes.data ?? []).map((g) => [g.id, g]));
  const mediaByC = new Map<string, { media_url: string; media_type: string }[]>();
  (mediasRes.data ?? []).forEach((m) => {
    const list = mediaByC.get(m.completion_id) ?? [];
    list.push(m);
    mediaByC.set(m.completion_id, list);
  });

  return rows.map((r) => ({
    ...r,
    profiles: profileMap.get(r.user_id),
    quests: r.quest_id ? questMap.get(r.quest_id) : undefined,
    group_quests: r.group_quest_id ? groupQuestMap.get(r.group_quest_id) : undefined,
    groups: r.group_id ? groupMap.get(r.group_id) : undefined,
    quest_media: mediaByC.get(r.id) ?? [],
  }));
}

export async function fetchGroupFeed(groupId: string) {
  const { data: completions, error } = await supabase
    .from('quest_completions')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'active')
    .order('completed_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const rows = completions ?? [];
  if (rows.length === 0) return [];

  const pIds = [...new Set(rows.map((r) => r.user_id))];
  const officialQids = [...new Set(rows.map((r) => r.quest_id).filter(Boolean))] as string[];
  const groupQids = [...new Set(rows.map((r) => r.group_quest_id).filter(Boolean))] as string[];
  const cIds = rows.map((r) => r.id);

  const [profilesRes, questsRes, groupQuestsRes, mediasRes] = await Promise.all([
    supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', pIds),
    officialQids.length
      ? supabase.from('quests').select('*').in('id', officialQids)
      : Promise.resolve({ data: [] as { id: string }[] }),
    groupQids.length
      ? supabase.from('group_quests').select('*').in('id', groupQids)
      : Promise.resolve({ data: [] as { id: string }[] }),
    supabase.from('quest_media').select('*').in('completion_id', cIds),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const questMap = new Map((questsRes.data ?? []).map((q) => [q.id, q]));
  const groupQuestMap = new Map((groupQuestsRes.data ?? []).map((gq) => [gq.id, gq]));
  const mediaByC = new Map<string, { media_url: string; media_type: string }[]>();
  (mediasRes.data ?? []).forEach((m) => {
    const list = mediaByC.get(m.completion_id) ?? [];
    list.push(m);
    mediaByC.set(m.completion_id, list);
  });

  return rows.map((r) => ({
    ...r,
    profiles: profileMap.get(r.user_id),
    quests: r.quest_id ? questMap.get(r.quest_id) : undefined,
    group_quests: r.group_quest_id ? groupQuestMap.get(r.group_quest_id) : undefined,
    quest_media: mediaByC.get(r.id) ?? [],
  }));
}

export async function fetchSuggestedQuest(userId: string, preferredCategories: string[]) {
  let q = supabase.from('quests').select('*').eq('is_active', true);
  if (preferredCategories.length > 0) {
    q = q.in('category', preferredCategories);
  }
  const { data, error } = await q.limit(20);
  if (error) throw error;
  const list = data ?? [];
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}
