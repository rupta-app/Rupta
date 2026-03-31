import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useFriendsList } from '@/hooks/useFriends';
import { useAuth } from '@/providers/AuthProvider';

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: friends = [] } = useFriendsList(uid);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2 flex-row items-center gap-2">
          <ChevronLeft color="#F8FAFC" size={28} />
          <Text className="text-foreground font-bold text-lg">{t('friends.title')}</Text>
        </Pressable>
        <Button variant="ghost" onPress={() => router.push('/(main)/search-users')}>
          {t('friends.searchUsers')}
        </Button>
      </View>
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
          <Pressable onPress={() => router.push(`/(main)/user/${item.id}`)}>
            <Card className="mb-2 flex-row items-center gap-3">
              <Avatar url={item.avatar_url} name={item.display_name} />
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{item.display_name}</Text>
                <Text className="text-muted text-xs">@{item.username}</Text>
              </View>
              <Text className="text-primary font-bold">{item.total_aura}</Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
