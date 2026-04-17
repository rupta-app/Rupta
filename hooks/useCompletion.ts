import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

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
  type CompletionDetail,
} from '@/services/completions';
import { invalidateCompletionRelated, qk } from '@/hooks/queryKeys';
import type { FeedPost } from '@/services/feed';

/**
 * Seeds completion detail from a feed cache entry. The feed view gives us the
 * profile, quest meta, caption, aura and first media — enough to render the
 * screen immediately while the full detail query (all media, full quest row)
 * runs in the background.
 */
function findCompletionInFeedCache(
  qc: QueryClient,
  id: string,
): CompletionDetail | undefined {
  type InfinitePages = { pages?: { posts: FeedPost[] }[] };
  const buckets = [
    qc.getQueriesData<InfinitePages>({ queryKey: qk.feed.all }),
    qc.getQueriesData<InfinitePages>({ queryKey: qk.feed.groupAll }),
  ];
  for (const bucket of buckets) {
    for (const [, data] of bucket) {
      const pages = data?.pages;
      if (!Array.isArray(pages)) continue;
      for (const page of pages) {
        const hit = page.posts?.find((p) => p.id === id);
        if (hit) return feedPostToPlaceholder(hit);
      }
    }
  }
  return undefined;
}

function feedPostToPlaceholder(p: FeedPost): CompletionDetail {
  const media = p.quest_media.map((m, i) => ({
    id: `placeholder-${p.id}-${i}`,
    completion_id: p.id,
    media_url: m.media_url,
    media_type: m.media_type,
    order_index: i,
    created_at: p.completed_at,
  })) as CompletionDetail['quest_media'];

  return {
    id: p.id,
    user_id: p.user_id,
    quest_id: p.quest_id,
    group_quest_id: p.group_quest_id,
    group_id: p.group_id,
    quest_source_type: p.quest_source_type,
    aura_earned: p.aura_earned,
    caption: p.caption,
    completed_at: p.completed_at,
    visibility: p.visibility,
    profiles: {
      id: p.user_id,
      username: p.profiles.username,
      display_name: p.profiles.display_name,
      avatar_url: p.profiles.avatar_url,
    },
    quests: p.quests
      ? ({
          id: p.quest_id,
          title_en: p.quests.title_en,
          title_es: p.quests.title_es,
          category: p.quests.category,
        } as CompletionDetail['quests'])
      : null,
    group_quests: p.group_quests
      ? ({ id: p.group_quest_id, title: p.group_quests.title } as CompletionDetail['group_quests'])
      : null,
    groups: p.groups ?? null,
    quest_media: media,
  } as CompletionDetail;
}

export function useCompletion(id: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.completions.detail(id ?? ''),
    queryFn: () => fetchCompletionById(id!),
    enabled: Boolean(id),
    placeholderData: () => (id ? findCompletionInFeedCache(qc, id) : undefined),
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
      void queryClient.invalidateQueries({ queryKey: qk.feed.countsAll });
      void queryClient.invalidateQueries({ queryKey: qk.feed.respectAll });
      void queryClient.invalidateQueries({ queryKey: qk.feed.groupCountsAll });
      void queryClient.invalidateQueries({ queryKey: qk.feed.groupRespectAll });
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
