import { useQuery } from '@tanstack/react-query';

import type { LeaderboardPeriod } from '@/services/leaderboard';
import { friendsLeaderboard, globalLeaderboard } from '@/services/leaderboard';

export function useGlobalLeaderboard(period: LeaderboardPeriod) {
  return useQuery({
    queryKey: ['lb-global', period],
    queryFn: () => globalLeaderboard(period),
  });
}

export function useFriendsLeaderboard(userId: string | undefined, period: LeaderboardPeriod) {
  return useQuery({
    queryKey: ['lb-friends', userId, period],
    queryFn: () => friendsLeaderboard(userId!, period),
    enabled: Boolean(userId),
  });
}
