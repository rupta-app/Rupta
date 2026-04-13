import { adminClient } from '@/lib/supabaseAdmin';
import { normalizeJoin } from '@/lib/utils';

export interface AdminCompletion {
  id: string;
  user_id: string;
  quest_id: string | null;
  group_quest_id: string | null;
  quest_source_type: string;
  status: string;
  aura_earned: number;
  aura_scope: string;
  caption: string | null;
  rating: number | null;
  visibility: string;
  completed_at: string;
  created_at: string;
  group_id: string | null;
  challenge_id: string | null;
  profile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  quest: {
    title_en: string | null;
    title_es: string | null;
    category: string | null;
    difficulty: string | null;
    aura_reward: number | null;
  } | null;
  media: {
    id: string;
    media_url: string;
    media_type: string;
  }[];
}

interface FetchCompletionsParams {
  status?: string;
  sourceType?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export async function fetchCompletions({ status, sourceType, search, page, pageSize }: FetchCompletionsParams) {
  let query = adminClient
    .from('quest_completions')
    .select(
      `
      id, user_id, quest_id, group_quest_id, quest_source_type, status,
      aura_earned, aura_scope, caption, rating, visibility, completed_at, created_at,
      group_id, challenge_id,
      profile:profiles!quest_completions_user_id_fkey(display_name, username, avatar_url),
      quest:quests(title_en, title_es, category, difficulty, aura_reward),
      media:quest_media(id, media_url, media_type)
    `,
      { count: 'exact' },
    );

  if (status) {
    query = query.eq('status', status);
  }
  if (sourceType) {
    query = query.eq('quest_source_type', sourceType);
  }
  if (search) {
    query = query.ilike('caption', `%${search}%`);
  }

  const { data, error, count } = await query
    .order('completed_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;

  const normalized = (data ?? []).map((row) => ({
    ...row,
    profile: normalizeJoin(row.profile),
    quest: normalizeJoin(row.quest),
    media: Array.isArray(row.media) ? row.media : [],
  })) as AdminCompletion[];

  return { data: normalized, total: count ?? 0 };
}

export async function updateCompletionStatus(completionId: string, status: string) {
  const { error } = await adminClient
    .from('quest_completions')
    .update({ status })
    .eq('id', completionId);
  if (error) throw error;
}

export async function fetchCompletionsByUser(userId: string, limit = 10) {
  const { data, error } = await adminClient
    .from('quest_completions')
    .select(
      `
      id, quest_source_type, status, aura_earned, completed_at, caption,
      quest:quests(title_en, title_es),
      media:quest_media(id, media_url, media_type)
    `,
    )
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function fetchReportsForCompletion(completionId: string) {
  const { data, error } = await adminClient
    .from('reports')
    .select('id, reason, status, description, created_at, reporter:profiles!reports_reporter_id_fkey(display_name, username)')
    .eq('completion_id', completionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
