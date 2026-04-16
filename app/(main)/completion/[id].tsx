import { useLocalSearchParams, useRouter } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { EllipsisVertical, Heart, MessageCircle, Send } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Image, type ImageLoadEventData } from 'expo-image';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CompletionComments } from '@/components/completion/CompletionComments';
import { CompletionReportModal } from '@/components/completion/CompletionReportModal';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { CATEGORY_CONFIG } from '@/constants/categories';
import { colors } from '@/constants/theme';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  useCompletion,
  useCompletionSocial,
  useDeleteCompletion,
  useToggleRespect,
} from '@/hooks/useCompletion';
import { buildCompletionShareMessage, shareCompletionGeneric, shareToWhatsApp } from '@/lib/shareLinks';
import { useAuth } from '@/providers/AuthProvider';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { formatCompletionTime } from '@/utils/formatTime';
import { isSameUser } from '@/utils/identity';
import { useHeartAnimation } from '@/hooks/useHeartAnimation';
import { appLang } from '@/utils/lang';
import { questTitle } from '@/utils/questCopy';
import { isSpontaneousAuraPending } from '@/utils/spontaneousAura';

/** Expo Router may pass dynamic segments as `string | string[]` (e.g. web). */
function normalizeRouteParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

export default function CompletionDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const completionId = useMemo(() => normalizeRouteParam(params.id), [params.id]);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = appLang(i18n);
  const { session, refreshProfile, profile } = useAuth();
  const viewerId = session?.user?.id ?? profile?.id;
  const uid = viewerId;
  const { data, isLoading } = useCompletion(completionId);
  const { data: social } = useCompletionSocial(completionId ?? '', uid);
  const toggleR = useToggleRespect(completionId ?? '', uid);
  const deletePost = useDeleteCompletion(completionId ?? '', data?.user_id);
  const [reportOpen, setReportOpen] = useState(false);
  const [imageAspect, setImageAspect] = useState(3 / 4);
  const onImageLoad = useCallback((e: ImageLoadEventData) => {
    const { width, height } = e.source;
    if (width && height) setImageAspect(width / height);
  }, []);

  const gave = social?.gaveRespect ?? false;
  const counts = social?.counts ?? { respects: 0, comments: 0 };

  const { heartStyle } = useHeartAnimation(gave);

  if (!completionId) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted px-6 text-center">{t('common.error')}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  if (!data?.profiles) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="" />
        <ErrorState title={t('common.error')} subtitle={t('common.errorSubtitle')} />
      </View>
    );
  }

  const media = data.quest_media?.[0]?.media_url;
  const qTitle = data.group_quests?.title
    ? data.group_quests.title
    : data.quests
      ? questTitle(data.quests, lang)
      : 'SideQuest';
  const shareMsg = buildCompletionShareMessage(qTitle, data.profiles.username);
  const isOwner = isSameUser(viewerId, data.user_id);
  const auraPending = isSpontaneousAuraPending(data.quest_source_type, data.aura_earned);

  const categoryKey = data.quests?.category;
  const cat = CATEGORY_CONFIG[categoryKey ?? ''] ?? CATEGORY_CONFIG.random;
  const CatIcon = cat.icon;

  const openShare = () => {
    Alert.alert(t('completion.share'), undefined, [
      { text: t('feed.whatsapp'), onPress: () => void shareToWhatsApp(shareMsg) },
      {
        text: t('feed.instagramStory'),
        onPress: () => router.push(`/(main)/share-card/${completionId}`),
      },
      { text: t('feed.shareMore'), onPress: () => void shareCompletionGeneric(null, shareMsg) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const downloadPhoto = async () => {
    if (!media) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return;
    const ext = media.toLowerCase().includes('.png') ? 'png' : 'jpg';
    const dest = new File(Paths.cache, `rupta-${Date.now()}.${ext}`);
    const downloaded = await File.downloadFileAsync(media, dest);
    await MediaLibrary.createAssetAsync(downloaded.uri);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="" />
      <ScrollView contentContainerStyle={{ paddingBottom: 48, flexGrow: 1 }}>
        <Animated.View entering={FadeInDown.duration(300).damping(20)}>
          {/* User row */}
          <View className="flex-row items-center px-4 pt-2 pb-3">
            <Pressable onPress={() => router.push(`/(main)/user/${data.user_id}`)} className="flex-row items-center flex-1">
              <Avatar url={data.profiles.avatar_url} name={data.profiles.display_name} size={36} />
              <View className="ml-2.5">
                <Text className="text-foreground text-sm font-bold">{data.profiles.display_name}</Text>
                <Text className="text-muted text-xs">@{data.profiles.username}</Text>
              </View>
            </Pressable>
            <Text className="text-mutedForeground text-xs">
              {formatCompletionTime(data.completed_at, lang)}
            </Text>
          </View>

          {/* Title + AURA */}
          <View className="flex-row items-start justify-between gap-2 px-4 pb-2">
            <Text className="text-foreground text-lg font-bold leading-6 flex-1">
              {qTitle}
            </Text>
            {auraPending ? (
              <Badge tone="secondary">{t('feed.auraPendingReview')}</Badge>
            ) : (
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: colors.primaryGlow }}
              >
                <Text className="text-primary text-xs font-bold">+{data.aura_earned} AURA</Text>
              </View>
            )}
          </View>

          {/* Category */}
          <View className="px-4 pb-3">
            {categoryKey ? (
              <View className="flex-row items-center">
                <View
                  className="w-6 h-6 rounded items-center justify-center mr-1.5"
                  style={{ backgroundColor: cat.bg }}
                >
                  <CatIcon color={cat.accent} size={13} strokeWidth={2.5} />
                </View>
                <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: cat.accent }}>
                  {formatCategoryLabel(categoryKey, lang)}
                </Text>
              </View>
            ) : data.group_quests ? (
              <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                {t('feed.groupQuest')}
              </Text>
            ) : null}
          </View>

          {/* Hero image */}
          {media ? (
            <Image
              source={{ uri: media }}
              style={{ width: '100%', aspectRatio: imageAspect }}
              contentFit="cover"
              onLoad={onImageLoad}
              transition={{ effect: 'cross-dissolve', duration: 200 }}
            />
          ) : null}

          {/* Actions row */}
          <View className="flex-row items-center px-4 mt-3">
            <PressableScale
              onPress={() => uid && toggleR.mutate({ has: gave })}
              disabled={!uid || toggleR.isPending}
              hitSlop={10}
              scaleValue={0.9}
            >
              <View className="flex-row items-center gap-1.5">
                <Animated.View style={heartStyle}>
                  <Heart
                    color={gave ? colors.respect : colors.muted}
                    fill={gave ? colors.respect : 'none'}
                    size={24}
                    strokeWidth={2}
                  />
                </Animated.View>
                {counts.respects > 0 ? (
                  <Text className={`text-sm font-semibold ${gave ? 'text-respect' : 'text-muted'}`}>
                    {counts.respects}
                  </Text>
                ) : null}
              </View>
            </PressableScale>
            <View className="flex-row items-center gap-1.5 ml-4">
              <MessageCircle color={colors.muted} size={24} strokeWidth={2} />
              {counts.comments > 0 ? (
                <Text className="text-sm font-semibold text-muted">{counts.comments}</Text>
              ) : null}
            </View>
            <View className="flex-1" />
            <PressableScale onPress={openShare} hitSlop={10} scaleValue={0.9} className={uid ? 'mr-4' : ''}>
              <Send color={colors.muted} size={22} strokeWidth={2} />
            </PressableScale>
            {uid ? (
              <PressableScale
                onPress={() => {
                  const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [];
                  if (media) {
                    options.push({
                      text: t('completion.downloadImage'),
                      onPress: () => void downloadPhoto(),
                    });
                  }
                  if (isOwner) {
                    options.push({
                      text: t('completion.deletePost'),
                      style: 'destructive',
                      onPress: () =>
                        deletePost.mutate(undefined, {
                          onSuccess: async () => {
                            await refreshProfile();
                            router.back();
                          },
                          onError: (e) =>
                            Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e)),
                        }),
                    });
                  } else {
                    options.push({
                      text: t('report.flagSuspicious'),
                      onPress: () => setReportOpen(true),
                    });
                  }
                  options.push({ text: t('common.cancel'), style: 'cancel' });
                  Alert.alert('', undefined, options);
                }}
                hitSlop={10}
                scaleValue={0.9}
              >
                <EllipsisVertical color={colors.muted} size={22} strokeWidth={2} />
              </PressableScale>
            ) : null}
          </View>

          {/* Caption — styled as user's post text */}
          {data.caption ? (
            <Text className="px-4 mt-2 leading-5 text-sm">
              <Text className="text-foreground font-bold">{data.profiles.display_name}</Text>
              {'  '}
              <Text className="text-muted">{data.caption}</Text>
            </Text>
          ) : null}

          {/* Comments */}
          <View className="px-4 mt-4">
            <CompletionComments completionId={completionId} userId={uid} />
          </View>
        </Animated.View>
      </ScrollView>

      <CompletionReportModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        completionId={completionId}
        reportedUserId={data.user_id}
        reporterId={uid!}
      />
    </View>
  );
}
