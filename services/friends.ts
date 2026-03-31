import { supabase } from '@/lib/supabase';

export async function sendFriendRequest(senderId: string, receiverId: string) {
  const { error } = await supabase.from('friend_requests').insert({
    sender_id: senderId,
    receiver_id: receiverId,
    status: 'pending',
  });
  if (error) throw error;
}

export async function respondFriendRequest(requestId: string, accept: boolean) {
  const { error } = await supabase
    .from('friend_requests')
    .update({
      status: accept ? 'accepted' : 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);
  if (error) throw error;
}

export async function fetchIncomingRequests(userId: string) {
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
    .select('id, username, display_name, avatar_url')
    .in('id', senderIds);
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return list.map((r) => ({ ...r, sender: pmap.get(r.sender_id) }));
}

export async function fetchFriends(userId: string) {
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
    .select('id, username, display_name, avatar_url, total_aura')
    .in('id', friendIds);
  if (pErr) throw pErr;
  return profiles ?? [];
}
