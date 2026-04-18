import { supabase } from '@/lib/supabase';
import { enrichWithProfiles, PROFILE_COLS_BASIC, type ProfileBasic } from '@/services/_profiles';

export type BlockedUser = ProfileBasic;

export async function fetchBlockedUsers(userId: string): Promise<BlockedUser[]> {
  const { data, error } = await supabase
    .from('blocked_users')
    .select('blocked_id, created_at')
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const enriched = await enrichWithProfiles(rows, 'blocked_id', PROFILE_COLS_BASIC);
  return enriched
    .map((r) => r.profiles as ProfileBasic | undefined)
    .filter((p): p is ProfileBasic => Boolean(p));
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  if (error) throw error;
}
