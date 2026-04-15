import { adminClient } from '@/lib/supabaseAdmin';
import { normalizeJoin } from '@/lib/utils';

export interface AdminReport {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  completion_id: string | null;
  comment_id: string | null;
  reported_user_id: string | null;
  reporter: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  reported_user: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    status: string;
    total_aura: number;
  } | null;
  completion: {
    id: string;
    status: string;
    aura_earned: number;
    caption: string | null;
    quest_source_type: string;
    completed_at: string;
    media: {
      id: string;
      media_url: string;
      media_type: string;
    }[];
  } | null;
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
  } | null;
}

interface FetchReportsParams {
  status?: string;
  reason?: string;
  page: number;
  pageSize: number;
}

export async function fetchReports({ status, reason, page, pageSize }: FetchReportsParams) {
  let query = adminClient
    .from('reports')
    .select(
      `
      id, reason, description, status, created_at, reviewed_at, reviewed_by,
      completion_id, comment_id, reported_user_id,
      reporter:profiles!reports_reporter_id_fkey(display_name, username, avatar_url),
      reported_user:profiles!reports_reported_user_id_fkey(id, display_name, username, avatar_url, status, total_aura),
      completion:quest_completions(
        id, status, aura_earned, caption, quest_source_type, completed_at,
        media:quest_media(id, media_url, media_type)
      ),
      comment:comments(id, content, created_at, user_id)
    `,
      { count: 'exact' },
    );

  if (status) {
    query = query.eq('status', status);
  }
  if (reason) {
    query = query.eq('reason', reason);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;

  const normalized = (data ?? []).map((row) => {
    const completion = normalizeJoin(row.completion);
    return {
      ...row,
      reporter: normalizeJoin(row.reporter),
      reported_user: normalizeJoin(row.reported_user),
      completion: completion
        ? { ...completion, media: Array.isArray(completion.media) ? completion.media : [] }
        : null,
      comment: normalizeJoin((row as Record<string, unknown>).comment),
    };
  }) as AdminReport[];

  return { data: normalized, total: count ?? 0 };
}

export async function updateReportStatus(reportId: string, status: string) {
  const { error } = await adminClient
    .from('reports')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId);
  if (error) throw error;
}

export async function resolveReport(
  reportId: string,
  options: {
    removeCompletion?: boolean;
    completionId?: string | null;
    deleteComment?: boolean;
    commentId?: string | null;
    warnUser?: boolean;
    flagUser?: boolean;
    reportedUserId?: string | null;
  },
) {
  await updateReportStatus(reportId, 'resolved');

  if (options.removeCompletion && options.completionId) {
    const { error } = await adminClient
      .from('quest_completions')
      .update({ status: 'removed' })
      .eq('id', options.completionId);
    if (error) throw error;
  }

  if (options.deleteComment && options.commentId) {
    const { error } = await adminClient
      .from('comments')
      .delete()
      .eq('id', options.commentId);
    if (error) throw error;
  }

  if (options.reportedUserId && (options.warnUser || options.flagUser)) {
    const newStatus = options.flagUser ? 'flagged_cheater' : 'warned';
    const { error } = await adminClient
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', options.reportedUserId);
    if (error) throw error;
  }
}

export async function fetchReportCountsForUser(userId: string) {
  const { count, error } = await adminClient
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('reported_user_id', userId);

  if (error) throw error;
  return count ?? 0;
}
