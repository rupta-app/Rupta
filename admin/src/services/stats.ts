import { adminClient } from '@/lib/supabaseAdmin';
import { normalizeJoin } from '@/lib/utils';

export interface DashboardStats {
  totalUsers: number;
  pendingReports: number;
  pendingSpontaneous: number;
  underReviewCompletions: number;
  completionsToday: number;
  totalQuests: number;
  totalGroups: number;
  pendingSuggestions: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    users,
    pendingReports,
    pendingSpontaneous,
    underReview,
    completionsToday,
    activeQuests,
    groups,
    suggestions,
  ] = await Promise.all([
    adminClient.from('profiles').select('*', { count: 'exact', head: true }),
    adminClient.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    adminClient
      .from('quests')
      .select('*', { count: 'exact', head: true })
      .eq('is_spontaneous', true)
      .eq('spontaneous_review_status', 'pending_catalog'),
    adminClient
      .from('quest_completions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'under_review'),
    adminClient
      .from('quest_completions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('completed_at', today.toISOString()),
    adminClient
      .from('quests')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_spontaneous', false),
    adminClient.from('groups').select('*', { count: 'exact', head: true }),
    adminClient.from('quest_suggestions').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: users.count ?? 0,
    pendingReports: pendingReports.count ?? 0,
    pendingSpontaneous: pendingSpontaneous.count ?? 0,
    underReviewCompletions: underReview.count ?? 0,
    completionsToday: completionsToday.count ?? 0,
    totalQuests: activeQuests.count ?? 0,
    totalGroups: groups.count ?? 0,
    pendingSuggestions: suggestions.count ?? 0,
  };
}

export interface RecentActivity {
  id: string;
  type: 'report' | 'spontaneous';
  title: string;
  subtitle: string;
  createdAt: string;
}

export async function fetchRecentActivity(): Promise<RecentActivity[]> {
  const [reportsRes, spontaneousRes] = await Promise.all([
    adminClient
      .from('reports')
      .select('id, reason, status, created_at, reporter:profiles!reports_reporter_id_fkey(username)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('quests')
      .select('id, title_en, created_at, creator:profiles!quests_created_by_fkey(username)')
      .eq('is_spontaneous', true)
      .eq('spontaneous_review_status', 'pending_catalog')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const reports: RecentActivity[] = (reportsRes.data ?? []).map((r) => ({
    id: r.id,
    type: 'report',
    title: `Report: ${r.reason}`,
    subtitle: `by @${(normalizeJoin(r.reporter) as { username: string } | null)?.username ?? 'unknown'}`,
    createdAt: r.created_at,
  }));

  const spontaneous: RecentActivity[] = (spontaneousRes.data ?? []).map((q) => ({
    id: q.id,
    type: 'spontaneous',
    title: q.title_en ?? 'Untitled quest',
    subtitle: `by @${(normalizeJoin(q.creator) as { username: string } | null)?.username ?? 'unknown'}`,
    createdAt: q.created_at,
  }));

  return [...reports, ...spontaneous]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
}
