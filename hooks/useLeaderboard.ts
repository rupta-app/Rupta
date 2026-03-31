import { useQuery } from '@tanstack/react-query';

import { fetchFriendIds } from '@/services/feed';
import { friendsLeaderboard, globalLeaderboard } from '@/services/leaderboard';

export function useGlobalLeaderboard(mode: 'total' | 'yearly') {
  return useQuery({
    queryKey: ['lb-global', mode],
    queryFn: () => globalLeaderboard(mode),
  });
}

export function useFriendsLeaderboard(userId: string | undefined, mode: 'total' | 'yearly') {
  return useQuery({
    queryKey: ['lb-friends', userId, mode],
    queryFn: async () => {
      const friends = await fetchFriendIds(userId!);
      return friendsLeaderboard(userId!, mode);
    },
    enabled: Boolean(userId),
  });
}
