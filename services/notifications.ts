import type { Database } from '@/types/database';

import { supabase } from '@/lib/supabase';
import { rejectAllPendingIncomingFriendRequests } from '@/services/friends';
import type { ProfileBasic } from '@/services/_profiles';
import { fetchProfilesByIds, PROFILE_COLS_BASIC } from '@/services/_profiles';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

/**
 * Notifications list row with sender/inviter profiles resolved for the types
 * that are rendered inline with action buttons (friend requests, group invites).
 */
export type NotificationListItem = NotificationRow & {
  friendRequestSender?: ProfileBasic;
  groupInviteInviter?: ProfileBasic;
};

export const NOTIF_PAGE_SIZE = 30;

function readString(data: NotificationRow['data'], key: string): string | undefined {
  if (data == null || typeof data !== 'object') return undefined;
  const v = (data as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : undefined;
}

function friendRequestSenderId(data: NotificationRow['data']): string | undefined {
  return readString(data, 'sender_id');
}

function groupInviteInviterId(data: NotificationRow['data']): string | undefined {
  return readString(data, 'inviter_id');
}

export async function fetchNotifications(
  userId: string,
  page = 0,
  pageSize = NOTIF_PAGE_SIZE,
): Promise<NotificationListItem[]> {
  const from = page * pageSize;
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;
  const rows = data ?? [];
  const profileIds = [
    ...new Set([
      ...rows
        .filter((r) => r.type === 'friend_request')
        .map((r) => friendRequestSenderId(r.data))
        .filter((id): id is string => Boolean(id)),
      ...rows
        .filter((r) => r.type === 'group_invite')
        .map((r) => groupInviteInviterId(r.data))
        .filter((id): id is string => Boolean(id)),
    ]),
  ];
  const profiles = profileIds.length
    ? await fetchProfilesByIds(profileIds, PROFILE_COLS_BASIC)
    : [];
  const pmap = new Map(profiles.map((p) => [p.id, p as ProfileBasic]));
  return rows.map((r) => {
    if (r.type === 'friend_request') {
      const sid = friendRequestSenderId(r.data);
      return { ...r, friendRequestSender: sid ? pmap.get(sid) : undefined };
    }
    if (r.type === 'group_invite') {
      const iid = groupInviteInviterId(r.data);
      return { ...r, groupInviteInviter: iid ? pmap.get(iid) : undefined };
    }
    return r;
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

/** Rejects pending incoming friend requests, then deletes all notification rows for this user. */
export async function clearAllNotifications(userId: string): Promise<void> {
  await rejectAllPendingIncomingFriendRequests(userId);
  const { error: delErr } = await supabase.from('notifications').delete().eq('user_id', userId);
  if (delErr) throw delErr;
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
