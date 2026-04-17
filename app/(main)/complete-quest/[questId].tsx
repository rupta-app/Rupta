import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CompletionForm } from '@/components/completion/CompletionForm';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { useCreateCompletion } from '@/hooks/useCompletion';
import { useFriendsList } from '@/hooks/useFriends';
import { useQuest } from '@/hooks/useQuests';
import { useAuth } from '@/providers/AuthProvider';
import { appLang } from '@/utils/lang';
import { questTitle } from '@/utils/questCopy';

export default function CompleteQuestScreen() {
  const { questId } = useLocalSearchParams<{ questId: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = appLang(i18n);
  const { session, refreshProfile } = useAuth();
  const uid = session?.user?.id!;
  const { data: quest } = useQuest(questId);
  const { data: friends = [] } = useFriendsList(uid);
  const create = useCreateCompletion(uid);

  if (!quest) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('complete.title')} />
      <CompletionForm
        userId={uid}
        friends={friends}
        isPending={create.isPending}
        onSubmit={async ({ media, caption, rating, participantIds }) => {
          const completion = await create.mutateAsync({
            userId: uid,
            questId: quest.id,
            caption,
            rating,
            media,
            participantIds,
          });
          await refreshProfile();
          router.replace(`/(main)/share-card/${completion.id}`);
        }}
        headerSlot={
          <Text className="text-primary font-semibold">{questTitle(quest, lang)}</Text>
        }
      />
    </View>
  );
}
