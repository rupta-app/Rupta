import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Bookmark,
  Dices,
  Dumbbell,
  Mountain,
  Users,
  Palette,
  Plane,
  UtensilsCrossed,
  BookOpen,
  Sparkles,
  Brain,
  Search,
  Zap,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { FeedPostSkeleton } from '@/components/ui/SkeletonLoader';
import { PressableScale } from '@/components/ui/PressableScale';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QUEST_CATEGORIES } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useInfiniteQuests, usePrefetchCategoryPages, useSavedQuestIds, useToggleSave } from '@/hooks/useQuests';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { appLang } from '@/utils/lang';
import { questTitle, questDescription } from '@/utils/questCopy';

const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; accent: string; bg: string }> = {
  fitness: { icon: Dumbbell, accent: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  outdoors: { icon: Mountain, accent: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  social: { icon: Users, accent: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  creativity: { icon: Palette, accent: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  travel: { icon: Plane, accent: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  food: { icon: UtensilsCrossed, accent: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  learning: { icon: BookOpen, accent: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  random: { icon: Sparkles, accent: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  personal_growth: { icon: Brain, accent: '#2DD4A0', bg: 'rgba(45,212,160,0.12)' },
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  legendary: 'Legendary',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
  legendary: '#A78BFA',
};

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
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 2,
            paddingBottom: 6,
            gap: 8,
            alignItems: 'center',
            flexDirection: 'row',
          }}
        >
          <PillToggleGroup
            options={[
              { value: 'all', label: 'All' },
              ...QUEST_CATEGORIES.map((c) => ({ value: c, label: formatCategoryLabel(c, lang) })),
            ]}
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
        contentContainerStyle={{ paddingBottom: 120 }}
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
        renderItem={({ item }) => {
          const isSaved = saved.has(item.id);
          const cat = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.random;
          const CatIcon = cat.icon;
          const diffColor = DIFFICULTY_COLOR[item.difficulty] ?? colors.muted;
          const diffLabel = DIFFICULTY_LABEL[item.difficulty] ?? item.difficulty;
          const desc = questDescription(item, lang);
          return (
            <PressableScale onPress={() => router.push(`/(main)/quest/${item.id}`)} className="px-4 mb-3" scaleValue={0.97}>
              <View className="bg-surface rounded-2xl p-4" style={{ borderLeftWidth: 3, borderLeftColor: cat.accent }}>
                <View className="flex-row items-center mb-2.5">
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center mr-2.5"
                    style={{ backgroundColor: cat.bg }}
                  >
                    <CatIcon color={cat.accent} size={16} strokeWidth={2.5} />
                  </View>
                  <Text className="text-xs font-semibold" style={{ color: cat.accent }}>
                    {formatCategoryLabel(item.category, lang)}
                  </Text>
                  <View className="flex-1" />
                  <View className="flex-row items-center mr-3">
                    <Zap color={diffColor} size={12} strokeWidth={2.5} fill={diffColor} />
                    <Text className="text-xs font-semibold ml-1" style={{ color: diffColor }}>
                      {diffLabel}
                    </Text>
                  </View>
                  <PressableScale
                    onPress={() => toggle.mutate({ questId: item.id, currentlySaved: isSaved })}
                    hitSlop={10}
                    scaleValue={0.9}
                  >
                    <Bookmark
                      color={isSaved ? colors.secondary : colors.muted}
                      fill={isSaved ? colors.secondary : 'none'}
                      size={20}
                      strokeWidth={2}
                    />
                  </PressableScale>
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
                    style={{ backgroundColor: 'rgba(139,108,255,0.12)' }}
                  >
                    <Text className="text-primary text-xs font-bold">+{item.aura_reward} AURA</Text>
                  </View>
                </View>
              </View>
            </PressableScale>
          );
        }}
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
