import type { Database } from '@/types/database';

import { supabase } from '@/lib/supabase';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  if (error) throw error;
}

export async function createWeeklySuggestion(userId: string, questId: string, title: string): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: 'weekly_quest',
    title: 'Weekly SideQuest',
    body: title,
    data: { quest_id: questId },
  });
  if (error) throw error;
}
