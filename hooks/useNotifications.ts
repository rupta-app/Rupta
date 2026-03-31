import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchNotifications, markAllRead, markNotificationRead } from '@/services/notifications';

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(userId!),
    enabled: Boolean(userId),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllRead(userId!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
}
