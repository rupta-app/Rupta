import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { useGroupQuest, useSubmitGroupQuestForReview } from '@/hooks/useGroupQuests';
import { useAuth } from '@/providers/AuthProvider';

export default function GroupQuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const go = (path: string) => (router as { push: (p: string) => void }).push(path);
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const { data: q, isLoading, isError } = useGroupQuest(id);
  const submit = useSubmitGroupQuestForReview();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  if (isError || !q) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={t('common.error')} />
        <ErrorState title={t('common.error')} subtitle={t('common.errorSubtitle')} />
      </View>
    );
  }

  const isCreator = q.creator_id === uid;
  const canComplete = q.status === 'active';

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={q.title} />
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
