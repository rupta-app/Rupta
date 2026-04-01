import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateGroupQuest } from '@/hooks/useGroupQuests';
import { useAuth } from '@/providers/AuthProvider';

export default function CreateGroupQuestScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1">{t('groups.createQuest')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Input label={t('groups.questTitle')} value={title} onChangeText={setTitle} />
        <Input label={t('groups.questDescription')} value={description} onChangeText={setDescription} multiline />
        <Input label={t('groups.questAura')} value={aura} onChangeText={setAura} />
        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('groups.proofType')}</Text>
        <View className="flex-row gap-2 flex-wrap">
          {(['photo', 'video', 'either'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setProof(p)}
              className={`px-3 py-2 rounded-lg border ${proof === p ? 'border-primary' : 'border-border'}`}
            >
              <Text className="text-foreground capitalize">{p}</Text>
            </Pressable>
          ))}
        </View>
        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('groups.repeatability')}</Text>
        <View className="flex-row gap-2 flex-wrap">
          {(['once', 'limited', 'repeatable'] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRepeat(r)}
              className={`px-3 py-2 rounded-lg border ${repeat === r ? 'border-primary' : 'border-border'}`}
            >
              <Text className="text-foreground capitalize">{r}</Text>
            </Pressable>
          ))}
        </View>
        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('groups.questVisibility')}</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setVisibility('group_only')}
            className={`px-3 py-2 rounded-lg border ${visibility === 'group_only' ? 'border-primary' : 'border-border'}`}
          >
            <Text className="text-foreground">{t('groups.visGroup')}</Text>
          </Pressable>
          <Pressable
            onPress={() => setVisibility('public')}
            className={`px-3 py-2 rounded-lg border ${visibility === 'public' ? 'border-primary' : 'border-border'}`}
          >
            <Text className="text-foreground">{t('groups.visPublic')}</Text>
          </Pressable>
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
