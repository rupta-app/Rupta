import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CompletionForm } from '@/components/completion/CompletionForm';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { useCreateSpontaneousCompletion } from '@/hooks/useCompletion';
import { useFriendsList } from '@/hooks/useFriends';
import { useAuth } from '@/providers/AuthProvider';

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const AURA_MIN = 1;
const AURA_MAX = 500;

export default function SpontaneousSidequestScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session, refreshProfile } = useAuth();
  const uid = session?.user?.id!;
  const { data: friends = [] } = useFriendsList(uid);
  const create = useCreateSpontaneousCompletion(uid);

  const [title, setTitle] = useState('');
  const [suggestedAura, setSuggestedAura] = useState('25');

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('spontaneous.title')} />
      <CompletionForm
        userId={uid}
        friends={friends}
        isPending={create.isPending}
        submitLabel={t('spontaneous.post')}
        onSubmit={async ({ media, caption, rating, participantIds }) => {
          const trimmed = title.trim();
          if (trimmed.length < TITLE_MIN) throw new Error(t('spontaneous.titleTooShort'));
          if (trimmed.length > TITLE_MAX) throw new Error(t('spontaneous.titleTooLong'));
          const auraNum = Math.round(Number(suggestedAura.replace(/,/g, '.')));
          if (!Number.isFinite(auraNum) || auraNum < AURA_MIN || auraNum > AURA_MAX) {
            throw new Error(t('spontaneous.auraInvalid'));
          }
          const completion = await create.mutateAsync({
            userId: uid,
            title: trimmed,
            suggestedAura: auraNum,
            caption,
            rating,
            media,
            participantIds,
          });
          await refreshProfile();
          router.replace(`/(main)/share-card/${completion.id}`);
        }}
        headerSlot={
          <>
            <Text className="text-muted text-sm leading-6 italic border-l-2 border-primary/50 pl-3">
              {t('spontaneous.quote')}
            </Text>
            <Text className="text-muted text-xs mt-4 leading-5">{t('spontaneous.explainer')}</Text>
            <View className="mt-4">
              <Input
                label={t('spontaneous.sidequestTitle')}
                value={title}
                onChangeText={setTitle}
                placeholder={t('spontaneous.titlePlaceholder')}
                multiline
                autoCapitalize="sentences"
              />
            </View>
          </>
        }
        footerSlot={
          <Pressable className="mt-6 py-2" onPress={() => router.push('/(main)/quick-complete')}>
            <Text className="text-secondary text-sm font-semibold text-center">{t('spontaneous.fromCatalog')}</Text>
          </Pressable>
        }
      >
        <View className="mt-4">
          <Input
            label={t('spontaneous.suggestedAura')}
            value={suggestedAura}
            onChangeText={setSuggestedAura}
            placeholder="1–500"
            keyboardType="number-pad"
          />
        </View>
        <Text className="text-muted text-xs mt-1">{t('spontaneous.auraHint')}</Text>
      </CompletionForm>
    </View>
  );
}
