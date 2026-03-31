import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppModal } from '@/components/ui/AppModal';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useFriendsList } from '@/hooks/useFriends';
import { useGroupDetail, useGroupLeaderboard, useInviteToGroup } from '@/hooks/useGroups';
import { useAuth } from '@/providers/AuthProvider';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const { data, isLoading } = useGroupDetail(id);
  const { data: lb = [] } = useGroupLeaderboard(id);
  const { data: friends = [] } = useFriendsList(uid);
  const invite = useInviteToGroup();
  const [inviteOpen, setInviteOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const { group, members } = data;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1 flex-1" numberOfLines={1}>
          {group.name}
        </Text>
        <Button variant="ghost" className="min-h-0 py-1 px-2" onPress={() => setInviteOpen(true)}>
          {t('groups.invite')}
        </Button>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {group.description ? <Text className="text-muted mb-4">{group.description}</Text> : null}
        <Text className="text-foreground font-bold mb-2">{t('groups.members')}</Text>
        {members.map(
          (m: {
            user_id: string;
            role: string;
            profiles?: { display_name: string; username: string; avatar_url: string | null };
          }) => (
            <Card key={m.user_id} className="mb-2 flex-row items-center gap-3">
              <Avatar url={m.profiles?.avatar_url} name={m.profiles?.display_name ?? '?'} />
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{m.profiles?.display_name}</Text>
                <Text className="text-muted text-xs">{m.role}</Text>
              </View>
            </Card>
          ),
        )}
        <Text className="text-foreground font-bold mt-8 mb-2">{t('groups.leaderboard')}</Text>
        <FlatList
          scrollEnabled={false}
          data={lb}
          keyExtractor={(item: { id: string }) => item.id}
          renderItem={({ item, index }: { item: { id: string; display_name: string; total_aura: number }; index: number }) => (
            <Card className="mb-2 flex-row items-center gap-3">
              <Text className="text-muted w-8 font-bold">#{index + 1}</Text>
              <Text className="text-foreground flex-1 font-semibold">{item.display_name}</Text>
              <Text className="text-primary font-black">{item.total_aura}</Text>
            </Card>
          )}
        />
      </ScrollView>

      <AppModal visible={inviteOpen} onClose={() => setInviteOpen(false)} title={t('groups.invite')} footer={false}>
        <Text className="text-muted text-sm mb-2">Pick a friend</Text>
        {friends.map((f: { id: string; display_name: string }) => (
          <Pressable
            key={f.id}
            className="py-3 border-b border-border"
            onPress={() => {
              invite.mutate({ groupId: id, inviterId: uid, inviteeId: f.id });
              setInviteOpen(false);
            }}
          >
            <Text className="text-foreground">{f.display_name}</Text>
          </Pressable>
        ))}
      </AppModal>
    </View>
  );
}
