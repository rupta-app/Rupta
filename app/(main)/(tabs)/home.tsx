import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { fetchCompletionCounts } from '@/services/completions';
import { useAuth } from '@/providers/AuthProvider';
import type { HomeFeedFilter } from '@/services/feed';
import { useFriendIds, useHomeFeed, useSuggestedQuest } from '@/hooks/useFeed';
import { questTitle } from '@/utils/questCopy';
import { useQuery } from '@tanstack/react-query';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { profile, session, refreshProfile } = useAuth();

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile]),
  );
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const [feedFilter, setFeedFilter] = useState<HomeFeedFilter>('all');
  const { data: friendIds = [] } = useFriendIds(session?.user?.id);
  const { data: feed = [], isLoading, refetch, isRefetching } = useHomeFeed(
    session?.user?.id,
    friendIds,
    feedFilter,
  );
  const { data: suggested } = useSuggestedQuest(session?.user?.id, profile?.preferred_categories ?? []);

  const completionIds = useMemo(() => feed.map((f) => f.id), [feed]);
  const { data: countsMap } = useQuery({
    queryKey: ['feed-counts', completionIds.join(',')],
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

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="home" />
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#8B5CF6" />}
      >
        <View className="flex-row flex-wrap gap-2 mb-4">
          {(['all', 'official', 'unofficial'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFeedFilter(f)}
              className={`px-3 py-2 rounded-lg border ${feedFilter === f ? 'border-primary' : 'border-border'}`}
            >
              <Text className="text-foreground text-sm">
                {f === 'all' ? t('feed.filterAll') : f === 'official' ? t('feed.filterOfficial') : t('feed.filterUnofficial')}
              </Text>
            </Pressable>
          ))}
        </View>
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
          <ActivityIndicator color="#8B5CF6" className="mt-8" />
        ) : posts.length === 0 ? (
          <Text className="text-muted text-center mt-10 px-4">{t('feed.empty')}</Text>
        ) : (
          posts.map((p) => <FeedPostCard key={p.id} post={p} lang={lang} viewerId={session?.user?.id} />)
        )}
      </ScrollView>
    </View>
  );
}
