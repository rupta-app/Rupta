import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react-native';

import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { FeedPostSkeleton } from '@/components/ui/SkeletonLoader';
import { colors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/providers/AuthProvider';
import type { HomeFeedFilter } from '@/services/feed';
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
  const { data: feed = [], isLoading, refetch, isRefetching } = useHomeFeed(
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
          activeClassName="border-primary"
          inactiveClassName="border-border"
          containerClassName="flex-row flex-wrap gap-2 mb-4"
        />
        {suggested ? (
          <Card className="mb-4 border-primary/40">
            <Text className="text-muted text-xs uppercase">{t('feed.suggested')}</Text>
            <Text className="text-foreground text-lg font-bold mt-1">
              {questTitle(suggested, lang)}
            </Text>
            <Button
              className="mt-3"
              onPress={() => router.push(`/(main)/quest/${suggested.id}`)}
              variant="secondary"
            >
              {t('quest.detail')}
            </Button>
          </Card>
        ) : null}

        {isLoading ? (
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
    </View>
  );
}
