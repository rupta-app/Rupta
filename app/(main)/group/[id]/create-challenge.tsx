import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useActiveChallengeCount, useCreateChallenge } from '@/hooks/useChallenges';
import { useAuth } from '@/providers/AuthProvider';
import { canCreateChallenge, getUserPlan } from '@/services/entitlements';

export default function CreateGroupChallengeScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session, profile } = useAuth();
  const uid = session?.user?.id!;
  const create = useCreateChallenge(groupId);
  const { data: activeCount = 0 } = useActiveChallengeCount(groupId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prize, setPrize] = useState('');
  const [start, setStart] = useState(new Date().toISOString().slice(0, 16));
  const [end, setEnd] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const [mode, setMode] = useState<'official_only' | 'group_only' | 'mixed'>('mixed');
  const [err, setErr] = useState('');

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1">{t('groups.createChallenge')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Input label={t('groups.challengeTitle')} value={title} onChangeText={setTitle} />
        <Input label={t('groups.challengeDescription')} value={description} onChangeText={setDescription} multiline />
        <Input label={t('groups.challengePrize')} value={prize} onChangeText={setPrize} />
        <Input label={t('groups.challengeStart')} value={start} onChangeText={setStart} />
        <Input label={t('groups.challengeEnd')} value={end} onChangeText={setEnd} />
        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('groups.scoringMode')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {(['official_only', 'group_only', 'mixed'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className={`px-3 py-2 rounded-lg border ${mode === m ? 'border-primary' : 'border-border'}`}
            >
              <Text className="text-foreground text-xs">{m.replace(/_/g, ' ')}</Text>
            </Pressable>
          ))}
        </View>
        {err ? <Text className="text-danger mt-4">{err}</Text> : null}
        <Button
          className="mt-8"
          loading={create.isPending}
          onPress={async () => {
            setErr('');
            if (!title.trim()) {
              setErr(t('groups.titleRequired'));
              return;
            }
            const plan = getUserPlan(profile);
            if (!canCreateChallenge(plan, activeCount)) {
              Alert.alert(t('groups.limitTitle'), t('groups.challengeLimitBody'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: 'Pro', onPress: () => router.push('/(main)/upgrade') },
              ]);
              return;
            }
            try {
              await create.mutateAsync({
                creatorId: uid,
                input: {
                  title: title.trim(),
                  description: description.trim() || null,
                  prizeDescription: prize.trim() || null,
                  startDate: new Date(start).toISOString(),
                  endDate: new Date(end).toISOString(),
                  scoringMode: mode,
                },
              });
              router.back();
            } catch (e: unknown) {
              setErr(e instanceof Error ? e.message : t('common.error'));
            }
          }}
        >
          {t('common.save')}
        </Button>
      </ScrollView>
    </View>
  );
}
