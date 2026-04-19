import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { FileText, Settings, Swords, Trophy, UserPlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { SegmentedTabBar } from '@/components/ui/SegmentedTabBar';
import { colors } from '@/constants/theme';

import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { GroupQuestCard } from '@/components/social/GroupQuestCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PressableScale } from '@/components/ui/PressableScale';
import { FeedPostSkeleton, Skeleton } from '@/components/ui/SkeletonLoader';
import { useGroupDetail, useGroupLeaderboard, useMyGroupPermissions } from '@/hooks/useGroups';
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

  const { data, isLoading, isError, refetch, isRefetching } = useGroupDetail(id);
  const { canAdmin } = useMyGroupPermissions(id, uid);
  const { data: lb = [], isLoading: lbLoading } = useGroupLeaderboard(id);
  const { data: gQuests = [], isLoading: questsLoading } = useGroupQuestsList(id, uid, canAdmin);
  const { data: feedData, isLoading: feedLoading } = useGroupFeed(id);
  const feed = useMemo(() => feedData?.pages.flatMap((p) => p.posts) ?? [], [feedData]);

  const posts = useFeedWithCounts(feed, 'group', uid);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="" />
        <View className="p-4 gap-3">
          <Skeleton width="100%" height={56} rounded="lg" />
          <Skeleton width="100%" height={72} rounded="lg" />
          <Skeleton width="100%" height={72} rounded="lg" />
          <Skeleton width="100%" height={72} rounded="lg" />
        </View>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={t('common.error')} />
        <ErrorState title={t('common.error')} subtitle={t('common.errorSubtitle')} />
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
            <PressableScale onPress={() => go(`/(main)/group/${id}/people`)} className="p-2.5 shrink-0" hitSlop={12} scaleValue={0.9}>
              <UserPlus color={colors.primaryLight} size={24} strokeWidth={2} />
            </PressableScale>
            {canAdmin ? (
              <PressableScale onPress={() => go(`/(main)/group/${id}/settings`)} className="p-2.5 shrink-0" hitSlop={12} scaleValue={0.9}>
                <Settings color={colors.muted} size={24} strokeWidth={2} />
              </PressableScale>
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

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
      >
        {section === 'rankings' ? (
          <Animated.View entering={FadeIn.duration(200)} key="rankings">
            <Text className="text-foreground font-bold mb-3">{t('groups.groupAuraRanks')}</Text>
            {lbLoading ? (
              <View className="gap-2">
                <Skeleton width="100%" height={64} rounded="lg" />
                <Skeleton width="100%" height={64} rounded="lg" />
                <Skeleton width="100%" height={64} rounded="lg" />
              </View>
            ) : lb.length === 0 ? (
              <EmptyState icon={Trophy} title={t('empty.noResults')} />
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
          </Animated.View>
        ) : null}

        {section === 'feed' ? (
          <Animated.View entering={FadeIn.duration(200)} key="feed">
            {feedLoading ? (
              <>
                <FeedPostSkeleton />
                <FeedPostSkeleton />
              </>
            ) : posts.length === 0 ? (
              <EmptyState icon={FileText} title={t('empty.noResults')} />
            ) : (
              posts.map((p) => <FeedPostCard key={p.id} post={p} lang={lang} viewerId={uid} />)
            )}
          </Animated.View>
        ) : null}

        {section === 'quests' ? (
          <Animated.View entering={FadeIn.duration(200)} key="quests">
            <Button className="mb-4" onPress={() => go(`/(main)/group/${id}/create-quest`)}>
              {t('groups.createQuest')}
            </Button>
            {questsLoading ? (
              <View className="gap-2">
                <Skeleton width="100%" height={72} rounded="lg" />
                <Skeleton width="100%" height={72} rounded="lg" />
              </View>
            ) : gQuests.length === 0 ? (
              <EmptyState
                icon={Swords}
                title={t('groups.noQuestsYet')}
                subtitle={t('groups.noQuestsYetCta')}
              />
            ) : (
              gQuests.map((q) => (
                <GroupQuestCard
                  key={q.id}
                  quest={q}
                  onPress={() => go(`/(main)/group-quest/${q.id}`)}
                />
              ))
            )}
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}
