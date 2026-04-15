import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Compass, Plus } from 'lucide-react-native';

import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FeedPostSkeleton } from '@/components/ui/SkeletonLoader';
import { PressableScale } from '@/components/ui/PressableScale';
import { CATEGORY_CONFIG } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { useAuth } from '@/providers/AuthProvider';
import type { Database } from '@/types/database';
import type { HomeFeedFilter } from '@/services/feed';
import type { FeedPost } from '@/services/feed';
import { useFriendIds, useHomeFeed, useSuggestedQuest } from '@/hooks/useFeed';
import { useFeedWithCounts } from '@/hooks/useFeedWithCounts';
import { appLang } from '@/utils/lang';
import { questTitle } from '@/utils/questCopy';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { profile, session, refreshProfile } = useAuth();

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile]),
  );
  const lang = appLang(i18n);
  const [feedFilter, setFeedFilter] = useState<HomeFeedFilter>('all');
  const { data: friendIds = [] } = useFriendIds(session?.user?.id);
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useHomeFeed(session?.user?.id, friendIds, feedFilter);
  const { data: suggested } = useSuggestedQuest(session?.user?.id, profile?.preferred_categories ?? []);

  const feed = useMemo(() => data?.pages.flatMap((p) => p.posts) ?? [], [data]);
  const posts = useFeedWithCounts(feed, 'feed-counts');
  const viewerId = session?.user?.id ?? profile?.id;

  const renderItem = useCallback(
    ({ item }: { item: FeedPost & { respectCount: number; commentCount: number } }) => (
      <FeedPostCard post={item} lang={lang} viewerId={viewerId} />
    ),
    [lang, viewerId],
  );

  const keyExtractor = useCallback((item: FeedPost) => item.id, []);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const listHeader = (
    <>
      <PillToggleGroup
        options={[
          { value: 'all' as const, label: t('feed.filterAll') },
          { value: 'official' as const, label: t('feed.filterOfficial') },
          { value: 'unofficial' as const, label: t('feed.filterUnofficial') },
        ]}
        selected={feedFilter}
        onToggle={setFeedFilter}
        containerClassName="flex-row flex-wrap gap-2 mb-4"
      />
      {suggested ? (
        <SuggestedQuestRow quest={suggested} lang={lang} />
      ) : null}
    </>
  );

  const listFooter = isFetchingNextPage ? (
    <View className="py-4 items-center">
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : null;

  const listEmpty = isError ? (
    <ErrorState
      title={t('common.error')}
      subtitle={t('common.errorSubtitle')}
      onRetry={() => void refetch()}
      retryLabel={t('common.retry')}
    />
  ) : isLoading ? (
    <>
      <FeedPostSkeleton />
      <FeedPostSkeleton />
    </>
  ) : (
    <EmptyState
      icon={Compass}
      title={t('empty.feedTitle')}
      subtitle={t('empty.feedSubtitle')}
      action={{ label: t('empty.feedCta'), onPress: () => router.push('/(main)/(tabs)/explore') }}
    />
  );

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="home" />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48, flexGrow: 1 }}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={listEmpty}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
        }
      />

      <PressableScale
        onPress={() => router.push('/(main)/spontaneous-sidequest' as never)}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        scaleValue={0.9}
        haptic
      >
        <Plus color={colors.white} size={24} />
      </PressableScale>
    </View>
  );
}

function SuggestedQuestRow({ quest, lang }: { quest: Database['public']['Tables']['quests']['Row']; lang: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const cat = CATEGORY_CONFIG[quest.category ?? ''] ?? CATEGORY_CONFIG.random;
  const CatIcon = cat.icon;

  return (
    <PressableScale
      onPress={() => router.push(`/(main)/quest/${quest.id}`)}
      scaleValue={0.97}
      className="bg-surface rounded-2xl px-3.5 py-3 mb-4"
    >
      <Text className="text-mutedForeground text-xs font-semibold mb-2">
        {t('feed.suggested')}
      </Text>
      <View className="flex-row items-center">
        <View
          className="w-9 h-9 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: cat.bg }}
        >
          <CatIcon color={cat.accent} size={18} strokeWidth={2.2} />
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: cat.accent }}>
            {formatCategoryLabel(quest.category ?? 'random', lang)}
          </Text>
          <Text className="text-foreground text-sm font-bold mt-0.5" numberOfLines={1}>
            {questTitle(quest, lang)}
          </Text>
        </View>
        <View
          className="rounded-full px-2 py-0.5 mr-2"
          style={{ backgroundColor: colors.primaryGlow }}
        >
          <Text className="text-primary text-xs font-bold">+{quest.aura_reward}</Text>
        </View>
        <ChevronRight color={colors.mutedForeground} size={16} strokeWidth={2} />
      </View>
    </PressableScale>
  );
}
