import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { useLifeList } from '@/hooks/useQuests';
import { useAuth } from '@/providers/AuthProvider';
import { questTitle } from '@/utils/questCopy';

export default function LifeListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: rows = [] } = useLifeList(uid);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1">{t('common.lifeList')}</Text>
      </View>
      <FlatList
        data={rows as { quest_id: string; quests: Parameters<typeof questTitle>[0] }[]}
        keyExtractor={(item) => item.quest_id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text className="text-muted text-center mt-8">{t('profile.emptyLifeList')}</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(main)/quest/${item.quest_id}`)}>
            <Card className="mb-2">
              <Text className="text-foreground font-bold">
                {item.quests ? questTitle(item.quests, lang) : 'Quest'}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}
