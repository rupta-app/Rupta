import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateCompletion } from '@/hooks/useCompletion';
import { useFriendsList } from '@/hooks/useFriends';
import { useQuest } from '@/hooks/useQuests';
import { PICKER_IMAGES } from '@/lib/pickImage';
import { uploadCompletionPhoto } from '@/lib/storage';
import { useAuth } from '@/providers/AuthProvider';
import { questTitle } from '@/utils/questCopy';

export default function CompleteQuestScreen() {
  const { questId } = useLocalSearchParams<{ questId: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const { session, refreshProfile } = useAuth();
  const uid = session?.user?.id!;
  const { data: quest } = useQuest(questId);
  const { data: friends = [] } = useFriendsList(uid);
  const create = useCreateCompletion(uid);

  const [uri, setUri] = useState<string | null>(null);
  const [mime, setMime] = useState('image/jpeg');
  const [caption, setCaption] = useState('');
  const [rating, setRating] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [err, setErr] = useState('');

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: PICKER_IMAGES,
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      setUri(res.assets[0].uri);
      setMime(res.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  const submit = async () => {
    if (!uri || !quest || !uid) {
      setErr('Photo required');
      return;
    }
    setErr('');
    try {
      const url = await uploadCompletionPhoto(uid, uri, mime);
      const completion = await create.mutateAsync({
        userId: uid,
        questId: quest.id,
        caption: caption.trim() || null,
        rating: rating ? Number(rating) : null,
        mediaUrl: url,
        participantIds: [...picked],
      });
      await refreshProfile();
      router.replace(`/(main)/share-card/${completion.id}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('common.error'));
    }
  };

  if (!quest) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text className="text-foreground text-2xl font-bold">{t('complete.title')}</Text>
        <Text className="text-primary mt-2 font-semibold">{questTitle(quest, lang)}</Text>

        <Button className="mt-6" variant="secondary" onPress={pick}>
          {t('complete.proof')}
        </Button>
        {uri ? <Image source={{ uri }} className="w-full h-56 rounded-xl mt-4 bg-surfaceElevated" /> : null}

        <Input label={t('complete.caption')} value={caption} onChangeText={setCaption} multiline />
        <Input
          label={t('complete.rating')}
          value={rating}
          onChangeText={setRating}
          placeholder="1-5"
        />

        <Text className="text-muted text-sm mb-2">{t('complete.coparticipants')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {friends.map((f: { id: string; display_name: string }) => (
            <Pressable
              key={f.id}
              onPress={() => {
                const n = new Set(picked);
                if (n.has(f.id)) n.delete(f.id);
                else n.add(f.id);
                setPicked(n);
              }}
              className={`px-3 py-2 rounded-full border ${picked.has(f.id) ? 'border-secondary' : 'border-border'}`}
            >
              <Text className="text-foreground text-sm">{f.display_name}</Text>
            </Pressable>
          ))}
        </View>

        {err ? <Text className="text-danger mt-4">{err}</Text> : null}
        <Button className="mt-8" onPress={submit} loading={create.isPending}>
          {t('complete.submit')}
        </Button>
      </ScrollView>
    </View>
  );
}
