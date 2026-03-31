import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchFriends,
  fetchIncomingRequests,
  respondFriendRequest,
  sendFriendRequest,
} from '@/services/friends';

export function useFriendsList(userId: string | undefined) {
  return useQuery({
    queryKey: ['friends', userId],
    queryFn: () => fetchFriends(userId!),
    enabled: Boolean(userId),
  });
}

export function useIncomingFriendRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ['friend-requests-in', userId],
    queryFn: () => fetchIncomingRequests(userId!),
    enabled: Boolean(userId),
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ senderId, receiverId }: { senderId: string; receiverId: string }) =>
      sendFriendRequest(senderId, receiverId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['friend-requests-in'] });
    },
  });
}

export function useRespondFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      respondFriendRequest(requestId, accept),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['friend-requests-in'] });
      void qc.invalidateQueries({ queryKey: ['friends'] });
      void qc.invalidateQueries({ queryKey: ['friend-ids'] });
    },
  });
}
