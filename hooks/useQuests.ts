import { useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { QuestFilters } from '@/services/quests';
import type { QuestsPage } from '@/services/quests';
import {
  fetchLifeListQuests,
  fetchOfficialCompletionCountForQuest,
  fetchOfficialCompletionCountsByQuestIds,
  fetchQuestById,
  fetchQuestsPage,
  fetchSavedQuestIds,
  toggleSavedQuest,
} from '@/services/quests';
import { QUEST_CATEGORIES } from '@/constants/categories';
import { qk } from '@/hooks/queryKeys';

function questsInfiniteOptions(filters: QuestFilters) {
  return {
    queryKey: qk.quests.list(filters),
    queryFn: ({ pageParam }: { pageParam: number }) => fetchQuestsPage(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: QuestsPage) => lastPage.nextOffset,
  };
}

export function useInfiniteQuests(filters: QuestFilters) {
  return useInfiniteQuery(questsInfiniteOptions(filters));
}

export function usePrefetchCategoryPages() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.prefetchInfiniteQuery({ ...questsInfiniteOptions({}), pages: 1 });
    for (const cat of QUEST_CATEGORIES) {
      queryClient.prefetchInfiniteQuery({ ...questsInfiniteOptions({ category: cat }), pages: 1 });
    }
  }, [queryClient]);
}

export function useQuest(id: string) {
  return useQuery({
    queryKey: qk.quests.detail(id),
    queryFn: () => fetchQuestById(id),
    enabled: Boolean(id),
  });
}

export function useSavedQuestIds(userId: string | undefined) {
  return useQuery({
    queryKey: qk.quests.saved(userId ?? ''),
    queryFn: () => fetchSavedQuestIds(userId!),
    enabled: Boolean(userId),
  });
}

export function useToggleSave(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ questId, currentlySaved }: { questId: string; currentlySaved: boolean }) => {
      if (!userId) throw new Error('No user');
      await toggleSavedQuest(userId, questId, currentlySaved);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.quests.saved(userId!) });
      void queryClient.invalidateQueries({ queryKey: qk.quests.lifeList(userId!) });
    },
  });
}

export function useLifeList(userId: string | undefined) {
  return useQuery({
    queryKey: qk.quests.lifeList(userId ?? ''),
    queryFn: () => fetchLifeListQuests(userId!),
    enabled: Boolean(userId),
  });
}

export function useOfficialCompletionCount(userId: string | undefined, questId: string | undefined) {
  return useQuery({
    queryKey: qk.quests.officialCount(userId ?? '', questId ?? ''),
    queryFn: () => fetchOfficialCompletionCountForQuest(userId!, questId!),
    enabled: Boolean(userId && questId),
  });
}

export function useLifeListCompletionCounts(userId: string | undefined, questIds: string[]) {
  const sortedKey = [...questIds].sort().join(',');
  return useQuery({
    queryKey: qk.quests.lifeCompletionCounts(userId ?? '', sortedKey),
    queryFn: () => fetchOfficialCompletionCountsByQuestIds(userId!, questIds),
    enabled: Boolean(userId) && questIds.length > 0,
  });
}
