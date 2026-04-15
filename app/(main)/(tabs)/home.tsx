import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Compass, Plus, Sparkles } from 'lucide-react-native';

import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FeedPostSkeleton } from '@/components/ui/SkeletonLoader';
import { PressableScale } from '@/components/ui/PressableScale';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import type { HomeFeedFilter } from '@/services/feed';
import { useFriendIds, useHomeFeed, useSuggestedQuest } from '@/hooks/useFeed';
import { useFeedWithCounts } from '@/hooks/useFeedWithCounts';
import { appLang } from '@/utils/lang';
import { questTitle, questDescription } from '@/utils/questCopy';

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
  const { data: feed = [], isLoading, refetch, isRefetching, isError } = useHomeFeed(
    session?.user?.id,
    friendIds,
    feedFilter,
  );
  const { data: suggested } = useSuggestedQuest(session?.user?.id, profile?.preferred_categories ?? []);

  const posts = useFeedWithCounts(feed, 'feed-counts');

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="home" />
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
      >
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
          <View className="bg-surface rounded-3xl p-5 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Sparkles size={14} color={colors.primary} />
              <Text className="text-primary text-xs font-bold uppercase tracking-widest">
                {t('feed.suggested')}
              </Text>
            </View>
            <Text className="text-foreground text-xl font-bold">
              {questTitle(suggested, lang)}
            </Text>
            {suggested.description_en || suggested.description_es ? (
              <Text className="text-muted text-sm mt-1">
                {questDescription(suggested, lang)}
              </Text>
            ) : null}
            <Button
              className="mt-4"
              onPress={() => router.push(`/(main)/quest/${suggested.id}`)}
              variant="primary"
            >
              {t('quest.detail')}
            </Button>
          </View>
        ) : null}

        {isError ? (
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
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={t('empty.feedTitle')}
            subtitle={t('empty.feedSubtitle')}
            action={{ label: t('empty.feedCta'), onPress: () => router.push('/(main)/(tabs)/explore') }}
          />
        ) : (
          posts.map((p) => (
            <FeedPostCard
              key={p.id}
              post={p}
              lang={lang}
              viewerId={session?.user?.id ?? profile?.id}
            />
          ))
        )}
      </ScrollView>

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
