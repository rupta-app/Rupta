import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PillToggleGroup } from '@/components/ui/PillToggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PICKER_IMAGES } from '@/lib/pickImage';
import { uploadCompletionPhoto } from '@/lib/storage';
import { supabaseErrorMessage } from '@/lib/supabaseErrorMessage';

type SubmitData = {
  mediaUrl: string;
  caption: string | null;
  rating: number | null;
  participantIds: string[];
};

type Props = {
  userId: string;
  friends: { id: string; display_name: string }[];
  onSubmit: (data: SubmitData) => Promise<void>;
  isPending: boolean;
  submitLabel?: string;
  /** Rendered before caption/rating inputs */
  headerSlot?: React.ReactNode;
  /** Rendered between rating and coparticipants */
  children?: React.ReactNode;
  /** Rendered after the submit button */
  footerSlot?: React.ReactNode;
};

export function CompletionForm({
  userId,
  friends,
  onSubmit,
  isPending,
  submitLabel,
  headerSlot,
  children,
  footerSlot,
}: Props) {
  const { t } = useTranslation();
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

  const toggleParticipant = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  const submit = async () => {
    if (submitLock.current || isPending) return;
    if (!uri) {
      setErr(t('spontaneous.photoRequired'));
      return;
    }
    submitLock.current = true;
    setErr('');
    try {
      const mediaUrl = await uploadCompletionPhoto(userId, uri, mime);
      await onSubmit({
        mediaUrl,
        caption: caption.trim() || null,
        rating: rating ? Number(rating) : null,
        participantIds: [...picked],
      });
    } catch (e: unknown) {
      submitLock.current = false;
      setErr(supabaseErrorMessage(e, t('common.error')));
    }
  };

  const friendOptions = friends.map((f) => ({ value: f.id, label: f.display_name }));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      {headerSlot}

      <Button className="mt-4" variant="secondary" onPress={pick}>
        {t('complete.proof')}
      </Button>
      {uri ? <Image source={{ uri }} className="w-full h-56 rounded-xl mt-4 bg-surfaceElevated" /> : null}

      <Input label={t('complete.caption')} value={caption} onChangeText={setCaption} multiline />
      <Input label={t('complete.rating')} value={rating} onChangeText={setRating} placeholder="1-5" />

      {children}

      <Text className="text-muted text-sm mb-2 mt-2">{t('complete.coparticipants')}</Text>
      <PillToggleGroup
        options={friendOptions}
        selected={picked}
        onToggle={toggleParticipant}
        activeClassName="border-secondary bg-secondary/15"
      />

      {err ? <Text className="text-danger mt-4">{err}</Text> : null}

      <Button
        className="mt-8"
        onPress={() => void submit()}
        loading={isPending}
        disabled={isPending}
      >
        {submitLabel ?? t('complete.submit')}
      </Button>

      {footerSlot}
    </ScrollView>
  );
}
