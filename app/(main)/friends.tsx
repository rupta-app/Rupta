import { useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { UserListItem } from '@/components/social/UserListItem';
import { Button } from '@/components/ui/Button';
import { useFriendsList } from '@/hooks/useFriends';
import { useAuth } from '@/providers/AuthProvider';

export default function FriendsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: friends = [] } = useFriendsList(uid);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={t('friends.title')}
        right={
          <Button variant="ghost" onPress={() => router.push('/(main)/unified-search')}>
            {t('friends.searchUsers')}
          </Button>
        }
      />
      <FlatList
        data={friends}
        keyExtractor={(item: { id: string }) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <Button variant="secondary" className="mb-4" onPress={() => router.push('/(main)/friend-requests')}>
            {t('friends.requests')}
          </Button>
        }
        renderItem={({ item }: { item: { id: string; display_name: string; username: string; avatar_url: string | null; total_aura: number } }) => (
          <UserListItem
            user={item}
            onPress={() => router.push(`/(main)/user/${item.id}`)}
            right={<Text className="text-primary font-bold">{item.total_aura}</Text>}
          />
        )}
      />
    </View>
  );
}
