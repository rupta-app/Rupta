import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
import { useCreateGroupQuest } from '@/hooks/useGroupQuests';
import { useAuth } from '@/providers/AuthProvider';

export default function CreateGroupQuestScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const create = useCreateGroupQuest(groupId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aura, setAura] = useState('100');
  const [proof, setProof] = useState<'photo' | 'video' | 'either'>('photo');
  const [repeat, setRepeat] = useState<'once' | 'limited' | 'repeatable'>('once');
  const [visibility, setVisibility] = useState<'group_only' | 'public'>('group_only');
  const [err, setErr] = useState('');

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('groups.createQuest')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Input label={t('groups.questTitle')} value={title} onChangeText={setTitle} />
        <Input label={t('groups.questDescription')} value={description} onChangeText={setDescription} multiline />
        <Input label={t('groups.questAura')} value={aura} onChangeText={setAura} />
        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('groups.proofType')}</Text>
        <View className="flex-row gap-2 flex-wrap">
          {(['photo', 'video', 'either'] as const).map((p) => (
            <PressableScale
              key={p}
              onPress={() => setProof(p)}
              scaleValue={0.95}
              className={`px-3 py-2 rounded-lg ${proof === p ? 'bg-foreground' : 'bg-surfaceElevated'}`}
            >
              <Text className={`capitalize ${proof === p ? 'text-background font-semibold' : 'text-mutedForeground'}`}>{p}</Text>
            </PressableScale>
          ))}
        </View>
        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('groups.repeatability')}</Text>
        <View className="flex-row gap-2 flex-wrap">
          {(['once', 'limited', 'repeatable'] as const).map((r) => (
            <PressableScale
              key={r}
              onPress={() => setRepeat(r)}
              scaleValue={0.95}
              className={`px-3 py-2 rounded-lg ${repeat === r ? 'bg-foreground' : 'bg-surfaceElevated'}`}
            >
              <Text className={`capitalize ${repeat === r ? 'text-background font-semibold' : 'text-mutedForeground'}`}>{r}</Text>
            </PressableScale>
          ))}
        </View>
        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('groups.questVisibility')}</Text>
        <View className="flex-row gap-2">
          <PressableScale
            onPress={() => setVisibility('group_only')}
            scaleValue={0.95}
            className={`px-3 py-2 rounded-lg ${visibility === 'group_only' ? 'bg-foreground' : 'bg-surfaceElevated'}`}
          >
            <Text className={`${visibility === 'group_only' ? 'text-background font-semibold' : 'text-mutedForeground'}`}>{t('groups.visGroup')}</Text>
          </PressableScale>
          <PressableScale
            onPress={() => setVisibility('public')}
            scaleValue={0.95}
            className={`px-3 py-2 rounded-lg ${visibility === 'public' ? 'bg-foreground' : 'bg-surfaceElevated'}`}
          >
            <Text className={`${visibility === 'public' ? 'text-background font-semibold' : 'text-mutedForeground'}`}>{t('groups.visPublic')}</Text>
          </PressableScale>
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
            try {
              await create.mutateAsync({
                creatorId: uid,
                input: {
                  title: title.trim(),
                  description: description.trim() || null,
                  auraReward: Math.max(0, Number(aura) || 0),
                  proofType: proof,
                  repeatabilityType: repeat,
                  visibility,
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
