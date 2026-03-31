import { supabase } from '@/lib/supabase';

import { fetchFriendIds } from '@/services/feed';

export async function globalLeaderboard(mode: 'total' | 'yearly', limit = 50) {
  const col = mode === 'yearly' ? 'yearly_aura' : 'total_aura';
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, total_aura, yearly_aura')
    .order(col, { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function friendsLeaderboard(userId: string, mode: 'total' | 'yearly') {
  const friendIds = await fetchFriendIds(userId);
  const ids = [...friendIds, userId];
  const col = mode === 'yearly' ? 'yearly_aura' : 'total_aura';
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, total_aura, yearly_aura')
    .in('id', ids)
    .order(col, { ascending: false });
  if (error) throw error;
  return data ?? [];
}
