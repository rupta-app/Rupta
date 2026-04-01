import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type QuestRow = Database['public']['Tables']['quests']['Row'];

export type QuestFilters = {
  category?: string;
  difficulty?: string;
  cost_range?: string;
  location_type?: string;
  search?: string;
};

export async function fetchQuests(filters: QuestFilters = {}) {
  let q = supabase.from('quests').select('*').eq('is_active', true);

  if (filters.category) q = q.eq('category', filters.category);
  if (filters.difficulty) q = q.eq('difficulty', filters.difficulty);
  if (filters.cost_range) q = q.eq('cost_range', filters.cost_range);
  if (filters.location_type) q = q.eq('location_type', filters.location_type);
  if (filters.search?.trim()) {
    const s = filters.search.trim();
    q = q.or(`title_en.ilike.%${s}%,title_es.ilike.%${s}%,description_en.ilike.%${s}%`);
  }

  const { data, error } = await q.order('aura_reward', { ascending: true });
  if (error) throw error;
  return (data ?? []) as QuestRow[];
}

export async function fetchQuestById(id: string) {
  const { data, error } = await supabase.from('quests').select('*').eq('id', id).single();
  if (error) throw error;
  return data as QuestRow;
}

export async function fetchSavedQuestIds(userId: string) {
  const { data, error } = await supabase.from('saved_quests').select('quest_id').eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.quest_id));
}

export async function toggleSavedQuest(userId: string, questId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase.from('saved_quests').delete().eq('user_id', userId).eq('quest_id', questId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('saved_quests').insert({ user_id: userId, quest_id: questId });
    if (error) throw error;
  }
}

/** Active official completions per quest (for caps / Life List progress). */
export async function fetchOfficialCompletionCountsByQuestIds(userId: string, questIds: string[]) {
  const map = new Map<string, number>();
  if (questIds.length === 0) return map;
  const { data, error } = await supabase
    .from('quest_completions')
    .select('quest_id')
    .eq('user_id', userId)
    .eq('quest_source_type', 'official')
    .eq('status', 'active')
    .in('quest_id', questIds);
  if (error) throw error;
  for (const row of data ?? []) {
    const qid = row.quest_id as string;
    map.set(qid, (map.get(qid) ?? 0) + 1);
  }
  return map;
}

export async function fetchOfficialCompletionCountForQuest(userId: string, questId: string) {
  const { count, error } = await supabase
    .from('quest_completions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .eq('quest_source_type', 'official')
    .eq('status', 'active');
  if (error) throw error;
  return count ?? 0;
}

export async function fetchLifeListQuests(userId: string) {
  const { data: saved, error } = await supabase
    .from('saved_quests')
    .select('quest_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const list = saved ?? [];
  if (list.length === 0) return [];
  const qids = list.map((s) => s.quest_id);
  const { data: quests } = await supabase.from('quests').select('*').in('id', qids);
  const qmap = new Map((quests ?? []).map((q) => [q.id, q]));
  return list.map((s) => ({ ...s, quests: qmap.get(s.quest_id) }));
}
