import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { auraLevelFromTotal } from '@/lib/aura';
import { useSendFriendRequest } from '@/hooks/useFriends';
import { blockUser } from '@/services/reports';
import { fetchProfile, fetchProfileStats, fetchRecentCompletions } from '@/services/profile';
import { useAuth } from '@/providers/AuthProvider';
import { questTitle } from '@/utils/questCopy';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const { session } = useAuth();
  const uid = session?.user?.id;
  const sendReq = useSendFriendRequest();

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

  if (!profile) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const level = auraLevelFromTotal(profile.total_aura);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
      </View>
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
            <Button variant="secondary" onPress={() => sendReq.mutate({ senderId: uid, receiverId: id })}>
              {t('friends.addFriend')}
            </Button>
            <Button
              variant="ghost"
              onPress={async () => {
                await blockUser(uid, id);
                router.back();
              }}
            >
              Block user
            </Button>
          </View>
        ) : null}

        <View className="flex-row flex-wrap gap-3 mt-6">
          <Card className="flex-1 min-w-[40%]">
            <Text className="text-muted text-xs">{t('profile.questsDone')}</Text>
            <Text className="text-foreground text-xl font-bold">{stats?.questsCompleted ?? '—'}</Text>
          </Card>
        </View>

        <Text className="text-foreground font-bold mt-8 mb-2">{t('profile.recent')}</Text>
        {recent.map((row: { id: string; quests?: { title_en: string; title_es: string }; aura_earned: number }) => (
          <Card key={row.id} className="mb-2 py-3">
            <Text className="text-foreground font-semibold">
              {row.quests ? questTitle(row.quests, lang) : 'Quest'}
            </Text>
            <Text className="text-primary text-sm">+{row.aura_earned}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
