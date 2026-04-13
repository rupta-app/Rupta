import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchFriends,
  fetchIncomingRequests,
  respondFriendRequest,
  sendFriendRequest,
} from '@/services/friends';
import { qk } from '@/hooks/queryKeys';

export function useFriendsList(userId: string | undefined) {
  return useQuery({
    queryKey: qk.friends.list(userId ?? ''),
    queryFn: () => fetchFriends(userId!),
    enabled: Boolean(userId),
  });
}

export function useIncomingFriendRequests(userId: string | undefined) {
  return useQuery({
    queryKey: qk.friends.requestsIn(userId ?? ''),
    queryFn: () => fetchIncomingRequests(userId!),
    enabled: Boolean(userId),
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ senderId, receiverId }: { senderId: string; receiverId: string }) =>
      sendFriendRequest(senderId, receiverId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.friends.requestsInAll });
    },
  });
}

export function useRespondFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      respondFriendRequest(requestId, accept),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.friends.requestsInAll });
      void queryClient.invalidateQueries({ queryKey: qk.friends.listAll });
      void queryClient.invalidateQueries({ queryKey: qk.friends.idsAll });
      void queryClient.invalidateQueries({ queryKey: qk.friends.relation });
      void queryClient.invalidateQueries({ queryKey: qk.notifications.prefix });
    },
  });
}
