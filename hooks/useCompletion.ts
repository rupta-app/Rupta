import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addComment,
  createCompletion,
  createGroupQuestCompletion,
  createSpontaneousCompletion,
  deleteCompletion,
  fetchComments,
  fetchCompletionById,
  fetchCompletionCounts,
  toggleRespect,
  userGaveRespect,
} from '@/services/completions';
import { invalidateCompletionRelated, qk } from '@/hooks/queryKeys';

export function useCompletion(id: string | undefined) {
  return useQuery({
    queryKey: qk.completions.detail(id ?? ''),
    queryFn: () => fetchCompletionById(id!),
    enabled: Boolean(id),
  });
}

export function useCompletionSocial(completionId: string, userId: string | undefined) {
  return useQuery({
    queryKey: qk.completions.social(completionId, userId),
    queryFn: async () => {
      const counts = await fetchCompletionCounts([completionId]);
      const gave = userId ? await userGaveRespect(completionId, userId) : false;
      return { counts: counts.get(completionId)!, gaveRespect: gave };
    },
    enabled: Boolean(completionId),
  });
}

export function useComments(completionId: string) {
  return useQuery({
    queryKey: qk.completions.comments(completionId),
    queryFn: () => fetchComments(completionId),
    enabled: Boolean(completionId),
  });
}

export function useToggleRespect(completionId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ has }: { has: boolean }) => {
      if (!userId) throw new Error('No user');
      await toggleRespect(completionId, userId, has);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.completions.socialAll });
      void queryClient.invalidateQueries({ queryKey: qk.feed.all });
    },
  });
}

export function useAddComment(completionId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!userId) throw new Error('No user');
      return addComment(completionId, userId, content);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.completions.comments(completionId) });
    },
  });
}

export function useCreateCompletion(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompletion,
    onSuccess: () => {
      invalidateCompletionRelated(queryClient, userId);
    },
  });
}

export function useCreateSpontaneousCompletion(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSpontaneousCompletion,
    onSuccess: () => {
      invalidateCompletionRelated(queryClient, userId);
    },
  });
}

export function useCreateGroupQuestCompletion(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroupQuestCompletion,
    onSuccess: () => {
      invalidateCompletionRelated(queryClient, userId);
      void queryClient.invalidateQueries({ queryKey: qk.groups.questsAll });
    },
  });
}

export function useDeleteCompletion(completionId: string, ownerUserId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteCompletion(completionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.completions.detail(completionId) });
      void queryClient.invalidateQueries({ queryKey: qk.completions.comments(completionId) });
      invalidateCompletionRelated(queryClient, ownerUserId);
      void queryClient.invalidateQueries({ queryKey: qk.groups.questsAll });
      void queryClient.invalidateQueries({ queryKey: qk.leaderboard.globalAll });
      void queryClient.invalidateQueries({ queryKey: qk.leaderboard.friendsAll });
      if (ownerUserId) {
        void queryClient.invalidateQueries({ queryKey: qk.profile.detail(ownerUserId) });
      }
    },
  });
}
