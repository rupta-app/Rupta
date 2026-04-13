import type { AchievementVisibility, Database } from '@/types/database';

import { supabase } from '@/lib/supabase';
import type { ProfileBasic } from '@/services/_profiles';
import { enrichWithProfiles, PROFILE_COLS_BASIC } from '@/services/_profiles';

type CompletionRow = Database['public']['Tables']['quest_completions']['Row'];
type CommentRow = Database['public']['Tables']['comments']['Row'];

function parseOptionalRating(raw: number | null | undefined): number | null {
  if (raw == null) return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error('Rating must be a number between 1 and 5');
  }
  const r = Math.round(n);
  if (r < 1 || r > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  return r;
}

async function insertMediaAndParticipants(
  completionId: string,
  userId: string,
  mediaUrl: string,
  participantIds: string[],
) {
  const { error: mErr } = await supabase.from('quest_media').insert({
    completion_id: completionId,
    media_url: mediaUrl,
    media_type: 'photo',
    order_index: 0,
  });
  if (mErr) throw mErr;

  for (const uid of participantIds) {
    if (uid === userId) continue;
    const { error: pErr } = await supabase.from('completion_participants').insert({
      completion_id: completionId,
      user_id: uid,
    });
    if (pErr) throw pErr;
  }
}

export async function createCompletion(payload: {
  userId: string;
  questId: string;
  caption?: string | null;
  rating?: number | null;
  mediaUrl: string;
  participantIds: string[];
  groupId?: string | null;
  challengeId?: string | null;
  visibility?: AchievementVisibility;
}): Promise<CompletionRow> {
  const rating = parseOptionalRating(payload.rating ?? null);
  const { data: completion, error: cErr } = await supabase
    .from('quest_completions')
    .insert({
      user_id: payload.userId,
      quest_id: payload.questId,
      quest_source_type: 'official',
      group_quest_id: null,
      group_id: payload.groupId ?? null,
      challenge_id: payload.challengeId ?? null,
      visibility: payload.visibility ?? 'public',
      aura_scope: 'official',
      caption: payload.caption ?? null,
      rating,
      status: 'active',
    })
    .select()
    .single();

  if (cErr) throw cErr;

  await insertMediaAndParticipants(completion.id, payload.userId, payload.mediaUrl, payload.participantIds);
  return completion;
}

export async function createGroupQuestCompletion(payload: {
  userId: string;
  groupQuestId: string;
  groupId: string;
  caption?: string | null;
  rating?: number | null;
  mediaUrl: string;
  participantIds: string[];
  challengeId?: string | null;
  visibility?: AchievementVisibility;
}): Promise<CompletionRow> {
  const rating = parseOptionalRating(payload.rating ?? null);
  const { data: completion, error: cErr } = await supabase
    .from('quest_completions')
    .insert({
      user_id: payload.userId,
      quest_id: null,
      group_quest_id: payload.groupQuestId,
      group_id: payload.groupId,
      challenge_id: payload.challengeId ?? null,
      quest_source_type: 'group',
      visibility: payload.visibility ?? 'group',
      aura_scope: 'group',
      caption: payload.caption ?? null,
      rating,
      status: 'active',
    })
    .select()
    .single();

  if (cErr) throw cErr;

  await insertMediaAndParticipants(completion.id, payload.userId, payload.mediaUrl, payload.participantIds);
  return completion;
}

const SPONT_TITLE_MIN = 3;
const SPONT_TITLE_MAX = 200;

export async function createSpontaneousCompletion(payload: {
  userId: string;
  title: string;
  suggestedAura: number;
  caption?: string | null;
  rating?: number | null;
  mediaUrl: string;
  participantIds: string[];
  visibility?: AchievementVisibility;
}): Promise<CompletionRow> {
  const title = payload.title.trim();
  if (title.length < SPONT_TITLE_MIN) {
    throw new Error('Title too short');
  }
  if (title.length > SPONT_TITLE_MAX) {
    throw new Error('Title too long');
  }
  const auraReward = Math.min(500, Math.max(1, Math.round(Number(payload.suggestedAura)) || 1));
  const rating = parseOptionalRating(payload.rating ?? null);

  const { data: quest, error: qErr } = await supabase
    .from('quests')
    .insert({
      title_en: title,
      title_es: title,
      description_en: '',
      description_es: '',
      category: 'random',
      aura_reward: auraReward,
      difficulty: 'easy',
      repeatability_type: 'once',
      max_completions_per_user: 1,
      repeat_interval: null,
      proof_type: 'photo',
      cost_range: 'free',
      location_type: 'any',
      is_active: true,
      is_spontaneous: true,
      created_by: payload.userId,
      spontaneous_review_status: 'pending_catalog',
    })
    .select()
    .single();

  if (qErr) throw qErr;

  const { data: completion, error: cErr } = await supabase
    .from('quest_completions')
    .insert({
      user_id: payload.userId,
      quest_id: quest.id,
      quest_source_type: 'spontaneous',
      group_quest_id: null,
      group_id: null,
      challenge_id: null,
      visibility: payload.visibility ?? 'public',
      aura_scope: 'official',
      caption: payload.caption ?? null,
      rating,
      status: 'active',
    })
    .select()
    .single();

  if (cErr) {
    await supabase.from('quests').delete().eq('id', quest.id);
    throw cErr;
  }

  await insertMediaAndParticipants(completion.id, payload.userId, payload.mediaUrl, payload.participantIds);
  return completion;
}

export async function deleteCompletion(completionId: string): Promise<void> {
  const { error } = await supabase.from('quest_completions').delete().eq('id', completionId);
  if (error) throw error;
}

export async function fetchCompletionById(id: string): Promise<CompletionRow & {
  profiles: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
  quests: Database['public']['Tables']['quests']['Row'] | null;
  group_quests: Database['public']['Tables']['group_quests']['Row'] | null;
  groups: { id: string; name: string } | null;
  quest_media: Database['public']['Tables']['quest_media']['Row'][];
}> {
  const { data: row, error } = await supabase.from('quest_completions').select('*').eq('id', id).single();
  if (error) throw error;

  const isGroup = row.quest_source_type === 'group' && row.group_quest_id;

  const [{ data: profile }, questResult, gqResult, groupResult, { data: media }] = await Promise.all([
    supabase.from('profiles').select('id, username, display_name, avatar_url').eq('id', row.user_id).single(),
    row.quest_id
      ? supabase.from('quests').select('*').eq('id', row.quest_id).maybeSingle()
      : Promise.resolve({ data: null }),
    isGroup && row.group_quest_id
      ? supabase.from('group_quests').select('*').eq('id', row.group_quest_id).maybeSingle()
      : Promise.resolve({ data: null }),
    row.group_id
      ? supabase.from('groups').select('id, name').eq('id', row.group_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('quest_media').select('*').eq('completion_id', id).order('order_index'),
  ]);

  return {
    ...row,
    profiles: profile,
    quests: questResult.data,
    group_quests: gqResult.data,
    groups: groupResult.data,
    quest_media: media ?? [],
  };
}

export async function fetchCompletionCounts(completionIds: string[]): Promise<Map<string, { respects: number; comments: number }>> {
  if (completionIds.length === 0) return new Map<string, { respects: number; comments: number }>();
  const { data: reacts } = await supabase.from('reactions').select('completion_id').in('completion_id', completionIds);
  const { data: coms } = await supabase.from('comments').select('completion_id').in('completion_id', completionIds);
  const map = new Map<string, { respects: number; comments: number }>();
  completionIds.forEach((id) => map.set(id, { respects: 0, comments: 0 }));
  (reacts ?? []).forEach((r) => {
    const cur = map.get(r.completion_id)!;
    map.set(r.completion_id, { ...cur, respects: cur.respects + 1 });
  });
  (coms ?? []).forEach((r) => {
    const cur = map.get(r.completion_id)!;
    map.set(r.completion_id, { ...cur, comments: cur.comments + 1 });
  });
  return map;
}

export async function userGaveRespect(completionId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('reactions')
    .select('id')
    .eq('completion_id', completionId)
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}

export async function toggleRespect(completionId: string, userId: string, has: boolean): Promise<void> {
  if (has) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('completion_id', completionId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('reactions').insert({ completion_id: completionId, user_id: userId });
    if (error) throw error;
  }
}

export async function fetchComments(completionId: string): Promise<(CommentRow & { profiles: ProfileBasic | undefined })[]> {
  const { data: rows, error } = await supabase
    .from('comments')
    .select('*')
    .eq('completion_id', completionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const list = rows ?? [];
  if (list.length === 0) return [];
  return enrichWithProfiles(list, 'user_id', PROFILE_COLS_BASIC);
}

export async function addComment(completionId: string, userId: string, content: string): Promise<CommentRow> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ completion_id: completionId, user_id: userId, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}
