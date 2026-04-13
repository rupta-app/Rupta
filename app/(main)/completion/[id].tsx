import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Flag } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CompletionComments } from '@/components/completion/CompletionComments';
import { CompletionReportModal } from '@/components/completion/CompletionReportModal';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { colors } from '@/constants/theme';

import { RespectButton } from '@/components/social/RespectButton';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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

  if (!completionId) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted px-6 text-center">{t('common.error')}</Text>
      </View>
    );
  }

  if (isLoading || !data?.profiles || (!data.quests && !data.group_quests)) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const media = data.quest_media?.[0]?.media_url;
  const gave = social?.gaveRespect ?? false;
  const counts = social?.counts ?? { respects: 0, comments: 0 };
  const qTitle = data.group_quests?.title
    ? data.group_quests.title
    : data.quests
      ? questTitle(data.quests, lang)
      : 'SideQuest';
  const shareMsg = buildCompletionShareMessage(qTitle, data.profiles.username);

  const isOwner = isSameUser(viewerId, data.user_id);

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
    const dest = `${FileSystem.cacheDirectory}rupta-${Date.now()}.${ext}`;
    const { uri } = await FileSystem.downloadAsync(media, dest);
    await MediaLibrary.createAssetAsync(uri);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title=""
        right={
          isOwner ? (
            <Pressable
              onPress={() =>
                Alert.alert(t('completion.deleteTitle'), t('completion.deleteMessage'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('completion.deleteConfirm'),
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
                  },
                ])
              }
              disabled={deletePost.isPending}
              className="py-2 pr-4 pl-2"
              hitSlop={12}
            >
              <Text className="text-danger font-semibold text-base">{t('completion.deletePost')}</Text>
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 48, flexGrow: 1 }}>
        {media ? <Image source={{ uri: media }} style={{ width: '100%', height: 288, backgroundColor: colors.surfaceElevated }} /> : null}
        <View className="p-4">
          <Text className="text-muted text-xs">{formatCompletionTime(data.completed_at, lang)}</Text>
          <View className="flex-row items-center gap-4 mt-3">
            <Pressable onPress={() => router.push(`/(main)/user/${data.user_id}`)}>
              <Avatar url={data.profiles.avatar_url} name={data.profiles.display_name} size={48} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-foreground font-bold text-lg">{data.profiles.display_name}</Text>
              <Text className="text-muted text-xs">@{data.profiles.username}</Text>
            </View>
            {isSpontaneousAuraPending(data.quest_source_type, data.aura_earned) ? (
              <Badge tone="secondary">{t('feed.auraPendingReview')}</Badge>
            ) : (
              <Badge tone="primary">{`+${data.aura_earned} AURA`}</Badge>
            )}
          </View>
          <Text className="text-foreground text-2xl font-black mt-4">{qTitle}</Text>
          <Text className="text-muted text-xs uppercase mt-2 tracking-wide">
            {data.quests
              ? formatCategoryLabel(data.quests.category, lang)
              : data.group_quests
                ? t('feed.groupQuest')
                : ''}
          </Text>
          {data.caption ? <Text className="text-muted mt-2">{data.caption}</Text> : null}
          <View className="flex-row items-center gap-3 mt-4 flex-wrap">
            <RespectButton
              active={gave}
              loading={toggleR.isPending}
              onPress={() => toggleR.mutate({ has: gave })}
            />
            <Text className="text-muted">
              {counts.respects} · {counts.comments}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-5">
            <Button variant="secondary" className="flex-1 min-w-[140px]" onPress={openShare}>
              {t('completion.share')}
            </Button>
            {media ? (
              <Button variant="secondary" className="flex-1 min-w-[140px]" onPress={() => void downloadPhoto()}>
                {t('completion.downloadImage')}
              </Button>
            ) : null}
          </View>

          {uid && uid !== data.user_id ? (
            <Pressable
              onPress={() => setReportOpen(true)}
              className="mt-5 flex-row items-center gap-3 py-3 px-1 rounded-xl border border-danger/40 bg-danger/5"
            >
              <Flag color={colors.dangerLight} size={22} strokeWidth={2} />
              <Text className="text-danger font-semibold flex-1">{t('report.flagSuspicious')}</Text>
            </Pressable>
          ) : null}
        </View>

        <CompletionComments completionId={completionId} userId={uid} />
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
