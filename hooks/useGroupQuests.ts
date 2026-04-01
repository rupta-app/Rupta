import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createGroupQuest,
  fetchGroupQuestById,
  fetchGroupQuests,
  submitGroupQuestForOfficialReview,
  type CreateGroupQuestInput,
} from '@/services/groupQuests';

export function useGroupQuestsList(groupId: string | undefined, viewerId?: string) {
  return useQuery({
    queryKey: ['group-quests', groupId, viewerId],
    queryFn: () => fetchGroupQuests(groupId!, viewerId),
    enabled: Boolean(groupId),
  });
}

export function useGroupQuest(questId: string | undefined) {
  return useQuery({
    queryKey: ['group-quest', questId],
    queryFn: () => fetchGroupQuestById(questId!),
    enabled: Boolean(questId),
  });
}

export function useCreateGroupQuest(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ creatorId, input }: { creatorId: string; input: CreateGroupQuestInput }) =>
      createGroupQuest(groupId!, creatorId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['group-quests', groupId] });
    },
  });
}

export function useSubmitGroupQuestForReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questId, userId }: { questId: string; userId: string }) =>
      submitGroupQuestForOfficialReview(questId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['group-quests'] });
      void qc.invalidateQueries({ queryKey: ['group-quest'] });
    },
  });
}
