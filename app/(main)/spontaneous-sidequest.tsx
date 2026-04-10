import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateSpontaneousCompletion } from '@/hooks/useCompletion';
import { useFriendsList } from '@/hooks/useFriends';
import { PICKER_IMAGES } from '@/lib/pickImage';
import { supabaseErrorMessage } from '@/lib/supabaseErrorMessage';
import { uploadCompletionPhoto } from '@/lib/storage';
import { useAuth } from '@/providers/AuthProvider';

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const AURA_MIN = 1;
const AURA_MAX = 500;

export default function SpontaneousSidequestScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { session, refreshProfile } = useAuth();
  const uid = session?.user?.id!;
  const { data: friends = [] } = useFriendsList(uid);
  const create = useCreateSpontaneousCompletion(uid);

  const [title, setTitle] = useState('');
  const [suggestedAura, setSuggestedAura] = useState('25');
  const [uri, setUri] = useState<string | null>(null);
  const [mime, setMime] = useState('image/jpeg');
  const [caption, setCaption] = useState('');
  const [rating, setRating] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
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
    const trimmed = title.trim();
    if (trimmed.length < TITLE_MIN) {
      setErr(t('spontaneous.titleTooShort'));
      return;
    }
    if (trimmed.length > TITLE_MAX) {
      setErr(t('spontaneous.titleTooLong'));
      return;
    }
    if (!uri || !uid) {
      setErr(t('spontaneous.photoRequired'));
      return;
    }
    const auraNum = Math.round(Number(suggestedAura.replace(/,/g, '.')));
    if (!Number.isFinite(auraNum) || auraNum < AURA_MIN || auraNum > AURA_MAX) {
      setErr(t('spontaneous.auraInvalid'));
      return;
    }
    submitLock.current = true;
    setErr('');
    try {
      const url = await uploadCompletionPhoto(uid, uri, mime);
      const completion = await create.mutateAsync({
        userId: uid,
        title: trimmed,
        suggestedAura: auraNum,
        caption: caption.trim() || null,
        rating: rating ? Number(rating) : null,
        mediaUrl: url,
        participantIds: [...picked],
      });
      await refreshProfile();
      router.replace(`/(main)/share-card/${completion.id}`);
    } catch (e: unknown) {
      submitLock.current = false;
      setErr(supabaseErrorMessage(e, t('common.error')));
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1 flex-1">{t('spontaneous.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
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

        <Button className="mt-4" variant="secondary" onPress={pick}>
          {t('complete.proof')}
        </Button>
        {uri ? <Image source={{ uri }} className="w-full h-56 rounded-xl mt-4 bg-surfaceElevated" /> : null}

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

        <Input label={t('complete.caption')} value={caption} onChangeText={setCaption} multiline />
        <Input
          label={t('complete.rating')}
          value={rating}
          onChangeText={setRating}
          placeholder="1-5"
        />

        <Text className="text-muted text-sm mb-2 mt-2">{t('complete.coparticipants')}</Text>
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
          {t('spontaneous.post')}
        </Button>

        <Pressable className="mt-6 py-2" onPress={() => router.push('/(main)/quick-complete')}>
          <Text className="text-secondary text-sm font-semibold text-center">{t('spontaneous.fromCatalog')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
