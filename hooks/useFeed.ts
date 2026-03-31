import { useQuery } from '@tanstack/react-query';

import { fetchFriendIds, fetchHomeFeed, fetchSuggestedQuest } from '@/services/feed';

export function useFriendIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['friend-ids', userId],
    queryFn: () => fetchFriendIds(userId!),
    enabled: Boolean(userId),
  });
}

export function useHomeFeed(userId: string | undefined, friendIds: string[]) {
  return useQuery({
    queryKey: ['feed', userId, friendIds.join(',')],
    queryFn: () => fetchHomeFeed(userId!, friendIds),
    enabled: Boolean(userId),
  });
}

export function useSuggestedQuest(userId: string | undefined, categories: string[]) {
  return useQuery({
    queryKey: ['suggested-quest', userId, categories.join(',')],
    queryFn: () => fetchSuggestedQuest(userId!, categories),
    enabled: Boolean(userId),
  });
}
