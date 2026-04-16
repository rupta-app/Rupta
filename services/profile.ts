import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { QUEST_CATEGORIES } from '@/constants/categories';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type ProfileView = Omit<Profile, 'city' | 'status' | 'is_admin'>;

export async function fetchProfile(userId: string): Promise<ProfileView | null> {
  const { data, error } = await supabase.from('profiles').select('id, username, display_name, avatar_url, bio, date_of_birth, preferred_language, preferred_categories, activity_styles, total_aura, yearly_aura, onboarding_completed, plan, created_at, updated_at').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function searchProfiles(query: string, excludeId: string): Promise<{ id: string; username: string; display_name: string; avatar_url: string | null; total_aura: number }[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, total_aura')
    .neq('id', excludeId)
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function fetchProfileStats(userId: string): Promise<{
  questsCompleted: number;
  categoriesExplored: number;
  categoryCompletionPct: number;
  lifeListCount: number;
}> {
  const [{ data: completions }, { count: savedCount }] = await Promise.all([
    supabase
      .from('quest_completions')
      .select('id, quest_id, completed_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('quest_source_type', ['official', 'spontaneous']),
    supabase
      .from('saved_quests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  const qids = [...new Set((completions ?? []).map((c) => c.quest_id).filter(Boolean))] as string[];
  const { data: quests } = qids.length > 0
    ? await supabase.from('quests').select('id, category').in('id', qids)
    : { data: [] as { id: string; category: string }[] };

  const questMap = new Map((quests ?? []).map((q) => [q.id, q.category]));
  const cats = new Set<string>();
  (completions ?? []).forEach((c) => {
    const cat = questMap.get(c.quest_id);
    if (cat) cats.add(cat);
  });

  const totalQuestCategories = QUEST_CATEGORIES.length;

  return {
    questsCompleted: completions?.length ?? 0,
    categoriesExplored: cats.size,
    categoryCompletionPct:
      totalQuestCategories > 0 ? Math.round((cats.size / totalQuestCategories) * 100) : 0,
    lifeListCount: savedCount ?? 0,
  };
}

/** Last 7 days completion counts (index 0 = 6 days ago, 6 = today) + period totals */
export async function fetchActivityChart(userId: string): Promise<{
  buckets: number[];
  weekAura: number;
  monthAura: number;
  weekCompletions: number;
}> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  since.setHours(0, 0, 0, 0);
  const { data: rows, error } = await supabase
    .from('quest_completions')
    .select('completed_at, aura_earned')
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('quest_source_type', ['official', 'spontaneous'])
    .gte('completed_at', since.toISOString());
  if (error) throw error;
  const list = rows ?? [];
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const weekMs = 7 * 86400000;
  const monthStart = new Date(startToday.getFullYear(), startToday.getMonth(), 1);
  let weekAura = 0;
  let monthAura = 0;
  const weekCut = Date.now() - weekMs;
  for (const r of list) {
    const t = new Date(r.completed_at).getTime();
    const day = new Date(r.completed_at);
    day.setHours(0, 0, 0, 0);
    const dayDiff = Math.floor((startToday.getTime() - day.getTime()) / 86400000);
    if (dayDiff >= 0 && dayDiff < 7) {
      buckets[6 - dayDiff] += 1;
    }
    if (t >= weekCut) weekAura += r.aura_earned ?? 0;
    if (new Date(r.completed_at) >= monthStart) monthAura += r.aura_earned ?? 0;
  }
  return {
    buckets,
    weekAura,
    monthAura,
    weekCompletions: list.filter((r) => new Date(r.completed_at).getTime() >= weekCut).length,
  };
}

export async function fetchRecentCompletions(userId: string, limit = 8): Promise<{
  id: string;
  aura_earned: number;
  completed_at: string;
  quest_id: string | null;
  group_quest_id: string | null;
  quest_source_type: string;
  quests: { id: string; title_en: string; title_es: string } | undefined;
  group_quests: { id: string; title: string } | undefined;
}[]> {
  const { data: rows, error } = await supabase
    .from('quest_completions')
    .select('id, aura_earned, completed_at, quest_id, group_quest_id, quest_source_type')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('completed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const list = rows ?? [];
  if (list.length === 0) return [];
  const officialIds = [...new Set(list.map((r) => r.quest_id).filter(Boolean))] as string[];
  const groupQids = [...new Set(list.map((r) => r.group_quest_id).filter(Boolean))] as string[];
  const [{ data: quests }, { data: groupQuests }] = await Promise.all([
    officialIds.length
      ? supabase.from('quests').select('id, title_en, title_es').in('id', officialIds)
      : Promise.resolve({ data: [] as { id: string; title_en: string; title_es: string }[] }),
    groupQids.length
      ? supabase.from('group_quests').select('id, title').in('id', groupQids)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const qmap = new Map((quests ?? []).map((q) => [q.id, q]));
  const gqmap = new Map((groupQuests ?? []).map((q) => [q.id, q]));
  return list.map((r) => ({
    ...r,
    quests: r.quest_id ? qmap.get(r.quest_id) : undefined,
    group_quests: r.group_quest_id ? gqmap.get(r.group_quest_id) : undefined,
  }));
}
