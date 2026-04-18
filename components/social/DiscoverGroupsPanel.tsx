import { useRouter } from 'expo-router';
import { Globe, Search } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PublicGroupCard } from '@/components/social/PublicGroupCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { FeedPostSkeleton } from '@/components/ui/SkeletonLoader';
import { colors } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useJoinPublicGroup, usePublicGroups } from '@/hooks/useGroups';
import { useInfiniteEndReached } from '@/hooks/useInfiniteEndReached';
import { useAuth } from '@/providers/AuthProvider';
import type { PublicGroupRow } from '@/services/groups';

const SEARCH_DEBOUNCE_MS = 320;
const LIST_CONTENT_STYLE = { paddingBottom: 120 };
const HERO_SCROLL_STYLE = {
  paddingLeft: 16,
  paddingRight: 4,
  gap: 12,
  flexDirection: 'row' as const,
};

type DiscoverHeaderProps = {
  placeholder: string;
  heroes: PublicGroupRow[];
  heroSectionLabel: string;
  allSectionLabel: string;
  onJoin: (group: PublicGroupRow) => void;
  joiningId: string | null;
  onDebouncedSearchChange: (query: string) => void;
  showAllLabel: boolean;
};

// Local draft + debounce keeps list header stable so FlatList doesn't remount the TextInput on keystrokes.
const DiscoverHeader = memo(function DiscoverHeader({
  placeholder,
  heroes,
  heroSectionLabel,
  allSectionLabel,
  onJoin,
  joiningId,
  onDebouncedSearchChange,
  showAllLabel,
}: DiscoverHeaderProps) {
  const [draft, setDraft] = useState('');
  const debounced = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    onDebouncedSearchChange(debounced);
  }, [debounced, onDebouncedSearchChange]);

  return (
    <View className="bg-background">
      <View className="px-4 pt-2 pb-3">
        <Input value={draft} onChangeText={setDraft} placeholder={placeholder} />
      </View>

      {heroes.length > 0 ? (
        <View className="mb-2">
          <Text className="text-mutedForeground text-xs font-semibold uppercase tracking-wide px-4 mb-2">
            {heroSectionLabel}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={HERO_SCROLL_STYLE}
          >
            {heroes.map((group) => (
              <PublicGroupCard
                key={group.id}
                group={group}
                variant="hero"
                onJoin={onJoin}
                joining={joiningId === group.id}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {showAllLabel ? (
        <Text className="text-mutedForeground text-xs font-semibold uppercase tracking-wide px-4 mt-2 mb-2">
          {allSectionLabel}
        </Text>
      ) : null}
    </View>
  );
});

export function DiscoverGroupsPanel() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const uid = session?.user?.id;

  const [search, setSearch] = useState('');
  const infiniteQuery = usePublicGroups(search || undefined, true);
  const { data, isLoading, refetch, isFetchingNextPage } = infiniteQuery;
  const joinPublic = useJoinPublicGroup();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const groups = useMemo<PublicGroupRow[]>(
    () => data?.pages.flatMap((p) => p.rows) ?? [],
    [data],
  );

  const [heroes, rest] = useMemo(() => {
    if (search.trim().length > 0) return [[] as PublicGroupRow[], groups];
    if (groups.length >= 4) return [groups.slice(0, 3), groups.slice(3)];
    return [[] as PublicGroupRow[], groups];
  }, [groups, search]);

  const [pullRefreshing, setPullRefreshing] = useState(false);
  const onPullRefresh = useCallback(() => {
    setPullRefreshing(true);
    void refetch().finally(() => setPullRefreshing(false));
  }, [refetch]);

  const onEndReached = useInfiniteEndReached(infiniteQuery);

  const onJoin = useCallback(
    (group: PublicGroupRow) => {
      if (!uid) return;
      setJoiningId(group.id);
      joinPublic.mutate(
        { groupId: group.id, userId: uid },
        {
          onSuccess: () => {
            setJoiningId(null);
            router.push(`/(main)/group/${group.id}`);
          },
          onError: () => setJoiningId(null),
        },
      );
    },
    [uid, joinPublic, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: PublicGroupRow }) => (
      <View className="px-4">
        <PublicGroupCard
          group={item}
          variant="standard"
          onJoin={onJoin}
          joining={joiningId === item.id}
        />
      </View>
    ),
    [onJoin, joiningId],
  );

  const listEmpty = isLoading ? (
    <View className="px-4">
      <FeedPostSkeleton />
      <FeedPostSkeleton />
    </View>
  ) : search.trim().length > 0 ? (
    <EmptyState
      icon={Search}
      title={t('discoverGroups.emptySearchTitle')}
      subtitle={t('discoverGroups.emptySearchSubtitle')}
    />
  ) : (
    <EmptyState
      icon={Globe}
      title={t('discoverGroups.emptyTitle')}
      subtitle={t('discoverGroups.emptySubtitle')}
    />
  );

  return (
    <FlatList
      data={rest}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={LIST_CONTENT_STYLE}
      ListHeaderComponent={
        <DiscoverHeader
          placeholder={t('discoverGroups.searchPlaceholder')}
          heroes={heroes}
          heroSectionLabel={t('discoverGroups.featuredSection')}
          allSectionLabel={t('discoverGroups.allSection')}
          onJoin={onJoin}
          joiningId={joiningId}
          onDebouncedSearchChange={setSearch}
          showAllLabel={heroes.length > 0 && rest.length > 0}
        />
      }
      ListEmptyComponent={listEmpty}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4 items-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      refreshControl={
        <RefreshControl
          refreshing={pullRefreshing}
          onRefresh={onPullRefresh}
          tintColor={colors.primary}
        />
      }
    />
  );
}
