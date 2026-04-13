import { useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { useLifeList } from '@/hooks/useQuests';
import { useAuth } from '@/providers/AuthProvider';
import { appLang } from '@/utils/lang';
import { questTitle } from '@/utils/questCopy';

export default function LifeListScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = appLang(i18n);
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: rows = [] } = useLifeList(uid);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('common.lifeList')} />
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
