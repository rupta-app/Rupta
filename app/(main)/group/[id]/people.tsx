import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { useFriendsList } from '@/hooks/useFriends';
import { useGroupDetail, useInviteToGroup } from '@/hooks/useGroups';
import { useAuth } from '@/providers/AuthProvider';

export default function GroupPeopleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const { data, isLoading } = useGroupDetail(id);
  const { data: friends = [] } = useFriendsList(uid);
  const invite = useInviteToGroup();

  if (isLoading || !data) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const { group, members } = data;
  const memberCount = members.length;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('groups.people')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text className="text-muted text-sm mb-4">
          {t('groups.peopleSubtitle', { count: memberCount })}
        </Text>

        <Text className="text-foreground font-bold text-base mb-2">{t('groups.invite')}</Text>
        <Text className="text-muted text-sm mb-3">{t('groups.invitePick')}</Text>
        {friends.length === 0 ? (
          <Text className="text-muted text-sm mb-8">{t('feed.empty')}</Text>
        ) : (
          friends.map((f: { id: string; display_name: string }) => (
            <Pressable
              key={f.id}
              className="py-4 border-b border-border"
              onPress={() =>
                invite.mutate({ groupId: id, inviterId: uid, inviteeId: f.id })
              }
            >
              <Text className="text-foreground font-medium">{f.display_name}</Text>
            </Pressable>
          ))
        )}

        <Text className="text-foreground font-bold text-base mt-8 mb-3">
          {t('groups.members')} ({memberCount})
        </Text>
        {members.map(
          (m: {
            user_id: string;
            role: string;
            profiles?: { display_name: string; avatar_url: string | null };
          }) => (
            <Pressable key={m.user_id} onPress={() => router.push(`/(main)/user/${m.user_id}`)}>
              <Card className="mb-3 flex-row items-center gap-3 py-3">
                <Avatar url={m.profiles?.avatar_url} name={m.profiles?.display_name ?? '?'} size={48} />
                <View className="flex-1">
                  <Text className="text-foreground font-semibold text-base">{m.profiles?.display_name}</Text>
                  <Text className="text-muted text-xs mt-1">
                    {m.role === 'owner'
                      ? t('groups.memberOwner')
                      : m.role === 'admin'
                        ? t('groups.memberAdmin')
                        : m.role}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ),
        )}
      </ScrollView>
    </View>
  );
}
