import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchNotifications, markAllRead, markNotificationRead } from '@/services/notifications';
import { qk } from '@/hooks/queryKeys';

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: qk.notifications.all(userId ?? ''),
    queryFn: () => fetchNotifications(userId!),
    enabled: Boolean(userId),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.notifications.prefix });
    },
  });
}

export function useMarkAllNotificationsRead(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllRead(userId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.notifications.all(userId!) });
    },
  });
}
