import type { ChallengeScoringMode, ChallengeStatus } from '@/types/database';

import { supabase } from '@/lib/supabase';

export type CreateChallengeInput = {
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  prizeDescription?: string | null;
  scoringMode: ChallengeScoringMode;
};

export async function createChallenge(groupId: string, creatorId: string, input: CreateChallengeInput) {
  const { data, error } = await supabase
    .from('group_challenges')
    .insert({
      group_id: groupId,
      creator_id: creatorId,
      title: input.title,
      description: input.description ?? null,
      start_date: input.startDate,
      end_date: input.endDate,
      prize_description: input.prizeDescription ?? null,
      scoring_mode: input.scoringMode,
      status: 'active',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchGroupChallenges(groupId: string) {
  const { data, error } = await supabase
    .from('group_challenges')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchChallengeById(challengeId: string) {
  const { data, error } = await supabase.from('group_challenges').select('*').eq('id', challengeId).single();
  if (error) throw error;
  return data;
}

export async function fetchChallengeLeaderboard(challengeId: string, limit = 50) {
  const { data: scores, error } = await supabase
    .from('challenge_scores')
    .select('user_id, score')
    .eq('challenge_id', challengeId)
    .order('score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const list = scores ?? [];
  if (list.length === 0) return [];
  const uids = [...new Set(list.map((s) => s.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', uids);
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return list.map((s) => ({ ...s, profiles: pmap.get(s.user_id) }));
}

export async function countActiveChallengesInGroup(groupId: string): Promise<number> {
  const { count, error } = await supabase
    .from('group_challenges')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('status', 'active');
  if (error) throw error;
  return count ?? 0;
}

export async function updateChallengeStatus(challengeId: string, status: ChallengeStatus) {
  const { data, error } = await supabase
    .from('group_challenges')
    .update({ status })
    .eq('id', challengeId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeChallenge(challengeId: string) {
  return updateChallengeStatus(challengeId, 'completed');
}
