import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { fetchQuests } from '@/services/quests';
import { appLang } from '@/utils/lang';
import { questTitle } from '@/utils/questCopy';

const QUICK_COMPLETE_MAX_ITEMS = 40;

export default function QuickCompleteScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = appLang(i18n);
  const [search, setSearch] = useState('');

  const { data: quests = [], isFetching } = useQuery({
    queryKey: ['quick-complete-quests', search],
    queryFn: () => fetchQuests({ search }),
  });

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('quickComplete.title')} />
      <View className="p-4">
        <Input value={search} onChangeText={setSearch} placeholder={t('quickComplete.placeholder')} />
        <Text className="text-muted text-xs mt-2">{t('quickComplete.hint')}</Text>
      </View>
      <FlatList
        data={quests.slice(0, QUICK_COMPLETE_MAX_ITEMS)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          isFetching ? null : <Text className="text-muted text-center px-4">{t('quickComplete.empty')}</Text>
        }
        renderItem={useCallback(({ item }: { item: (typeof quests)[number] }) => (
          <Pressable onPress={() => router.push(`/(main)/complete-quest/${item.id}`)}>
            <Card className="mb-2">
              <View className="flex-row justify-between items-start gap-2">
                <Text className="text-foreground font-bold flex-1">{questTitle(item, lang)}</Text>
                <Badge tone="primary">+{item.aura_reward}</Badge>
              </View>
            </Card>
          </Pressable>
        ), [router, lang])}
      />
    </View>
  );
}
