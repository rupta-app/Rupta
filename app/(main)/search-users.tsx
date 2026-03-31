import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useSendFriendRequest } from '@/hooks/useFriends';
import { searchProfiles } from '@/services/profile';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';

export default function SearchUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const [q, setQ] = useState('');
  const send = useSendFriendRequest();

  const { data: results = [], refetch } = useQuery({
    queryKey: ['search-users', q, uid],
    queryFn: () => searchProfiles(q, uid),
    enabled: q.trim().length >= 2,
  });

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1">{t('friends.searchUsers')}</Text>
      </View>
      <View className="p-4">
        <Input value={q} onChangeText={setQ} placeholder={t('common.search')} />
        <Button variant="secondary" className="mt-2" onPress={() => refetch()}>
          {t('common.search')}
        </Button>
      </View>
      <FlatList
        data={results}
        keyExtractor={(item: { id: string }) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }: { item: { id: string; username: string; display_name: string; avatar_url: string | null } }) => (
          <Card className="mb-2 flex-row items-center gap-3">
            <Pressable className="flex-1 flex-row items-center gap-3" onPress={() => router.push(`/(main)/user/${item.id}`)}>
              <Avatar url={item.avatar_url} name={item.display_name} />
              <View>
                <Text className="text-foreground font-semibold">{item.display_name}</Text>
                <Text className="text-muted text-xs">@{item.username}</Text>
              </View>
            </Pressable>
            <Button
              variant="ghost"
              className="min-h-0 py-2 px-3"
              onPress={() => send.mutate({ senderId: uid, receiverId: item.id })}
            >
              {t('friends.addFriend')}
            </Button>
          </Card>
        )}
      />
    </View>
  );
}
