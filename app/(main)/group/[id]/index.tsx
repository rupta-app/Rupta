import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Settings, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { SegmentedTabBar } from '@/components/ui/SegmentedTabBar';
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
import { useFeedWithCounts } from '@/hooks/useFeedWithCounts';
import { useAuth } from '@/providers/AuthProvider';
import { appLang } from '@/utils/lang';

type Section = 'rankings' | 'feed' | 'quests';

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

  const posts = useFeedWithCounts(feed, 'group-feed-counts');

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

      <SegmentedTabBar
        tabs={[
          { key: 'rankings' as const, label: t('groups.sectionRankings') },
          { key: 'feed' as const, label: t('groups.sectionFeed') },
          { key: 'quests' as const, label: t('groups.sectionQuests') },
        ]}
        active={section}
        onChange={setSection}
      />

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
