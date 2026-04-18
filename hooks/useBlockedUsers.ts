import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchBlockedUsers, unblockUser } from '@/services/blockedUsers';
import { qk } from '@/hooks/queryKeys';

export function useBlockedUsers(userId: string | undefined) {
  return useQuery({
    queryKey: qk.blocked.list(userId ?? ''),
    queryFn: () => fetchBlockedUsers(userId!),
    enabled: Boolean(userId),
  });
}

export function useUnblockUser(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) => unblockUser(userId!, blockedId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.blocked.listAll });
      void qc.invalidateQueries({ queryKey: qk.feed.all });
    },
  });
}
