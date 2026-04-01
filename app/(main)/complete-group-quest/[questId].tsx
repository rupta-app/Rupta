import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateGroupQuestCompletion } from '@/hooks/useCompletion';
import { useFriendsList } from '@/hooks/useFriends';
import { useGroupChallengesList } from '@/hooks/useChallenges';
import { useGroupQuest } from '@/hooks/useGroupQuests';
import { PICKER_IMAGES } from '@/lib/pickImage';
import { uploadCompletionPhoto } from '@/lib/storage';
import { supabaseErrorMessage } from '@/lib/supabaseErrorMessage';
import { useAuth } from '@/providers/AuthProvider';

export default function CompleteGroupQuestScreen() {
  const { questId } = useLocalSearchParams<{ questId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const [uri, setUri] = useState<string | null>(null);
  const [mime, setMime] = useState('image/jpeg');
  const [caption, setCaption] = useState('');
  const [rating, setRating] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [challengeId, setChallengeId] = useState<string | undefined>();
  const [visibility, setVisibility] = useState<'group' | 'public' | 'friends' | 'private'>('group');
  const [err, setErr] = useState('');
  const submitLock = useRef(false);

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
    if (submitLock.current || create.isPending) return;
    if (!uri || !gq || !uid) {
      setErr('Photo required');
      return;
    }
    submitLock.current = true;
    setErr('');
    try {
      const url = await uploadCompletionPhoto(uid, uri, mime);
      const completion = await create.mutateAsync({
        userId: uid,
        groupQuestId: gq.id,
        groupId: gq.group_id,
        caption: caption.trim() || null,
        rating: rating ? Number(rating) : null,
        mediaUrl: url,
        participantIds: [...picked],
        challengeId: challengeId ?? null,
        visibility,
      });
      await refreshProfile();
      router.replace(`/(main)/share-card/${completion.id}`);
    } catch (e: unknown) {
      submitLock.current = false;
      setErr(supabaseErrorMessage(e, t('common.error')));
    }
  };

  if (!gq) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text className="text-foreground text-2xl font-bold">{t('groups.completeGroupQuest')}</Text>
        <Text className="text-primary mt-2 font-semibold">{gq.title}</Text>

        <Button className="mt-6" variant="secondary" onPress={pick}>
          {t('complete.proof')}
        </Button>
        {uri ? <Image source={{ uri }} className="w-full h-56 rounded-xl mt-4 bg-surfaceElevated" /> : null}

        <Input label={t('complete.caption')} value={caption} onChangeText={setCaption} multiline />
        <Input label={t('complete.rating')} value={rating} onChangeText={setRating} placeholder="1-5" />

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
        <Button
          className="mt-8"
          onPress={() => void submit()}
          loading={create.isPending}
          disabled={create.isPending}
        >
          {t('complete.submit')}
        </Button>
      </ScrollView>
    </View>
  );
}
