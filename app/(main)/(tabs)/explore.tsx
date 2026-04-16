import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bookmark, Dices, Search } from 'lucide-react-native';

import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { FeedPostSkeleton } from '@/components/ui/SkeletonLoader';
import { PressableScale } from '@/components/ui/PressableScale';
import { QuestCardHeader } from '@/components/ui/QuestCardHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CATEGORY_CONFIG, QUEST_CATEGORIES } from '@/constants/categories';
import { colors } from '@/constants/theme';
import type { Database } from '@/types/database';
import { useAuth } from '@/providers/AuthProvider';
import { useInfiniteQuests, usePrefetchCategoryPages, useSavedQuestIds, useToggleSave } from '@/hooks/useQuests';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { appLang } from '@/utils/lang';
import { questTitle, questDescription } from '@/utils/questCopy';

const PILL_SCROLL_STYLE = {
  paddingHorizontal: 16,
  paddingTop: 2,
  paddingBottom: 6,
  gap: 8,
  alignItems: 'center' as const,
  flexDirection: 'row' as const,
};
const LIST_CONTENT_STYLE = { paddingBottom: 120 };

export default function ExploreScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const go = (path: string) => (router as { push: (p: string) => void }).push(path);
  const lang = appLang(i18n);
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuests({ category, search });
  const quests = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const prefetch = usePrefetchCategoryPages();
  useEffect(() => { prefetch(); }, [prefetch]);

  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: saved = new Set<string>() } = useSavedQuestIds(uid);
  const toggle = useToggleSave(uid);

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All' },
      ...QUEST_CATEGORIES.map((c) => ({ value: c, label: formatCategoryLabel(c, lang) })),
    ],
    [lang],
  );

  const savedIds = saved;
  const renderItem = useCallback(
    ({ item }: { item: Database['public']['Tables']['quests']['Row'] }) => {
      const isSaved = savedIds.has(item.id);
      const cat = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.random;
      const desc = questDescription(item, lang);
      return (
        <PressableScale onPress={() => router.push(`/(main)/quest/${item.id}`)} className="px-4 mb-3" scaleValue={0.97}>
          <View className="bg-surface rounded-2xl p-4" style={{ borderLeftWidth: 3, borderLeftColor: cat.accent }}>
            <View className="mb-2.5">
              <QuestCardHeader category={item.category} difficulty={item.difficulty} lang={lang} size="sm">
                <PressableScale
                  onPress={() => toggle.mutate({ questId: item.id, currentlySaved: isSaved })}
                  hitSlop={10}
                  scaleValue={0.9}
                  className="ml-3"
                >
                  <Bookmark
                    color={isSaved ? colors.secondary : colors.muted}
                    fill={isSaved ? colors.secondary : 'none'}
                    size={20}
                    strokeWidth={2}
                  />
                </PressableScale>
              </QuestCardHeader>
            </View>
            <Text className="text-foreground text-base font-bold leading-5 mb-1" numberOfLines={2}>
              {questTitle(item, lang)}
            </Text>
            {desc ? (
              <Text className="text-muted text-sm leading-5 mb-3" numberOfLines={2}>
                {desc}
              </Text>
            ) : null}
            <View className="flex-row items-center">
              <View
                className="flex-row items-center rounded-full px-3 py-1"
                style={{ backgroundColor: colors.primaryGlow }}
              >
                <Text className="text-primary text-xs font-bold">+{item.aura_reward} AURA</Text>
              </View>
            </View>
          </View>
        </PressableScale>
      );
    },
    [savedIds, lang, toggle, router],
  );

  const ListFooter = useCallback(
    () => (
      <View className="py-10 px-4">
        <View className="bg-surface rounded-3xl p-5">
          <Text className="text-foreground font-bold text-base">{t('explore.suggestTitle')}</Text>
          <Text className="text-muted mt-2 leading-6">{t('explore.suggestBody')}</Text>
          <Button className="mt-4" variant="primary" onPress={() => go('/(main)/suggest-quest')}>
            {t('explore.suggestCta')}
          </Button>
        </View>
      </View>
    ),
    [go, t],
  );

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="explore" />

      <View className="px-4 pt-2 pb-2">
        <Input value={search} onChangeText={setSearch} placeholder={t('common.search')} />
      </View>
      <View className="bg-background">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          style={{ flexGrow: 0 }}
          contentContainerStyle={PILL_SCROLL_STYLE}
        >
          <PillToggleGroup
            options={categoryOptions}
            selected={category ?? 'all'}
            onToggle={(v) => setCategory(v === 'all' ? undefined : v)}
            containerClassName="flex-row gap-2"
          />
        </ScrollView>
      </View>
      <View className="h-3" />

      <FlatList
        style={{ flex: 1 }}
        data={quests}
        keyExtractor={(item) => item.id}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-6 items-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <ListFooter />
          )
        }
        contentContainerStyle={LIST_CONTENT_STYLE}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={5}
        maxToRenderPerBatch={4}
        ListEmptyComponent={
          isLoading ? (
            <View className="px-4">
              <FeedPostSkeleton />
              <FeedPostSkeleton />
            </View>
          ) : (
            <EmptyState icon={Search} title={t('empty.noResults')} />
          )
        }
        renderItem={renderItem}
      />

      <PressableScale
        onPress={() => go('/(main)/generator')}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        scaleValue={0.9}
        haptic
      >
        <Dices color={colors.white} size={24} />
      </PressableScale>
    </View>
  );
}
