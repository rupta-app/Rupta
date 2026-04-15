import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addComment,
  createCompletion,
  createGroupQuestCompletion,
  createSpontaneousCompletion,
  deleteComment,
  deleteCompletion,
  fetchComments,
  fetchCompletionById,
  fetchCompletionCounts,
  reportComment,
  toggleCommentLike,
  toggleRespect,
  userGaveRespect,
  userLikedComments,
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

const COMMENTS_PAGE_SIZE = 5;

export function useComments(completionId: string) {
  return useInfiniteQuery({
    queryKey: qk.completions.comments(completionId),
    queryFn: ({ pageParam = 0 }) => fetchComments(completionId, COMMENTS_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.reduce((n, p) => n + p.comments.length, 0) : undefined,
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
      void queryClient.invalidateQueries({ queryKey: qk.feed.groupAll });
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
      void queryClient.invalidateQueries({ queryKey: qk.completions.detail(completionId) });
      void queryClient.invalidateQueries({ queryKey: qk.feed.all });
      void queryClient.invalidateQueries({ queryKey: qk.feed.groupAll });
    },
  });
}

export function useDeleteComment(completionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.completions.comments(completionId) });
      void queryClient.invalidateQueries({ queryKey: qk.completions.commentSocial(completionId) });
    },
  });
}

export function useCommentSocial(completionId: string, userId: string | undefined, commentIds: string[]) {
  return useQuery({
    queryKey: [...qk.completions.commentSocial(completionId), commentIds.join(',')],
    queryFn: async () => {
      const liked = userId ? await userLikedComments(userId, commentIds) : new Set<string>();
      return { liked };
    },
    enabled: commentIds.length > 0,
  });
}

export function useToggleCommentLike(completionId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, hasLiked }: { commentId: string; hasLiked: boolean }) => {
      if (!userId) throw new Error('No user');
      await toggleCommentLike(commentId, userId, hasLiked);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.completions.commentSocial(completionId) });
    },
  });
}

export function useReportComment() {
  return useMutation({
    mutationFn: async ({ commentId, reporterId, reportedUserId, reason }: {
      commentId: string;
      reporterId: string;
      reportedUserId: string;
      reason: string;
    }) => reportComment(commentId, reporterId, reportedUserId, reason),
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
