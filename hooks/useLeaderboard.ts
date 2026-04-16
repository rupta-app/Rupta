import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { LeaderboardPeriod } from '@/services/leaderboard';
import { LEADERBOARD_PAGE_SIZE, fetchGlobalLeaderboardPage, friendsLeaderboard } from '@/services/leaderboard';
import { qk } from '@/hooks/queryKeys';

export function useGlobalLeaderboard(period: LeaderboardPeriod) {
  return useInfiniteQuery({
    queryKey: qk.leaderboard.global(period),
    queryFn: ({ pageParam = 0 }) => fetchGlobalLeaderboardPage(period, pageParam, LEADERBOARD_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + LEADERBOARD_PAGE_SIZE : undefined,
  });
}

export function useFriendsLeaderboard(userId: string | undefined, period: LeaderboardPeriod) {
  return useQuery({
    queryKey: qk.leaderboard.friends(userId ?? '', period),
    queryFn: () => friendsLeaderboard(userId!, period),
    enabled: Boolean(userId),
  });
}
