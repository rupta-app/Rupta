import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: items = [] } = useNotifications(uid);
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead(uid);
  const respond = useRespondFriendRequest();

  const onOpen = (row: NotificationRow) => {
    markOne.mutate(row.id);
    const d = row.data as {
      completion_id?: string;
      sender_id?: string;
      group_id?: string;
      quest_id?: string;
    };
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
    const d = row.data as { sender_id?: string; request_id?: string };
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
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2 flex-row items-center gap-2">
          <ChevronLeft color="#F8FAFC" size={28} />
          <Text className="text-foreground font-bold text-lg">{t('notifications.title')}</Text>
        </Pressable>
        <Button variant="ghost" className="min-h-0 py-1" onPress={() => markAll.mutate()}>
          Read all
        </Button>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item: NotificationRow) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text className="text-muted text-center mt-8">{t('notifications.empty')}</Text>}
        renderItem={({ item }: { item: NotificationRow }) => {
          const isFriendRequest = item.type === 'friend_request';
          return (
            <Card className={`mb-2 ${item.is_read ? 'opacity-60' : 'border-primary/40'}`}>
              <Pressable onPress={() => onOpen(item)}>
                <Text className="text-foreground font-semibold">{item.title}</Text>
                <Text className="text-muted text-sm mt-1">{item.body}</Text>
              </Pressable>
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
          );
        }}
      />
    </View>
  );
}
