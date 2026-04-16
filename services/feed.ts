import type { Database } from '@/types/database';

import { supabase } from '@/lib/supabase';

type QuestRow = Database['public']['Tables']['quests']['Row'];

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

export async function fetchBlockedIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.blocked_id));
}

export type HomeFeedFilter = 'all' | 'official' | 'unofficial';

type FeedViewRow = {
  id: string;
  user_id: string;
  quest_id: string | null;
  group_quest_id: string | null;
  group_id: string | null;
  quest_source_type: string;
  status: string;
  visibility: string;
  aura_earned: number;
  caption: string | null;
  completed_at: string;
  profile_username: string;
  profile_display_name: string;
  profile_avatar_url: string | null;
  quest_title_en: string | null;
  quest_title_es: string | null;
  quest_category: string | null;
  group_quest_title: string | null;
  group_name: string | null;
  media_url: string | null;
};

export type FeedPost = ReturnType<typeof mapViewRow>;

function mapViewRow(r: FeedViewRow) {
  return {
    id: r.id,
    user_id: r.user_id,
    quest_id: r.quest_id,
    group_quest_id: r.group_quest_id,
    group_id: r.group_id,
    quest_source_type: r.quest_source_type,
    aura_earned: r.aura_earned,
    caption: r.caption,
    completed_at: r.completed_at,
    visibility: r.visibility,
    profiles: {
      username: r.profile_username,
      display_name: r.profile_display_name,
      avatar_url: r.profile_avatar_url,
    },
    quests: r.quest_title_en
      ? { title_en: r.quest_title_en, title_es: r.quest_title_es!, category: r.quest_category! }
      : undefined,
    group_quests: r.group_quest_title ? { title: r.group_quest_title } : undefined,
    groups: r.group_name && r.group_id ? { id: r.group_id, name: r.group_name } : undefined,
    quest_media: r.media_url ? [{ media_url: r.media_url }] : [],
  };
}

export const FEED_PAGE_SIZE = 10;

export async function fetchHomeFeed(
  userId: string,
  friendIds: string[],
  filter: HomeFeedFilter = 'all',
  limit = FEED_PAGE_SIZE,
  offset = 0,
): Promise<{ posts: FeedPost[]; hasMore: boolean }> {
  const blocked = await fetchBlockedIds(userId);
  const ids = [...friendIds, userId].filter((id) => !blocked.has(id));
  if (ids.length === 0) return { posts: [], hasMore: false };

  let q = supabase
    .from('feed_completions_enriched' as 'quest_completions')
    .select('*')
    .in('user_id', ids)
    .eq('status', 'active')
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit);

  if (filter === 'official') {
    q = q.eq('quest_source_type', 'official');
  } else if (filter === 'unofficial') {
    q = q.or('quest_source_type.eq.group,quest_source_type.eq.spontaneous').in('visibility', ['public', 'friends']);
  }

  const { data: rows, error } = await q;
  if (error) throw error;
  const all = (rows ?? []) as unknown as FeedViewRow[];
  const hasMore = all.length > limit;
  const page = hasMore ? all.slice(0, limit) : all;
  return { posts: page.map(mapViewRow), hasMore };
}

export async function fetchGroupFeed(
  groupId: string,
  page = 0,
  pageSize = FEED_PAGE_SIZE,
): Promise<{ posts: FeedPost[]; hasMore: boolean }> {
  const from = page * pageSize;
  const { data: rows, error } = await supabase
    .from('feed_completions_enriched' as 'quest_completions')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'active')
    .order('completed_at', { ascending: false })
    .range(from, from + pageSize);
  if (error) throw error;
  const all = ((rows ?? []) as unknown as FeedViewRow[]);
  const hasMore = all.length > pageSize;
  const page_ = hasMore ? all.slice(0, pageSize) : all;
  return { posts: page_.map(mapViewRow), hasMore };
}

export async function fetchSuggestedQuest(userId: string, preferredCategories: string[]): Promise<QuestRow | null> {
  const catalogBase = () =>
    supabase.from('quests').select('*').eq('is_active', true).eq('is_spontaneous', false);

  let q = catalogBase();
  if (preferredCategories.length > 0) {
    q = q.in('category', preferredCategories);
  }
  const { data, error } = await q.limit(20);
  if (error) throw error;
  let list = data ?? [];

  if (list.length === 0 && preferredCategories.length > 0) {
    const { data: fallback, error: err2 } = await catalogBase().limit(20);
    if (err2) throw err2;
    list = fallback ?? [];
  }

  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}
