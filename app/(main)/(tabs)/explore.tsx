import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { QUEST_CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/providers/AuthProvider';
import { useQuests, useSavedQuestIds, useToggleSave } from '@/hooks/useQuests';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { questTitle } from '@/utils/questCopy';

export default function ExploreScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const go = (path: string) => (router as { push: (p: string) => void }).push(path);
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const { data: quests = [], isLoading, refetch, isRefetching } = useQuests({ category, search });
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: saved = new Set<string>() } = useSavedQuestIds(uid);
  const toggle = useToggleSave(uid);

  const ListHeader = useCallback(
    () => (
      <>
        <MainAppHeader variant="explore" />
        <View className="px-4 pt-2 pb-3">
          <Input value={search} onChangeText={setSearch} placeholder={t('common.search')} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            gap: 8,
            alignItems: 'center',
            minHeight: 48,
          }}
        >
          <Pressable
            onPress={() => setCategory(undefined)}
            className={`px-4 py-2.5 rounded-full border ${!category ? 'border-primary bg-primary/15' : 'border-border bg-surface'}`}
          >
            <Text className="text-foreground text-sm font-medium">All</Text>
          </Pressable>
          {QUEST_CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                className={`px-4 py-2.5 rounded-full border ${active ? 'border-primary bg-primary/15' : 'border-border bg-surface'}`}
              >
                <Text className="text-foreground text-sm font-medium">{formatCategoryLabel(c, lang)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </>
    ),
    [category, lang, search, t],
  );

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
    [router, t],
  );

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={quests}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color="#8B5CF6" className="mt-8" />
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
