import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { fetchQuests } from '@/services/quests';
import { questTitle } from '@/utils/questCopy';

export default function QuickCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const [search, setSearch] = useState('');

  const { data: quests = [], isFetching } = useQuery({
    queryKey: ['quick-complete-quests', search],
    queryFn: () => fetchQuests({ search }),
  });

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1 flex-1">{t('quickComplete.title')}</Text>
      </View>
      <View className="p-4">
        <Input value={search} onChangeText={setSearch} placeholder={t('quickComplete.placeholder')} />
        <Text className="text-muted text-xs mt-2">{t('quickComplete.hint')}</Text>
      </View>
      <FlatList
        data={quests.slice(0, 40)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          isFetching ? null : <Text className="text-muted text-center px-4">{t('quickComplete.empty')}</Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(main)/complete-quest/${item.id}`)}>
            <Card className="mb-2">
              <View className="flex-row justify-between items-start gap-2">
                <Text className="text-foreground font-bold flex-1">{questTitle(item, lang)}</Text>
                <Badge tone="primary">+{item.aura_reward}</Badge>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
