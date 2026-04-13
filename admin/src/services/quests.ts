import { adminClient } from '@/lib/supabaseAdmin';

export interface AdminQuest {
  id: string;
  title_en: string;
  title_es: string;
  description_en: string;
  description_es: string;
  category: string;
  aura_reward: number;
  difficulty: string;
  repeatability_type: string;
  max_completions_per_user: number | null;
  repeat_interval: string | null;
  proof_type: string;
  cost_range: string;
  location_type: string;
  is_active: boolean;
  is_spontaneous: boolean;
  spontaneous_review_status: string | null;
  created_by: string | null;
  created_at: string;
}

export interface QuestFormData {
  title_en: string;
  title_es: string;
  description_en: string;
  description_es: string;
  category: string;
  aura_reward: number;
  difficulty: string;
  repeatability_type: string;
  max_completions_per_user: number | null;
  repeat_interval: string | null;
  proof_type: string;
  cost_range: string;
  location_type: string;
  is_active: boolean;
}

interface FetchQuestsParams {
  search?: string;
  category?: string;
  difficulty?: string;
  isActive?: string;
  page: number;
  pageSize: number;
}

export async function fetchQuests({ search, category, difficulty, isActive, page, pageSize }: FetchQuestsParams) {
  let query = adminClient
    .from('quests')
    .select('*', { count: 'exact' })
    .eq('is_spontaneous', false);

  if (search) {
    query = query.or(`title_en.ilike.%${search}%,title_es.ilike.%${search}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }
  if (isActive === 'true') {
    query = query.eq('is_active', true);
  } else if (isActive === 'false') {
    query = query.eq('is_active', false);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return { data: (data ?? []) as AdminQuest[], total: count ?? 0 };
}

export async function createQuest(quest: QuestFormData) {
  const { error } = await adminClient.from('quests').insert(quest);
  if (error) throw error;
}

export async function updateQuest(questId: string, fields: Partial<QuestFormData>) {
  const { error } = await adminClient.from('quests').update(fields).eq('id', questId);
  if (error) throw error;
}

export async function deleteQuest(questId: string) {
  const { error } = await adminClient.from('quests').delete().eq('id', questId);
  if (error) throw error;
}
