import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CompletionForm } from '@/components/completion/CompletionForm';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { useCreateGroupQuestCompletion } from '@/hooks/useCompletion';
import { useFriendsList } from '@/hooks/useFriends';
import { useGroupChallengesList } from '@/hooks/useChallenges';
import { useGroupQuest } from '@/hooks/useGroupQuests';
import { useAuth } from '@/providers/AuthProvider';

export default function CompleteGroupQuestScreen() {
  const { questId } = useLocalSearchParams<{ questId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { session, refreshProfile } = useAuth();
  const uid = session?.user?.id!;
  const { data: gq } = useGroupQuest(questId);
  const { data: friends = [] } = useFriendsList(uid);
  const { data: challenges = [] } = useGroupChallengesList(gq?.group_id);
  const create = useCreateGroupQuestCompletion(uid);

  const activeChallenges = useMemo(
    () => challenges.filter((c: { status: string }) => c.status === 'active'),
    [challenges],
  );

  const [challengeId, setChallengeId] = useState<string | undefined>();
  const [visibility, setVisibility] = useState<'group' | 'public' | 'friends' | 'private'>('group');

  if (!gq) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('groups.completeGroupQuest')} />
      <CompletionForm
        userId={uid}
        friends={friends}
        isPending={create.isPending}
        onSubmit={async ({ mediaUrl, caption, rating, participantIds }) => {
          const completion = await create.mutateAsync({
            userId: uid,
            groupQuestId: gq.id,
            groupId: gq.group_id,
            caption,
            rating,
            mediaUrl,
            participantIds,
            challengeId: challengeId ?? null,
            visibility,
          });
          await refreshProfile();
          router.replace(`/(main)/share-card/${completion.id}`);
        }}
        headerSlot={
          <Text className="text-primary font-semibold">{gq.title}</Text>
        }
      >
        <Text className="text-muted text-sm mb-2 mt-4">{t('groups.postVisibility')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {(['group', 'friends', 'public', 'private'] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setVisibility(v)}
              className={`px-3 py-2 rounded-lg border ${visibility === v ? 'border-primary' : 'border-border'}`}
            >
              <Text className="text-foreground capitalize">{v}</Text>
            </Pressable>
          ))}
        </View>

        {activeChallenges.length > 0 ? (
          <>
            <Text className="text-muted text-sm mb-2 mt-4">{t('groups.optionalChallenge')}</Text>
            <Pressable
              onPress={() => setChallengeId(undefined)}
              className={`px-3 py-2 rounded-lg border mb-2 ${!challengeId ? 'border-primary' : 'border-border'}`}
            >
              <Text className="text-foreground">{t('groups.noChallenge')}</Text>
            </Pressable>
            {activeChallenges.map((c: { id: string; title: string }) => (
              <Pressable
                key={c.id}
                onPress={() => setChallengeId(c.id)}
                className={`px-3 py-2 rounded-lg border mb-2 ${challengeId === c.id ? 'border-primary' : 'border-border'}`}
              >
                <Text className="text-foreground">{c.title}</Text>
              </Pressable>
            ))}
          </>
        ) : null}
      </CompletionForm>
    </View>
  );
}
