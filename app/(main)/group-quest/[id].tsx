import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useGroupQuest, useSubmitGroupQuestForReview } from '@/hooks/useGroupQuests';
import { useAuth } from '@/providers/AuthProvider';

export default function GroupQuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const go = (path: string) => (router as { push: (p: string) => void }).push(path);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const { data: q, isLoading } = useGroupQuest(id);
  const submit = useSubmitGroupQuestForReview();

  if (isLoading || !q) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const isCreator = q.creator_id === uid;
  const canComplete = q.status === 'active';

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1 flex-1" numberOfLines={2}>
          {q.title}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View className="flex-row flex-wrap gap-2 mb-4">
          <Badge tone="respect">+{q.aura_reward} AURA</Badge>
          <Badge>{q.status}</Badge>
          <Badge tone="secondary">{q.visibility}</Badge>
        </View>
        {q.description ? <Text className="text-muted">{q.description}</Text> : null}
        {canComplete ? (
          <Button className="mt-8" onPress={() => go(`/(main)/complete-group-quest/${q.id}`)}>
            {t('groups.completeGroupQuest')}
          </Button>
        ) : null}
        {isCreator && q.status === 'active' ? (
          <Button
            variant="secondary"
            className="mt-4"
            loading={submit.isPending}
            onPress={() => submit.mutate({ questId: q.id, userId: uid })}
          >
            {t('groups.submitForReview')}
          </Button>
        ) : null}
      </ScrollView>
    </View>
  );
}
