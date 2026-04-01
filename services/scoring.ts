import type { AuraScope, ChallengeScoringMode, QuestSourceType } from '@/types/database';

import { supabase } from '@/lib/supabase';

/** Derive aura scope from quest source (official completions always use official profile AURA). */
export function auraScopeForQuestSource(questSourceType: QuestSourceType): AuraScope {
  return questSourceType === 'group' ? 'group' : 'official';
}

/** Whether a completion should increment challenge score given challenge rules. */
export function completionCountsForChallengeMode(
  scoringMode: ChallengeScoringMode,
  auraScope: AuraScope,
): boolean {
  if (scoringMode === 'mixed') return true;
  if (scoringMode === 'official_only') return auraScope === 'official';
  if (scoringMode === 'group_only') return auraScope === 'group';
  return false;
}

export async function getGroupMemberScore(groupId: string, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('group_member_scores')
    .select('total_group_aura')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.total_group_aura ?? 0;
}

export async function getChallengeScore(challengeId: string, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('challenge_scores')
    .select('score')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.score ?? 0;
}
