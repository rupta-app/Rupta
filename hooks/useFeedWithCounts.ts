import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchCompletionCounts } from '@/services/completions';

export function useFeedWithCounts<T extends { id: string }>(feed: T[], queryKeyPrefix: string) {
  const completionIds = useMemo(() => feed.map((f) => f.id), [feed]);
  const { data: countsMap } = useQuery({
    queryKey: [queryKeyPrefix, completionIds.join(',')],
    queryFn: () => fetchCompletionCounts(completionIds),
    enabled: completionIds.length > 0,
  });

  return useMemo(
    () =>
      feed.map((p) => ({
        ...p,
        respectCount: countsMap?.get(p.id)?.respects ?? 0,
        commentCount: countsMap?.get(p.id)?.comments ?? 0,
      })),
    [feed, countsMap],
  );
}
