import type { AchievementVisibility, Database, GroupQuestStatus, QuestCreationRule } from '@/types/database';

import { supabase } from '@/lib/supabase';
import { fetchProfilesByIds, type ProfileBasic } from '@/services/_profiles';

type GroupQuestRow = Database['public']['Tables']['group_quests']['Row'];
export type GroupQuestWithCreator = GroupQuestRow & { creator: ProfileBasic | undefined };

export type CreateGroupQuestInput = {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  auraReward: number;
  category?: string | null;
  proofType: 'photo' | 'video' | 'either';
  repeatabilityType: 'once' | 'limited' | 'repeatable';
  maxCompletionsPerUser?: number | null;
  repeatInterval?: 'weekly' | 'monthly' | 'yearly' | null;
  visibility: 'group_only' | 'public';
};

async function fetchMemberRole(
  groupId: string,
  userId: string,
): Promise<'owner' | 'admin' | 'member' | null> {
  const { data, error } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.role as 'owner' | 'admin' | 'member') ?? null;
}

async function fetchQuestCreationRule(groupId: string): Promise<QuestCreationRule> {
  const { data, error } = await supabase
    .from('group_settings')
    .select('quest_creation_rule')
    .eq('group_id', groupId)
    .maybeSingle();
  if (error) throw error;
  return (data?.quest_creation_rule as QuestCreationRule) ?? 'anyone';
}

function canCreateQuestByRule(
  rule: QuestCreationRule,
  role: 'owner' | 'admin' | 'member' | null,
): { allowed: boolean; needsDraft: boolean } {
  if (!role) return { allowed: false, needsDraft: false };
  if (rule === 'anyone') return { allowed: true, needsDraft: false };
  if (rule === 'admin_only') {
    return { allowed: role === 'owner' || role === 'admin', needsDraft: false };
  }
  if (rule === 'admin_approval') {
    if (role === 'owner' || role === 'admin') return { allowed: true, needsDraft: false };
    return { allowed: true, needsDraft: true };
  }
  return { allowed: false, needsDraft: false };
}

export async function createGroupQuest(
  groupId: string,
  creatorId: string,
  input: CreateGroupQuestInput,
): Promise<GroupQuestRow> {
  const [rule, role] = await Promise.all([
    fetchQuestCreationRule(groupId),
    fetchMemberRole(groupId, creatorId),
  ]);
  const { allowed, needsDraft } = canCreateQuestByRule(rule, role);
  if (!allowed) throw new Error('You cannot create quests in this group');

  const status: GroupQuestStatus = needsDraft ? 'draft' : 'active';

  const { data, error } = await supabase
    .from('group_quests')
    .insert({
      group_id: groupId,
      creator_id: creatorId,
      title: input.title,
      description: input.description ?? null,
      image_url: input.imageUrl ?? null,
      aura_reward: input.auraReward,
      category: input.category ?? null,
      proof_type: input.proofType,
      repeatability_type: input.repeatabilityType,
      max_completions_per_user: input.maxCompletionsPerUser ?? null,
      repeat_interval: input.repeatInterval ?? null,
      visibility: input.visibility,
      status,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchGroupQuests(
  groupId: string,
  includeDraftsForUserId?: string,
  viewerIsAdmin?: boolean,
): Promise<GroupQuestRow[]> {
  let q = supabase
    .from('group_quests')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (!viewerIsAdmin && !includeDraftsForUserId) {
    q = q.in('status', ['active', 'submitted_for_review']);
  }

  const { data, error } = await q;
  if (error) throw error;
  const rows = data ?? [];

  if (viewerIsAdmin) return rows;
  if (includeDraftsForUserId) {
    return rows.filter(
      (r) =>
        r.status === 'active' ||
        r.status === 'submitted_for_review' ||
        (r.status === 'draft' && r.creator_id === includeDraftsForUserId),
    );
  }
  return rows;
}

export async function fetchGroupQuestById(id: string): Promise<GroupQuestRow> {
  const { data, error } = await supabase.from('group_quests').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Group quest not found or access denied');
  return data;
}

export async function fetchGroupQuestWithCreator(id: string): Promise<GroupQuestWithCreator> {
  const row = await fetchGroupQuestById(id);
  const [creator] = await fetchProfilesByIds([row.creator_id]);
  return { ...row, creator: creator as ProfileBasic | undefined };
}

export async function updateGroupQuestStatus(id: string, status: GroupQuestStatus): Promise<GroupQuestRow> {
  const { data, error } = await supabase.from('group_quests').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function submitGroupQuestForOfficialReview(questId: string, userId: string): Promise<GroupQuestRow> {
  const row = await fetchGroupQuestById(questId);
  if (row.creator_id !== userId) throw new Error('Only the creator can submit for review');
  if (row.status !== 'active') throw new Error('Quest must be active to submit');
  return updateGroupQuestStatus(questId, 'submitted_for_review');
}

export async function activateDraftQuest(questId: string, adminUserId: string, groupId: string): Promise<GroupQuestRow> {
  const role = await fetchMemberRole(groupId, adminUserId);
  if (role !== 'owner' && role !== 'admin') throw new Error('Not allowed');
  const row = await fetchGroupQuestById(questId);
  if (row.group_id !== groupId) throw new Error('Wrong group');
  if (row.status !== 'draft') throw new Error('Not a draft');
  return updateGroupQuestStatus(questId, 'active');
}

export async function deleteGroupQuest(questId: string, adminUserId: string, groupId: string): Promise<void> {
  const role = await fetchMemberRole(groupId, adminUserId);
  if (role !== 'owner' && role !== 'admin') throw new Error('Not allowed');
  const { error } = await supabase.from('group_quests').delete().eq('id', questId);
  if (error) throw error;
}
