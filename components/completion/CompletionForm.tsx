import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Camera, RefreshCw } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/theme';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
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
    if (!perm.granted) {
      if (!perm.canAskAgain) {
        Alert.alert(
          t('complete.permissionDenied'),
          t('complete.permissionSettings'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('complete.openSettings'), onPress: () => Linking.openSettings() },
          ],
        );
      }
      return;
    }
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

      <PressableScale onPress={pick} scaleValue={0.97} className="mt-4">
        {uri ? (
          <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: colors.surfaceElevated }}>
            <Image
              source={{ uri }}
              style={{ width: '100%', height: 240, backgroundColor: colors.surfaceElevated }}
              contentFit="cover"
            />
            <View className="absolute bottom-3 right-3 flex-row items-center gap-1.5 bg-background/80 rounded-full px-3 py-1.5">
              <RefreshCw color={colors.foreground} size={14} />
              <Text className="text-foreground text-xs font-semibold">{t('complete.changePhoto')}</Text>
            </View>
          </View>
        ) : (
          <View
            className="rounded-2xl items-center justify-center py-12"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: colors.surfaceElevated,
              borderStyle: 'dashed',
            }}
          >
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: colors.primaryGlow }}
            >
              <Camera color={colors.primary} size={24} />
            </View>
            <Text className="text-foreground font-semibold">{t('complete.proof')}</Text>
            <Text className="text-muted text-sm mt-1">{t('complete.tapToAdd')}</Text>
          </View>
        )}
      </PressableScale>

      <View className="bg-surface rounded-2xl p-4 mt-4">
        <Input label={t('complete.caption')} value={caption} onChangeText={setCaption} multiline />
        <Input label={t('complete.rating')} value={rating} onChangeText={setRating} placeholder="1-5" />
      </View>

      {children}

      {friendOptions.length > 0 ? (
        <View className="bg-surface rounded-2xl p-4 mt-3">
          <Text className="text-muted text-xs uppercase font-semibold mb-3 tracking-wide">
            {t('complete.coparticipants')}
          </Text>
          <PillToggleGroup
            options={friendOptions}
            selected={picked}
            onToggle={toggleParticipant}
            activeClassName="bg-secondary/20"
            activeTextClassName="text-secondary"
          />
        </View>
      ) : null}

      {err ? <Text className="text-danger mt-4 text-center">{err}</Text> : null}

      <Button
        className="mt-6"
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
