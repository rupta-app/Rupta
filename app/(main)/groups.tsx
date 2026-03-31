import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useMyGroups, usePendingGroupInvites, useRespondGroupInvite } from '@/hooks/useGroups';
import { useAuth } from '@/providers/AuthProvider';

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: groups = [] } = useMyGroups(uid);
  const { data: invites = [] } = usePendingGroupInvites(uid);
  const respond = useRespondGroupInvite();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2 flex-row items-center gap-2">
          <ChevronLeft color="#F8FAFC" size={28} />
          <Text className="text-foreground font-bold text-lg">{t('groups.title')}</Text>
        </Pressable>
        <Button variant="ghost" onPress={() => router.push('/(main)/create-group')}>
          {t('groups.create')}
        </Button>
      </View>
      {invites.length > 0 ? (
        <View className="px-4 pt-4">
          <Text className="text-muted text-xs uppercase mb-2">Invites</Text>
          {invites.map(
            (inv: { id: string; groups?: { name: string }; inviter?: { username: string } }) => (
              <Card key={inv.id} className="mb-2 flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-foreground font-semibold">{inv.groups?.name}</Text>
                  <Text className="text-muted text-xs">from @{inv.inviter?.username}</Text>
                </View>
                <View className="gap-1">
                  <Button
                    className="py-1 px-2 min-h-0"
                    onPress={() => respond.mutate({ inviteId: inv.id, accept: true })}
                  >
                    {t('friends.accept')}
                  </Button>
                  <Button
                    variant="ghost"
                    className="py-1 px-2 min-h-0"
                    onPress={() => respond.mutate({ inviteId: inv.id, accept: false })}
                  >
                    {t('friends.reject')}
                  </Button>
                </View>
              </Card>
            ),
          )}
        </View>
      ) : null}
      <FlatList
        data={groups}
        keyExtractor={(item: { id: string }) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text className="text-muted text-center mt-8">{t('feed.empty')}</Text>}
        renderItem={({ item }: { item: { id: string; name: string; description: string | null } }) => (
          <Pressable onPress={() => router.push(`/(main)/group/${item.id}`)}>
            <Card className="mb-2">
              <Text className="text-foreground text-lg font-bold">{item.name}</Text>
              {item.description ? <Text className="text-muted text-sm mt-1">{item.description}</Text> : null}
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
