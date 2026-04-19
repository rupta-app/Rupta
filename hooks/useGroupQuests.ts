import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  activateDraftQuest,
  createGroupQuest,
  deleteGroupQuest,
  fetchGroupQuestWithCreator,
  fetchGroupQuests,
  submitGroupQuestForOfficialReview,
  type CreateGroupQuestInput,
} from '@/services/groupQuests';
import { qk } from '@/hooks/queryKeys';

export function useGroupQuestsList(
  groupId: string | undefined,
  viewerId?: string,
  viewerIsAdmin?: boolean,
) {
  return useQuery({
    queryKey: qk.groups.quests(groupId ?? '', viewerId, viewerIsAdmin),
    queryFn: () => fetchGroupQuests(groupId!, viewerId, viewerIsAdmin),
    enabled: Boolean(groupId),
  });
}

export function useGroupQuest(questId: string | undefined) {
  return useQuery({
    queryKey: qk.groups.groupQuest(questId ?? ''),
    queryFn: () => fetchGroupQuestWithCreator(questId!),
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

export function useActivateDraftQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      adminUserId,
      groupId,
    }: {
      questId: string;
      adminUserId: string;
      groupId: string;
    }) => activateDraftQuest(questId, adminUserId, groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.questsAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.groupQuestAll });
    },
  });
}

export function useDeleteGroupQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      adminUserId,
      groupId,
    }: {
      questId: string;
      adminUserId: string;
      groupId: string;
    }) => deleteGroupQuest(questId, adminUserId, groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.questsAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.groupQuestAll });
    },
  });
}
