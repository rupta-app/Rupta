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

export async function fetchHomeFeed(userId: string, friendIds: string[]) {
  const blocked = await fetchBlockedIds(userId);
  const ids = [...friendIds, userId].filter((id) => !blocked.has(id));
  if (ids.length === 0) return [];

  const { data: completions, error } = await supabase
    .from('quest_completions')
    .select('*')
    .in('user_id', ids)
    .eq('status', 'active')
    .order('completed_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const rows = (completions ?? []).filter((r) => !blocked.has(r.user_id as string));
  if (rows.length === 0) return [];

  const pIds = [...new Set(rows.map((r) => r.user_id))];
  const qIds = [...new Set(rows.map((r) => r.quest_id))];
  const cIds = rows.map((r) => r.id);

  const [{ data: profiles }, { data: quests }, { data: medias }] = await Promise.all([
    supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', pIds),
    supabase.from('quests').select('*').in('id', qIds),
    supabase.from('quest_media').select('*').in('completion_id', cIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const questMap = new Map((quests ?? []).map((q) => [q.id, q]));
  const mediaByC = new Map<string, { media_url: string; media_type: string }[]>();
  (medias ?? []).forEach((m) => {
    const list = mediaByC.get(m.completion_id) ?? [];
    list.push(m);
    mediaByC.set(m.completion_id, list);
  });

  return rows.map((r) => ({
    ...r,
    profiles: profileMap.get(r.user_id),
    quests: questMap.get(r.quest_id),
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
