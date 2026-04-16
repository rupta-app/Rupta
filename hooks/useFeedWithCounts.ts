import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchCompletionCounts, userGaveRespectBatch } from '@/services/completions';
import { qk } from '@/hooks/queryKeys';

export function useFeedWithCounts<T extends { id: string }>(
  feed: T[],
  variant: 'home' | 'group',
  viewerId?: string,
) {
  const completionIds = useMemo(() => feed.map((f) => f.id), [feed]);
  const idsKey = completionIds.join(',');

  const countsKey = variant === 'home' ? qk.feed.countsAll : qk.feed.groupCountsAll;
  const respectKey = variant === 'home' ? qk.feed.respectAll : qk.feed.groupRespectAll;

  const { data: countsMap } = useQuery({
    queryKey: [...countsKey, idsKey],
    queryFn: () => fetchCompletionCounts(completionIds),
    enabled: completionIds.length > 0,
  });

  const { data: respectedSet } = useQuery({
    queryKey: [...respectKey, idsKey, viewerId],
    queryFn: () => userGaveRespectBatch(completionIds, viewerId!),
    enabled: completionIds.length > 0 && Boolean(viewerId),
  });

  return useMemo(
    () =>
      feed.map((p) => ({
        ...p,
        respectCount: countsMap?.get(p.id)?.respects ?? 0,
        commentCount: countsMap?.get(p.id)?.comments ?? 0,
        gaveRespect: respectedSet?.has(p.id) ?? false,
      })),
    [feed, countsMap, respectedSet],
  );
}
