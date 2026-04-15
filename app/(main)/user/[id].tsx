import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { auraLevelFromTotal } from '@/lib/aura';
import { FriendRequestActions } from '@/components/social/FriendRequestActions';
import { useFriendsList, useSendFriendRequest } from '@/hooks/useFriends';
import { blockUser } from '@/services/reports';
import { fetchFriendRequestRelation } from '@/services/friends';
import { fetchProfile, fetchProfileStats, fetchRecentCompletions } from '@/services/profile';
import { useAuth } from '@/providers/AuthProvider';
import { RecentCompletionsList } from '@/components/social/RecentCompletionsList';
import { appLang } from '@/utils/lang';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = appLang(i18n);
  const { session } = useAuth();
  const uid = session?.user?.id;
  const sendReq = useSendFriendRequest();
  const { data: friends = [] } = useFriendsList(uid);

  const { data: profile } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => fetchProfile(id),
    enabled: Boolean(id),
  });

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', id],
    queryFn: () => fetchProfileStats(id),
    enabled: Boolean(id),
  });

  const { data: recent = [] } = useQuery({
    queryKey: ['profile-recent', id],
    queryFn: () => fetchRecentCompletions(id),
    enabled: Boolean(id),
  });

  const { data: relation, isPending: relationPending } = useQuery({
    queryKey: ['friend-relation', uid, id],
    queryFn: () => fetchFriendRequestRelation(uid!, id!),
    enabled: Boolean(uid && id && uid !== id),
  });

  if (!profile) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const level = auraLevelFromTotal(profile.total_aura);
  const isFriend = friends.some((f: { id: string }) => f.id === id);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={profile.display_name} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="flex-row items-center gap-4">
          <Avatar url={profile.avatar_url} name={profile.display_name} size={72} />
          <View className="flex-1">
            <Text className="text-foreground text-2xl font-bold">{profile.display_name}</Text>
            <Text className="text-muted">@{profile.username}</Text>
            <Text className="text-primary mt-1">
              {t('common.auraLevel')} {level} · {profile.total_aura} AURA
            </Text>
          </View>
        </View>
        {profile.bio ? <Text className="text-muted mt-4">{profile.bio}</Text> : null}

        {uid && uid !== id ? (
          <View className="mt-6 gap-3">
            {isFriend ? (
              <Text className="text-muted text-center">{t('friends.alreadyFriends')}</Text>
            ) : relationPending ? (
              <Button variant="secondary" disabled loading onPress={() => {}}>
                {t('common.loading')}
              </Button>
            ) : relation?.kind === 'incoming' ? (
              <FriendRequestActions requestId={relation.requestId} />
            ) : relation?.kind === 'outgoing' ? (
              <Button variant="secondary" disabled onPress={() => {}}>
                {t('friends.pending')}
              </Button>
            ) : (
              <Button variant="secondary" onPress={() => sendReq.mutate({ senderId: uid, receiverId: id })}>
                {t('friends.addFriend')}
              </Button>
            )}
            <Button
              variant="ghost"
              onPress={async () => {
                await blockUser(uid, id);
                router.back();
              }}
            >
              {t('social.blockUser')}
            </Button>
          </View>
        ) : null}

        <View className="flex-row flex-wrap gap-3 mt-6">
          <Card className="flex-1 min-w-[40%]">
            <Text className="text-muted text-xs">{t('profile.questsDone')}</Text>
            <Text className="text-foreground text-xl font-bold">{stats?.questsCompleted ?? '—'}</Text>
          </Card>
        </View>

        <RecentCompletionsList completions={recent} lang={lang} />
      </ScrollView>
    </View>
  );
}
