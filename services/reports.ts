import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type ReportReason = Database['public']['Tables']['reports']['Row']['reason'];

export async function submitReport(payload: {
  reporterId: string;
  completionId?: string | null;
  reportedUserId?: string | null;
  reason: ReportReason;
  description?: string | null;
}) {
  const { error: rErr } = await supabase.from('reports').insert({
    reporter_id: payload.reporterId,
    completion_id: payload.completionId ?? null,
    reported_user_id: payload.reportedUserId ?? null,
    reason: payload.reason,
    description: payload.description ?? null,
    status: 'pending',
  });
  if (rErr) throw rErr;

  if (payload.completionId) {
    await supabase.from('quest_completions').update({ status: 'under_review' }).eq('id', payload.completionId);
  }
}

export async function blockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase.from('blocked_users').insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}
