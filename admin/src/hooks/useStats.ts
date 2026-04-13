import { useState, useEffect, useCallback } from 'react';
import { fetchDashboardStats, fetchRecentActivity } from '@/services/stats';
import type { DashboardStats, RecentActivity } from '@/services/stats';

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([fetchDashboardStats(), fetchRecentActivity()]);
      setStats(s);
      setActivity(a);
    } catch {
      // Stats are non-critical, fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, activity, loading, refetch: load };
}
