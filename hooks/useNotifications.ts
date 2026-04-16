import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchNotifications, markAllRead, markNotificationRead, NOTIF_PAGE_SIZE } from '@/services/notifications';
import { qk } from '@/hooks/queryKeys';

export function useNotifications(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: qk.notifications.all(userId ?? ''),
    queryFn: ({ pageParam = 0 }) => fetchNotifications(userId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _all, page) =>
      lastPage.length < NOTIF_PAGE_SIZE ? undefined : page + 1,
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
