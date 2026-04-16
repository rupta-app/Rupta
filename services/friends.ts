import type { Database } from '@/types/database';

import { supabase } from '@/lib/supabase';
import type { ProfileBasic, ProfileWithAura } from '@/services/_profiles';
import { PROFILE_COLS_AURA, PROFILE_COLS_BASIC } from '@/services/_profiles';

export async function sendFriendRequest(senderId: string, receiverId: string): Promise<void> {
  const { error } = await supabase.from('friend_requests').insert({
    sender_id: senderId,
    receiver_id: receiverId,
    status: 'pending',
  });
  if (error) throw error;
}

export async function respondFriendRequest(requestId: string, accept: boolean): Promise<void> {
  const { error } = await supabase
    .from('friend_requests')
    .update({
      status: accept ? 'accepted' : 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);
  if (error) throw error;
}

/** Reject every pending request where this user is the receiver (e.g. clear inbox). */
export async function rejectAllPendingIncomingFriendRequests(receiverId: string): Promise<void> {
  const { error } = await supabase
    .from('friend_requests')
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('receiver_id', receiverId)
    .eq('status', 'pending');
  if (error) throw error;
}

export type FriendRequestRelation =
  | { kind: 'incoming'; requestId: string }
  | { kind: 'outgoing'; requestId: string }
  | { kind: 'none' };

export async function fetchFriendRequestRelation(
  currentUserId: string,
  otherUserId: string,
): Promise<FriendRequestRelation> {
  const [{ data: inc, error: incErr }, { data: out, error: outErr }] = await Promise.all([
    supabase
      .from('friend_requests')
      .select('id')
      .eq('receiver_id', currentUserId)
      .eq('sender_id', otherUserId)
      .eq('status', 'pending')
      .maybeSingle(),
    supabase
      .from('friend_requests')
      .select('id')
      .eq('sender_id', currentUserId)
      .eq('receiver_id', otherUserId)
      .eq('status', 'pending')
      .maybeSingle(),
  ]);
  if (incErr) throw incErr;
  if (outErr) throw outErr;
  if (inc?.id) return { kind: 'incoming', requestId: inc.id };
  if (out?.id) return { kind: 'outgoing', requestId: out.id };
  return { kind: 'none' };
}

/** Fallback when notification JSON has no request_id (older rows). */
export async function findPendingIncomingRequestId(
  receiverId: string,
  senderId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('receiver_id', receiverId)
    .eq('sender_id', senderId)
    .eq('status', 'pending')
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function fetchIncomingRequests(userId: string): Promise<(Database['public']['Tables']['friend_requests']['Row'] & { sender: ProfileBasic | undefined })[]> {
  const { data: reqs, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('receiver_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
  const list = reqs ?? [];
  if (list.length === 0) return [];
  const senderIds = list.map((r) => r.sender_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select(PROFILE_COLS_BASIC)
    .in('id', senderIds);
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return list.map((r) => ({ ...r, sender: pmap.get(r.sender_id) }));
}

export async function fetchFriends(userId: string): Promise<ProfileWithAura[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('user_a_id, user_b_id')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
  if (error) throw error;
  const friendIds: string[] = [];
  (data ?? []).forEach((row) => {
    friendIds.push(row.user_a_id === userId ? row.user_b_id : row.user_a_id);
  });
  if (friendIds.length === 0) return [];
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select(PROFILE_COLS_AURA)
    .in('id', friendIds);
  if (pErr) throw pErr;
  return profiles ?? [];
}
