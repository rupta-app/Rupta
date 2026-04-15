import { useRouter } from 'expo-router';
import { Alert, FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications';
import { useRespondFriendRequest } from '@/hooks/useFriends';
import { useAuth } from '@/providers/AuthProvider';
import { findPendingIncomingRequestId } from '@/services/friends';

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  type: string;
  data: unknown;
};

function asNotificationData(data: unknown): Record<string, string | undefined> {
  if (typeof data === 'object' && data !== null) return data as Record<string, string | undefined>;
  return {};
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: items = [] } = useNotifications(uid);
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead(uid);
  const respond = useRespondFriendRequest();

  const onOpen = (row: NotificationRow) => {
    markOne.mutate(row.id);
    const d = asNotificationData(row.data);
    if (row.type === 'comment' || row.type === 'respect') {
      if (d.completion_id) router.push(`/(main)/completion/${d.completion_id}`);
    } else if (row.type === 'friend_request' && d.sender_id) {
      router.push(`/(main)/user/${d.sender_id}`);
    } else if (row.type === 'group_invite' && d.group_id) {
      router.push(`/(main)/group/${d.group_id}`);
    } else if (row.type === 'weekly_quest' && d.quest_id) {
      router.push(`/(main)/quest/${d.quest_id}`);
    }
  };

  const resolveRequestId = async (row: NotificationRow): Promise<string | undefined> => {
    const d = asNotificationData(row.data);
    if (d.request_id) return d.request_id;
    if (!uid || !d.sender_id) return undefined;
    return (await findPendingIncomingRequestId(uid, d.sender_id)) ?? undefined;
  };

  const onAcceptFriend = async (row: NotificationRow) => {
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

  const onRejectFriend = async (row: NotificationRow) => {
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

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={t('notifications.title')}
        right={
          <Button variant="ghost" className="min-h-0 py-1" onPress={() => markAll.mutate()}>
            Read all
          </Button>
        }
      />
      <FlatList
        data={items}
        keyExtractor={(item: NotificationRow) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        ListEmptyComponent={<EmptyState icon={Bell} title={t('empty.noNotifications')} />}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        renderItem={({ item }: { item: NotificationRow }) => {
          const isFriendRequest = item.type === 'friend_request';
          return (
            <PressableScale onPress={() => onOpen(item)} scaleValue={0.98}>
              <Card className={`mb-2 ${item.is_read ? 'opacity-60' : ''}`}>
                <Text className="text-foreground font-semibold">{item.title}</Text>
                <Text className="text-muted text-sm mt-1">{item.body}</Text>
                {isFriendRequest ? (
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
                ) : null}
              </Card>
            </PressableScale>
          );
        }}
      />
    </View>
  );
}
