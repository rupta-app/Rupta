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

export function useCompletion(id: string | undefined) {
  return useQuery({
    queryKey: ['completion', id ?? ''],
    queryFn: () => fetchCompletionById(id!),
    enabled: Boolean(id),
  });
}

export function useCompletionSocial(completionId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ['completion-social', completionId, userId],
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
    queryKey: ['comments', completionId],
    queryFn: () => fetchComments(completionId),
    enabled: Boolean(completionId),
  });
}

export function useToggleRespect(completionId: string, userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ has }: { has: boolean }) => {
      if (!userId) throw new Error('No user');
      await toggleRespect(completionId, userId, has);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['completion-social', completionId] });
      void qc.invalidateQueries({ queryKey: ['completion-social'] });
      void qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useAddComment(completionId: string, userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!userId) throw new Error('No user');
      return addComment(completionId, userId, content);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['comments', completionId] });
    },
  });
}

export function useCreateCompletion(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCompletion,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feed'] });
      void qc.invalidateQueries({ queryKey: ['group-feed'] });
      void qc.invalidateQueries({ queryKey: ['group-lb'] });
      void qc.invalidateQueries({ queryKey: ['challenge-lb'] });
      void qc.invalidateQueries({ queryKey: ['profile-stats', userId] });
      void qc.invalidateQueries({ queryKey: ['profile-recent', userId] });
      void qc.invalidateQueries({ queryKey: ['profile-activity', userId] });
      void qc.invalidateQueries({ queryKey: ['quest-official-count'] });
      void qc.invalidateQueries({ queryKey: ['life-completion-counts'] });
    },
  });
}

export function useCreateSpontaneousCompletion(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSpontaneousCompletion,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feed'] });
      void qc.invalidateQueries({ queryKey: ['group-feed'] });
      void qc.invalidateQueries({ queryKey: ['profile-stats', userId] });
      void qc.invalidateQueries({ queryKey: ['profile-recent', userId] });
      void qc.invalidateQueries({ queryKey: ['profile-activity', userId] });
      void qc.invalidateQueries({ queryKey: ['quest-official-count'] });
      void qc.invalidateQueries({ queryKey: ['life-completion-counts'] });
    },
  });
}

export function useCreateGroupQuestCompletion(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGroupQuestCompletion,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feed'] });
      void qc.invalidateQueries({ queryKey: ['group-feed'] });
      void qc.invalidateQueries({ queryKey: ['group-lb'] });
      void qc.invalidateQueries({ queryKey: ['challenge-lb'] });
      void qc.invalidateQueries({ queryKey: ['group-quests'] });
      void qc.invalidateQueries({ queryKey: ['profile-recent', userId] });
    },
  });
}

export function useDeleteCompletion(completionId: string, ownerUserId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteCompletion(completionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['completion', completionId] });
      void qc.invalidateQueries({ queryKey: ['comments', completionId] });
      void qc.invalidateQueries({ queryKey: ['feed'] });
      void qc.invalidateQueries({ queryKey: ['group-feed'] });
      void qc.invalidateQueries({ queryKey: ['group-lb'] });
      void qc.invalidateQueries({ queryKey: ['challenge-lb'] });
      void qc.invalidateQueries({ queryKey: ['group-quests'] });
      void qc.invalidateQueries({ queryKey: ['lb-global'] });
      void qc.invalidateQueries({ queryKey: ['lb-friends'] });
      void qc.invalidateQueries({ queryKey: ['quest-official-count'] });
      void qc.invalidateQueries({ queryKey: ['life-completion-counts'] });
      if (ownerUserId) {
        void qc.invalidateQueries({ queryKey: ['profile', ownerUserId] });
        void qc.invalidateQueries({ queryKey: ['profile-stats', ownerUserId] });
        void qc.invalidateQueries({ queryKey: ['profile-recent', ownerUserId] });
        void qc.invalidateQueries({ queryKey: ['profile-activity', ownerUserId] });
      }
    },
  });
}
