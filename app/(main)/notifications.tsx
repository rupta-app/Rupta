import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bell, Crown } from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { colors } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { PressableScale } from '@/components/ui/PressableScale';
import { useClearAllNotifications, useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications';
import { useIncomingFriendRequests, useRespondFriendRequest } from '@/hooks/useFriends';
import { useRespondGroupInvite } from '@/hooks/useGroups';
import { useAuth } from '@/providers/AuthProvider';
import { findPendingIncomingRequestId } from '@/services/friends';
import type { NotificationListItem } from '@/services/notifications';

function asNotificationData(data: unknown): Record<string, string | undefined> {
  if (typeof data === 'object' && data !== null) return data as Record<string, string | undefined>;
  return {};
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } = useNotifications(uid);
  const items = useMemo(() => data?.pages.flat() ?? [], [data]);
  const { data: incomingFriendReqs = [] } = useIncomingFriendRequests(uid);
  const canClearInbox = items.length > 0 || incomingFriendReqs.length > 0;
  const markOne = useMarkNotificationRead();
  const clearAll = useClearAllNotifications(uid);
  const respond = useRespondFriendRequest();
  const respondInvite = useRespondGroupInvite();

  const onOpen = (row: NotificationListItem) => {
    markOne.mutate(row.id);
    const d = asNotificationData(row.data);
    if (row.type === 'comment' || row.type === 'respect') {
      if (d.completion_id) router.push(`/(main)/completion/${d.completion_id}`);
    } else if (row.type === 'friend_request' && d.sender_id) {
      router.push(`/(main)/user/${d.sender_id}`);
    } else if (row.type === 'weekly_quest' && d.quest_id) {
      router.push(`/(main)/quest/${d.quest_id}`);
    } else if (row.type === 'group_ownership_transferred' && d.group_id) {
      router.push(`/(main)/group/${d.group_id}`);
    }
  };

  const resolveRequestId = async (row: NotificationListItem): Promise<string | undefined> => {
    const d = asNotificationData(row.data);
    if (d.request_id) return d.request_id;
    if (!uid || !d.sender_id) return undefined;
    return (await findPendingIncomingRequestId(uid, d.sender_id)) ?? undefined;
  };

  const onAcceptFriend = async (row: NotificationListItem) => {
    let requestId: string | undefined;
    try {
      requestId = await resolveRequestId(row);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
      return;
    }
    if (!requestId) {
      Alert.alert(t('common.error'), t('friends.requestNotFound'));
      return;
    }
    respond.mutate(
      { requestId, accept: true },
      {
        onSuccess: () => {
          markOne.mutate(row.id);
          Alert.alert(t('friends.friendAddedTitle'), t('friends.friendAddedBody'));
        },
        onError: (e) => {
          Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
        },
      },
    );
  };

  const onRejectFriend = async (row: NotificationListItem) => {
    let requestId: string | undefined;
    try {
      requestId = await resolveRequestId(row);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
      return;
    }
    if (!requestId) {
      Alert.alert(t('common.error'), t('friends.requestNotFound'));
      return;
    }
    respond.mutate(
      { requestId, accept: false },
      {
        onSuccess: () => markOne.mutate(row.id),
        onError: (e) => {
          Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
        },
      },
    );
  };

  const onRespondInvite = (row: NotificationListItem, accept: boolean) => {
    const d = asNotificationData(row.data);
    if (!d.invite_id) {
      Alert.alert(t('common.error'), t('common.errorSubtitle'));
      return;
    }
    respondInvite.mutate(
      { inviteId: d.invite_id, accept },
      {
        onSuccess: () => {
          markOne.mutate(row.id);
          if (accept) {
            Alert.alert(t('groups.joinedTitle'), t('groups.joinedBody', { groupName: d.group_name ?? '' }));
          }
        },
        onError: (e) => {
          Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
        },
      },
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={t('notifications.title')} />
        <FullScreenLoader label={t('common.loading')} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={t('notifications.title')}
        right={
          <Button
            variant="ghost"
            className="min-h-0 py-1"
            disabled={!canClearInbox || clearAll.isPending}
            loading={clearAll.isPending}
            onPress={() => {
              if (!canClearInbox) return;
              clearAll.mutate(undefined, {
                onError: (e) => {
                  Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
                },
              });
            }}
          >
            {t('notifications.clearAll')}
          </Button>
        }
      />
      <FlatList
        data={items}
        keyExtractor={(item: NotificationListItem) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        ListEmptyComponent={<EmptyState icon={Bell} title={t('empty.noNotifications')} />}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.primary} className="py-4" /> : null}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) void fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        renderItem={({ item }: { item: NotificationListItem }) => {
          if (item.type === 'friend_request') {
            const sender = item.friendRequestSender;
            return (
              <Card className={`mb-2 ${item.is_read ? 'opacity-60' : ''}`}>
                <PressableScale onPress={() => onOpen(item)} scaleValue={0.98}>
                  {sender ? (
                    <View className="flex-row gap-3 items-center">
                      <Avatar url={sender.avatar_url} name={sender.display_name} size={48} />
                      <View className="flex-1 min-w-0">
                        <Text className="text-foreground font-semibold">{sender.display_name}</Text>
                        <Text className="text-muted text-xs">@{sender.username}</Text>
                        <Text className="text-muted text-sm mt-1">{t('notifications.friendRequestMessage')}</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text className="text-foreground font-semibold">{item.title}</Text>
                      <Text className="text-muted text-sm mt-1">{item.body}</Text>
                    </>
                  )}
                </PressableScale>
                <View className="flex-row gap-2 mt-3">
                  <Button
                    loading={respond.isPending}
                    onPress={() => void onAcceptFriend(item)}
                    className="flex-1 py-2 px-3 min-h-0"
                  >
                    {t('friends.accept')}
                  </Button>
                  <Button
                    variant="ghost"
                    loading={respond.isPending}
                    onPress={() => void onRejectFriend(item)}
                    className="flex-1 py-2 px-3 min-h-0"
                  >
                    {t('friends.reject')}
                  </Button>
                </View>
              </Card>
            );
          }

          if (item.type === 'group_invite') {
            const d = asNotificationData(item.data);
            const inviter = item.groupInviteInviter;
            const groupName = d.group_name ?? '';
            return (
              <Card className={`mb-2 ${item.is_read ? 'opacity-60' : ''}`}>
                <View className="flex-row gap-3 items-center">
                  {inviter ? (
                    <Avatar url={inviter.avatar_url} name={inviter.display_name} size={48} />
                  ) : null}
                  <View className="flex-1 min-w-0">
                    <Text className="text-foreground font-semibold">
                      {inviter?.display_name ?? item.title}
                    </Text>
                    {inviter ? <Text className="text-muted text-xs">@{inviter.username}</Text> : null}
                    <Text className="text-muted text-sm mt-1">
                      {t('notifications.groupInviteMessage', { groupName })}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2 mt-3">
                  <Button
                    loading={respondInvite.isPending}
                    onPress={() => onRespondInvite(item, true)}
                    className="flex-1 py-2 px-3 min-h-0"
                  >
                    {t('friends.accept')}
                  </Button>
                  <Button
                    variant="ghost"
                    loading={respondInvite.isPending}
                    onPress={() => onRespondInvite(item, false)}
                    className="flex-1 py-2 px-3 min-h-0"
                  >
                    {t('friends.reject')}
                  </Button>
                </View>
              </Card>
            );
          }

          if (item.type === 'group_ownership_transferred') {
            const d = asNotificationData(item.data);
            return (
              <PressableScale onPress={() => onOpen(item)} scaleValue={0.98}>
                <Card className={`mb-2 ${item.is_read ? 'opacity-60' : ''}`}>
                  <View className="flex-row items-center gap-3">
                    <Crown color={colors.primary} size={22} />
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">
                        {t('groups.notifOwnershipTitle')}
                      </Text>
                      <Text className="text-muted text-sm mt-1">
                        {t('groups.notifOwnershipBody', {
                          actor: d.actor_username ?? '',
                          group: d.group_name ?? '',
                        })}
                      </Text>
                    </View>
                  </View>
                </Card>
              </PressableScale>
            );
          }

          return (
            <PressableScale onPress={() => onOpen(item)} scaleValue={0.98}>
              <Card className={`mb-2 ${item.is_read ? 'opacity-60' : ''}`}>
                <Text className="text-foreground font-semibold">{item.title}</Text>
                <Text className="text-muted text-sm mt-1">{item.body}</Text>
              </Card>
            </PressableScale>
          );
        }}
      />
    </View>
  );
}
