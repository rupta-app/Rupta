import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bookmark, Dices, Search } from 'lucide-react-native';

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
import { useQuests, useSavedQuestIds, useToggleSave } from '@/hooks/useQuests';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { appLang } from '@/utils/lang';
import { questTitle } from '@/utils/questCopy';

export default function ExploreScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const go = (path: string) => (router as { push: (p: string) => void }).push(path);
  const lang = appLang(i18n);
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const { data: quests = [], isLoading, refetch, isRefetching } = useQuests({ category, search });
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

  const ListHeader = useCallback(
    () => (
      <View>
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
      </View>
    ),
    [category, lang, search, t],
  );

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="explore" />
      <FlatList
        style={{ flex: 1 }}
        data={quests}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={6}
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
          return (
            <PressableScale onPress={() => router.push(`/(main)/quest/${item.id}`)} className="px-4" scaleValue={0.98}>
              <View className="flex-row items-center py-3.5 border-b border-border/50">
                <View className="flex-1">
                  <Text className="text-foreground text-base font-semibold">{questTitle(item, lang)}</Text>
                  <Text className="text-mutedForeground text-xs mt-0.5">
                    {formatCategoryLabel(item.category, lang)}
                  </Text>
                </View>
                <Text className="text-primary text-sm font-bold mr-3">+{item.aura_reward}</Text>
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
