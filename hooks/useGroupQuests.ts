import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createGroupQuest,
  fetchGroupQuestById,
  fetchGroupQuests,
  submitGroupQuestForOfficialReview,
  type CreateGroupQuestInput,
} from '@/services/groupQuests';
import { qk } from '@/hooks/queryKeys';

export function useGroupQuestsList(groupId: string | undefined, viewerId?: string) {
  return useQuery({
    queryKey: qk.groups.quests(groupId ?? '', viewerId),
    queryFn: () => fetchGroupQuests(groupId!, viewerId),
    enabled: Boolean(groupId),
  });
}

export function useGroupQuest(questId: string | undefined) {
  return useQuery({
    queryKey: qk.groups.groupQuest(questId ?? ''),
    queryFn: () => fetchGroupQuestById(questId!),
    enabled: Boolean(questId),
  });
}

export function useCreateGroupQuest(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ creatorId, input }: { creatorId: string; input: CreateGroupQuestInput }) =>
      createGroupQuest(groupId!, creatorId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.quests(groupId ?? '') });
    },
  });
}

export function useSubmitGroupQuestForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questId, userId }: { questId: string; userId: string }) =>
      submitGroupQuestForOfficialReview(questId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.questsAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.groupQuestAll });
    },
  });
}
