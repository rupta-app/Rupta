import { Alert, FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { UserListItem } from '@/components/social/UserListItem';
import { Button } from '@/components/ui/Button';
import { useIncomingFriendRequests, useRespondFriendRequest } from '@/hooks/useFriends';
import { useAuth } from '@/providers/AuthProvider';

export default function FriendRequestsScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: reqs = [] } = useIncomingFriendRequests(uid);
  const respond = useRespondFriendRequest();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('friends.requests')} />
      <FlatList
        data={reqs}
        keyExtractor={(item: { id: string }) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text className="text-muted text-center mt-8">{t('notifications.empty')}</Text>}
        renderItem={({ item }: { item: { id: string; sender?: { display_name: string; username: string; avatar_url: string | null } } }) => (
          <UserListItem
            user={{
              display_name: item.sender?.display_name ?? '?',
              username: item.sender?.username ?? '',
              avatar_url: item.sender?.avatar_url ?? null,
            }}
            right={
              <View className="gap-2">
                <Button
                  loading={respond.isPending}
                  onPress={() =>
                    respond.mutate(
                      { requestId: item.id, accept: true },
                      {
                        onSuccess: () =>
                          Alert.alert(t('friends.friendAddedTitle'), t('friends.friendAddedBody')),
                        onError: (e) =>
                          Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e)),
                      },
                    )
                  }
                  className="py-2 px-3 min-h-0"
                >
                  {t('friends.accept')}
                </Button>
                <Button
                  variant="ghost"
                  loading={respond.isPending}
                  onPress={() =>
                    respond.mutate(
                      { requestId: item.id, accept: false },
                      {
                        onError: (e) =>
                          Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e)),
                      },
                    )
                  }
                  className="py-2 px-3 min-h-0"
                >
                  {t('friends.reject')}
                </Button>
              </View>
            }
          />
        )}
      />
    </View>
  );
}
