import { useQuery } from '@tanstack/react-query';

import type { HomeFeedFilter } from '@/services/feed';
import { fetchFriendIds, fetchGroupFeed, fetchHomeFeed, fetchSuggestedQuest } from '@/services/feed';
import { qk } from '@/hooks/queryKeys';

export function useFriendIds(userId: string | undefined) {
  return useQuery({
    queryKey: qk.friends.ids(userId ?? ''),
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
    queryKey: qk.feed.home(userId ?? '', friendIds.join(','), filter),
    queryFn: () => fetchHomeFeed(userId!, friendIds, filter),
    enabled: Boolean(userId),
  });
}

export function useGroupFeed(groupId: string | undefined) {
  return useQuery({
    queryKey: qk.feed.group(groupId ?? ''),
    queryFn: () => fetchGroupFeed(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useSuggestedQuest(userId: string | undefined, categories: string[]) {
  return useQuery({
    queryKey: qk.quests.suggested(userId ?? '', categories.join(',')),
    queryFn: () => fetchSuggestedQuest(userId!, categories),
    enabled: Boolean(userId),
  });
}
