import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Settings, UserPlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { colors } from '@/constants/theme';

import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useGroupDetail, useGroupLeaderboard } from '@/hooks/useGroups';
import { useGroupFeed } from '@/hooks/useFeed';
import { useGroupQuestsList } from '@/hooks/useGroupQuests';
import { useAuth } from '@/providers/AuthProvider';
import { fetchCompletionCounts } from '@/services/completions';
import { appLang } from '@/utils/lang';
import { useQuery } from '@tanstack/react-query';

type Section = 'rankings' | 'feed' | 'quests';

const TAB_BAR: { key: Section; labelKey: string }[] = [
  { key: 'rankings', labelKey: 'groups.sectionRankings' },
  { key: 'feed', labelKey: 'groups.sectionFeed' },
  { key: 'quests', labelKey: 'groups.sectionQuests' },
];

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const go = (path: string) => router.push(path as Href);
  const { t, i18n } = useTranslation();
  const lang = appLang(i18n);
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
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={group.name}
        right={
          <View className="flex-row items-center">
            <Pressable onPress={() => go(`/(main)/group/${id}/people`)} className="p-2.5 shrink-0" hitSlop={6}>
              <UserPlus color={colors.primaryLight} size={24} strokeWidth={2} />
            </Pressable>
            {canAdmin ? (
              <Pressable onPress={() => go(`/(main)/group/${id}/settings`)} className="p-2.5 shrink-0" hitSlop={6}>
                <Settings color={colors.muted} size={24} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>
        }
      />

      <View className="flex-row border-b border-border">
        {TAB_BAR.map(({ key, labelKey }) => {
          const active = section === key;
          return (
            <Pressable
              key={key}
              onPress={() => setSection(key)}
              className="flex-1 py-3 px-1 items-center border-b-2"
              style={{ borderBottomColor: active ? colors.primary : 'transparent' }}
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
              lb.map((item, index) => (
                <LeaderboardRow
                  key={item.id}
                  rank={index + 1}
                  displayName={item.display_name}
                  username={item.username}
                  avatarUrl={item.avatar_url}
                  aura={item.total_group_aura ?? 0}
                  onPress={() => router.push(`/(main)/user/${item.id}`)}
                />
              ))
            )}
          </>
        ) : null}

        {section === 'feed' ? (
          <>
            {feedLoading ? (
              <ActivityIndicator color={colors.primary} />
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
