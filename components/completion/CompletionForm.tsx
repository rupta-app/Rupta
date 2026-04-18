import { Image } from 'expo-image';
import { Camera, Play, Plus, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/theme';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  MAX_MEDIA_PER_COMPLETION,
  MAX_PHOTO_BYTES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_S,
  MB,
  type MediaKind,
} from '@/lib/mediaLimits';
import {
  MediaLimitError,
  MediaPermissionError,
  captureCompletionMedia,
  pickCompletionMedia,
  type PickedMedia,
} from '@/lib/pickMedia';
import { uploadImageToCloudflare, uploadVideoToCloudflare } from '@/lib/cloudflareMedia';
import { supabaseErrorMessage } from '@/lib/supabaseErrorMessage';

type Slot = {
  uri: string;
  mime: string;
  kind: MediaKind;
};

type SubmitData = {
  media: { url: string; kind: MediaKind }[];
  caption: string | null;
  rating: number | null;
  participantIds: string[];
};

type Props = {
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
  friends,
  onSubmit,
  isPending,
  submitLabel,
  headerSlot,
  children,
  footerSlot,
}: Props) {
  const { t } = useTranslation();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [caption, setCaption] = useState('');
  const [rating, setRating] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [err, setErr] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
  const submitLock = useRef(false);

  const handlePicked = (result: PickedMedia | null) => {
    if (!result) return;
    setSlots((prev) => [
      ...prev,
      { uri: result.uri, mime: result.mime, kind: result.kind },
    ]);
  };

  const handlePickerError = (e: unknown) => {
    if (e instanceof MediaPermissionError) {
      if (!e.canAskAgain) {
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
    if (e instanceof MediaLimitError) {
      const mbFor: Partial<Record<MediaLimitError['key'], number>> = {
        tooLargePhoto: Math.round(MAX_PHOTO_BYTES / MB),
        tooLargeVideo: Math.round(MAX_VIDEO_BYTES / MB),
      };
      setErr(
        t(`complete.errors.${e.key}`, {
          mb: mbFor[e.key],
          seconds: MAX_VIDEO_DURATION_S,
        }),
      );
      return;
    }
    setErr(supabaseErrorMessage(e, t('common.error')));
  };

  const openFromLibrary = async () => {
    setErr('');
    setIsPreparing(true);
    try {
      handlePicked(await pickCompletionMedia({ allow: 'both' }));
    } catch (e) {
      handlePickerError(e);
    } finally {
      setIsPreparing(false);
    }
  };

  const capture = async (kind: MediaKind) => {
    setErr('');
    setIsPreparing(true);
    try {
      handlePicked(await captureCompletionMedia(kind));
    } catch (e) {
      handlePickerError(e);
    } finally {
      setIsPreparing(false);
    }
  };

  const promptAddMedia = () => {
    if (slots.length >= MAX_MEDIA_PER_COMPLETION || isPreparing) return;
    Alert.alert(t('complete.addMediaTitle'), undefined, [
      { text: t('complete.takePhoto'), onPress: () => void capture('photo') },
      { text: t('complete.recordVideo'), onPress: () => void capture('video') },
      { text: t('complete.chooseFromLibrary'), onPress: () => void openFromLibrary() },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleParticipant = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  const submit = async () => {
    if (submitLock.current || isPending) return;
    if (slots.length === 0) {
      setErr(t('complete.errors.mediaRequired'));
      return;
    }
    submitLock.current = true;
    setErr('');
    try {
      const media = await Promise.all(
        slots.map(async (s) => {
          const id =
            s.kind === 'video'
              ? await uploadVideoToCloudflare(s.uri, s.mime)
              : await uploadImageToCloudflare(s.uri, s.mime, 'completion-photo');
          return { url: id, kind: s.kind };
        }),
      );
      await onSubmit({
        media,
        caption: caption.trim() || null,
        rating: rating ? Number(rating) : null,
        participantIds: [...picked],
      });
    } catch (e: unknown) {
      submitLock.current = false;
      // Failed submissions may leave orphan Cloudflare assets; cleanup runs out-of-band.
      setErr(supabaseErrorMessage(e, t('common.error')));
    }
  };

  const friendOptions = friends.map((f) => ({ value: f.id, label: f.display_name }));
  const tiles = Array.from({ length: MAX_MEDIA_PER_COMPLETION }, (_, i) => slots[i]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      {headerSlot}

      <View className="mt-5">
        <Text className="text-foreground text-base font-bold">{t('complete.proof')}</Text>
        <Text className="text-muted text-xs mt-0.5">
          {t('complete.mediaLimit', { max: MAX_MEDIA_PER_COMPLETION })}
          {' · '}
          {t('complete.videoLimit', { seconds: MAX_VIDEO_DURATION_S })}
        </Text>

        <View className="flex-row gap-2 mt-3">
          {tiles.map((slot, idx) => {
            if (slot) {
              return (
                <View
                  key={`slot-${idx}`}
                  className="flex-1 rounded-2xl overflow-hidden relative"
                  style={{ backgroundColor: colors.surfaceElevated, aspectRatio: 1 }}
                >
                  {slot.kind === 'photo' ? (
                    <Image
                      source={{ uri: slot.uri }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      className="w-full h-full items-center justify-center"
                      style={{ backgroundColor: colors.surface }}
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.primaryGlow }}
                      >
                        <Play color={colors.primary} size={18} fill={colors.primary} />
                      </View>
                      <Text className="text-muted text-[10px] mt-1.5 uppercase tracking-wide font-semibold">
                        {t('complete.video')}
                      </Text>
                    </View>
                  )}
                  <PressableScale
                    onPress={() => removeSlot(idx)}
                    scaleValue={0.9}
                    hitSlop={8}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
                  >
                    <Trash2 color={colors.foreground} size={14} strokeWidth={2.5} />
                  </PressableScale>
                </View>
              );
            }

            const isPrimary = idx === slots.length;
            const showPreparing = isPrimary && isPreparing;
            return (
              <PressableScale
                key={`slot-${idx}`}
                onPress={promptAddMedia}
                scaleValue={0.97}
                disabled={isPreparing}
                className="flex-1 rounded-2xl items-center justify-center"
                style={{
                  aspectRatio: 1,
                  backgroundColor: isPrimary ? colors.primaryGlow : colors.surface,
                  borderWidth: 1.5,
                  borderColor: isPrimary ? colors.primary : colors.surfaceElevated,
                  borderStyle: isPrimary ? 'solid' : 'dashed',
                  opacity: isPreparing && !isPrimary ? 0.5 : 1,
                }}
              >
                {showPreparing ? (
                  <View className="items-center">
                    <ActivityIndicator color={colors.primary} />
                    <Text className="text-primary text-[11px] font-semibold mt-1.5">
                      {t('complete.preparing')}
                    </Text>
                  </View>
                ) : isPrimary ? (
                  <View className="items-center">
                    <Camera color={colors.primary} size={24} />
                    <Text className="text-primary text-[11px] font-semibold mt-1.5">
                      {slots.length === 0 ? t('complete.addFirst') : t('complete.addMore')}
                    </Text>
                  </View>
                ) : (
                  <Plus color={colors.muted} size={20} />
                )}
              </PressableScale>
            );
          })}
        </View>
      </View>

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
