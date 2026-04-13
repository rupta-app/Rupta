import { adminClient } from '@/lib/supabaseAdmin';
import { normalizeJoin } from '@/lib/utils';

export interface AdminSpontaneousQuest {
  id: string;
  title_en: string | null;
  title_es: string | null;
  description_en: string | null;
  description_es: string | null;
  category: string | null;
  difficulty: string | null;
  aura_reward: number;
  spontaneous_review_status: string;
  created_at: string;
  created_by: string | null;
  creator: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    total_aura: number;
    created_at: string;
  } | null;
  completion: {
    id: string;
    caption: string | null;
    rating: number | null;
    aura_earned: number;
    completed_at: string;
    media: {
      id: string;
      media_url: string;
      media_type: string;
    }[];
  } | null;
}

interface FetchSpontaneousParams {
  reviewStatus?: string;
  page: number;
  pageSize: number;
}

export async function fetchSpontaneousQuests({ reviewStatus, page, pageSize }: FetchSpontaneousParams) {
  let query = adminClient
    .from('quests')
    .select(
      `
      id, title_en, title_es, description_en, description_es,
      category, difficulty, aura_reward, spontaneous_review_status,
      created_at, created_by,
      creator:profiles!quests_created_by_fkey(display_name, username, avatar_url, total_aura, created_at),
      completion:quest_completions(
        id, caption, rating, aura_earned, completed_at,
        media:quest_media(id, media_url, media_type)
      )
    `,
      { count: 'exact' },
    )
    .eq('is_spontaneous', true);

  if (reviewStatus) {
    query = query.eq('spontaneous_review_status', reviewStatus);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;

  const flattened = (data ?? []).map((q) => {
    const completion = normalizeJoin(q.completion);
    return {
      ...q,
      creator: normalizeJoin(q.creator),
      completion: completion
        ? { ...completion, media: Array.isArray(completion.media) ? completion.media : [] }
        : null,
    };
  }) as AdminSpontaneousQuest[];

  return { data: flattened, total: count ?? 0 };
}

export async function approveSpontaneous(questId: string, completionId: string, auraAmount: number) {
  // Update quest: promote to official catalog
  const { error: questError } = await adminClient
    .from('quests')
    .update({
      spontaneous_review_status: 'promoted',
      is_spontaneous: false,
    })
    .eq('id', questId);
  if (questError) throw questError;

  // Update completion: set aura_earned and source type
  // The apply_completion_aura_earned_delta trigger handles awarding aura
  const { error: completionError } = await adminClient
    .from('quest_completions')
    .update({
      aura_earned: auraAmount,
      quest_source_type: 'official',
    })
    .eq('id', completionId);
  if (completionError) throw completionError;
}

export async function rejectSpontaneous(questId: string) {
  const { error } = await adminClient
    .from('quests')
    .update({ spontaneous_review_status: 'rejected' })
    .eq('id', questId);
  if (error) throw error;
}
