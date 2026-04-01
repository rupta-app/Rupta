import { useQuery } from '@tanstack/react-query';

import type { HomeFeedFilter } from '@/services/feed';
import { fetchFriendIds, fetchGroupFeed, fetchHomeFeed, fetchSuggestedQuest } from '@/services/feed';

export function useFriendIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['friend-ids', userId],
    queryFn: () => fetchFriendIds(userId!),
    enabled: Boolean(userId),
  });
}

export function useHomeFeed(
  userId: string | undefined,
  friendIds: string[],
  filter: HomeFeedFilter = 'all',
) {
  return useQuery({
    queryKey: ['feed', userId, friendIds.join(','), filter],
    queryFn: () => fetchHomeFeed(userId!, friendIds, filter),
    enabled: Boolean(userId),
  });
}

export function useGroupFeed(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-feed', groupId],
    queryFn: () => fetchGroupFeed(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useSuggestedQuest(userId: string | undefined, categories: string[]) {
  return useQuery({
    queryKey: ['suggested-quest', userId, categories.join(',')],
    queryFn: () => fetchSuggestedQuest(userId!, categories),
    enabled: Boolean(userId),
  });
}
