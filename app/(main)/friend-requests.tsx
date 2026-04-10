import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useIncomingFriendRequests, useRespondFriendRequest } from '@/hooks/useFriends';
import { useAuth } from '@/providers/AuthProvider';

export default function FriendRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: reqs = [] } = useIncomingFriendRequests(uid);
  const respond = useRespondFriendRequest();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2 flex-row items-center gap-2">
          <ChevronLeft color="#F8FAFC" size={28} />
          <Text className="text-foreground font-bold text-lg">{t('friends.requests')}</Text>
        </Pressable>
      </View>
      <FlatList
        data={reqs}
        keyExtractor={(item: { id: string }) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text className="text-muted text-center mt-8">{t('notifications.empty')}</Text>}
        renderItem={({ item }: { item: { id: string; sender?: { display_name: string; username: string; avatar_url: string | null } } }) => (
          <Card className="mb-3 flex-row items-center gap-3">
            <Avatar url={item.sender?.avatar_url} name={item.sender?.display_name ?? '?'} />
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{item.sender?.display_name}</Text>
              <Text className="text-muted text-xs">@{item.sender?.username}</Text>
            </View>
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
          </Card>
        )}
      />
    </View>
  );
}
