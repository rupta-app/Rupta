import { useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookmarkPlus } from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
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
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        ListEmptyComponent={
          <EmptyState
            icon={BookmarkPlus}
            title={t('empty.noLifeList')}
            subtitle={t('empty.noLifeListCta')}
            action={{ label: t('empty.feedCta'), onPress: () => router.push('/(main)/(tabs)/explore') }}
          />
        }
        renderItem={({ item }) => (
          <PressableScale onPress={() => router.push(`/(main)/quest/${item.quest_id}`)} scaleValue={0.98}>
            <Card className="mb-2">
              <Text className="text-foreground font-bold">
                {item.quests ? questTitle(item.quests, lang) : 'Quest'}
              </Text>
            </Card>
          </PressableScale>
        )}
      />
    </View>
  );
}
