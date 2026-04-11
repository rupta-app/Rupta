import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import { colors } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { QUEST_CATEGORIES } from '@/constants/categories';
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
      <View className="py-10 px-2">
        <Card className="border-primary/30">
          <Text className="text-foreground font-bold text-base">{t('explore.suggestTitle')}</Text>
          <Text className="text-muted mt-2 leading-6">{t('explore.suggestBody')}</Text>
          <Button className="mt-4" variant="secondary" onPress={() => go('/(main)/suggest-quest')}>
            {t('explore.suggestCta')}
          </Button>
        </Card>
      </View>
    ),
    [go, t],
  );

  const ListHeader = useCallback(
    () => (
      <View>
        <View className="px-4 pt-2 pb-2">
          <Card className="border-primary/40">
            <Text className="text-foreground font-bold">{t('explore.generatorCtaTitle')}</Text>
            <Text className="text-muted text-sm mt-1">{t('explore.generatorCtaBody')}</Text>
            <Button className="mt-3" onPress={() => go('/(main)/generator')}>
              {t('explore.generatorCtaButton')}
            </Button>
          </Card>
        </View>
        <View className="px-4 pb-1">
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
    [category, go, lang, search, t],
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
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} className="mt-8" />
          ) : (
            <Text className="text-muted text-center mt-8 px-6">{t('explore.noResults')}</Text>
          )
        }
        renderItem={({ item }) => {
          const isSaved = saved.has(item.id);
          return (
            <Pressable onPress={() => router.push(`/(main)/quest/${item.id}`)} className="px-4">
              <Card className="mb-3">
                <View className="flex-row justify-between items-start gap-2">
                  <View className="flex-1 pr-2">
                    <Text className="text-foreground text-lg font-bold">{questTitle(item, lang)}</Text>
                    <Text className="text-muted text-xs mt-1 uppercase tracking-wide">
                      {formatCategoryLabel(item.category, lang)}
                    </Text>
                  </View>
                  <Badge tone="primary">+{item.aura_reward}</Badge>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    toggle.mutate({ questId: item.id, currentlySaved: isSaved });
                  }}
                  className="mt-3"
                >
                  <Text className="text-secondary text-sm font-semibold">
                    {isSaved ? t('quest.unsaved') : `+ ${t('common.lifeList')}`}
                  </Text>
                </Pressable>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
