import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Settings, UserPlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useGroupDetail, useGroupLeaderboard } from '@/hooks/useGroups';
import { useGroupFeed } from '@/hooks/useFeed';
import { useGroupQuestsList } from '@/hooks/useGroupQuests';
import { useAuth } from '@/providers/AuthProvider';
import { fetchCompletionCounts } from '@/services/completions';
import { useQuery } from '@tanstack/react-query';

type Section = 'rankings' | 'feed' | 'quests';

const TAB_BAR: { key: Section; labelKey: string }[] = [
  { key: 'rankings', labelKey: 'groups.sectionRankings' },
  { key: 'feed', labelKey: 'groups.sectionFeed' },
  { key: 'quests', labelKey: 'groups.sectionQuests' },
];

type LbRow = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  total_group_aura?: number;
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const go = (path: string) => (router as { push: (p: string) => void }).push(path);
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const { session, profile } = useAuth();
  const uid = session?.user?.id ?? profile?.id;
  const [section, setSection] = useState<Section>('rankings');

  const { data, isLoading } = useGroupDetail(id);
  const { data: lb = [] } = useGroupLeaderboard(id);
  const { data: gQuests = [] } = useGroupQuestsList(id, uid);
  const { data: feed = [], isLoading: feedLoading } = useGroupFeed(id);

  const completionIds = useMemo(() => feed.map((f) => f.id), [feed]);
  const { data: countsMap } = useQuery({
    queryKey: ['group-feed-counts', completionIds.join(',')],
    queryFn: () => fetchCompletionCounts(completionIds),
    enabled: completionIds.length > 0,
  });

  const posts = useMemo(
    () =>
      feed.map((p) => ({
        ...p,
        respectCount: countsMap?.get(p.id)?.respects ?? 0,
        commentCount: countsMap?.get(p.id)?.comments ?? 0,
      })),
    [feed, countsMap],
  );

  const myMember = data?.members.find((m: { user_id: string }) => m.user_id === uid);
  const canAdmin = myMember?.role === 'owner' || myMember?.role === 'admin';

  if (isLoading || !data) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const { group } = data;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border gap-2">
        <Pressable onPress={() => router.back()} className="p-2 shrink-0">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Avatar url={group.avatar_url} name={group.name} size={44} />
        <View className="flex-1 min-w-0 pr-1">
          <Text className="text-foreground font-bold text-lg" numberOfLines={1}>
            {group.name}
          </Text>
          {group.description ? (
            <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
              {group.description}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={() => go(`/(main)/group/${id}/people`)} className="p-2.5 shrink-0" hitSlop={6}>
          <UserPlus color="#A78BFA" size={24} strokeWidth={2} />
        </Pressable>
        {canAdmin ? (
          <Pressable onPress={() => go(`/(main)/group/${id}/settings`)} className="p-2.5 shrink-0" hitSlop={6}>
            <Settings color="#94A3B8" size={24} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row border-b border-border">
        {TAB_BAR.map(({ key, labelKey }) => {
          const active = section === key;
          return (
            <Pressable
              key={key}
              onPress={() => setSection(key)}
              className="flex-1 py-3 px-1 items-center border-b-2"
              style={{ borderBottomColor: active ? '#8B5CF6' : 'transparent' }}
            >
              <Text
                className={`text-sm font-bold text-center ${active ? 'text-primary' : 'text-muted'}`}
                numberOfLines={1}
              >
                {t(labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {section === 'rankings' ? (
          <>
            <Text className="text-foreground font-bold mb-3">{t('groups.groupAuraRanks')}</Text>
            {lb.length === 0 ? (
              <Text className="text-muted">{t('feed.empty')}</Text>
            ) : (
              (lb as LbRow[]).map((item, index) => (
                <Pressable key={item.id} onPress={() => router.push(`/(main)/user/${item.id}`)}>
                  <Card className="mb-2 flex-row items-center gap-3 py-3">
                    <Text className="text-muted w-7 text-lg font-bold">#{index + 1}</Text>
                    <Avatar url={item.avatar_url} name={item.display_name} size={40} />
                    <View className="flex-1 min-w-0">
                      <Text className="text-foreground font-semibold">{item.display_name}</Text>
                      <Text className="text-muted text-xs">@{item.username}</Text>
                    </View>
                    <Text className="text-primary font-black">{item.total_group_aura ?? 0}</Text>
                  </Card>
                </Pressable>
              ))
            )}
          </>
        ) : null}

        {section === 'feed' ? (
          <>
            {feedLoading ? (
              <ActivityIndicator color="#8B5CF6" />
            ) : posts.length === 0 ? (
              <Text className="text-muted">{t('feed.empty')}</Text>
            ) : (
              posts.map((p) => <FeedPostCard key={p.id} post={p} lang={lang} viewerId={uid} />)
            )}
          </>
        ) : null}

        {section === 'quests' ? (
          <>
            <Button className="mb-4" onPress={() => go(`/(main)/group/${id}/create-quest`)}>
              {t('groups.createQuest')}
            </Button>
            {gQuests.length === 0 ? (
              <Text className="text-muted">{t('feed.empty')}</Text>
            ) : null}
            {gQuests.map(
              (q: {
                id: string;
                title: string;
                aura_reward: number;
                status: string;
              }) => (
                <Pressable key={q.id} onPress={() => go(`/(main)/group-quest/${q.id}`)}>
                  <Card className="mb-2 py-3">
                    <View className="flex-row justify-between items-start gap-2">
                      <Text className="text-foreground font-bold flex-1">{q.title}</Text>
                      <Badge tone="respect">+{q.aura_reward}</Badge>
                    </View>
                    <Text className="text-muted text-xs mt-2 uppercase">{q.status}</Text>
                  </Card>
                </Pressable>
              ),
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
