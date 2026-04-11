import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { FriendRequestActions } from '@/components/social/FriendRequestActions';
import { UserListItem } from '@/components/social/UserListItem';
import { useIncomingFriendRequests } from '@/hooks/useFriends';
import { useAuth } from '@/providers/AuthProvider';

export default function FriendRequestsScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: reqs = [] } = useIncomingFriendRequests(uid);

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
            right={<FriendRequestActions requestId={item.id} />}
          />
        )}
      />
    </View>
  );
}
