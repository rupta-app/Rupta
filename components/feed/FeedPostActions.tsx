import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { MessageCircle, Share2, ThumbsUp, Trash2 } from 'lucide-react-native';
import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { colors } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';
import { useCompletionSocial, useDeleteCompletion, useToggleRespect } from '@/hooks/useCompletion';
import { buildCompletionShareMessage, shareCompletionGeneric, shareToWhatsApp } from '@/lib/shareLinks';
import { useAuth } from '@/providers/AuthProvider';
import { formatCompletionTime } from '@/utils/formatTime';
import { isSameUser } from '@/utils/identity';
import { questTitle } from '@/utils/questCopy';

import type { FeedPost } from './FeedPostCard';

export function FeedPostActions({
  post,
  lang,
  viewerId,
}: {
  post: FeedPost;
  lang: string;
  viewerId?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const { data: social } = useCompletionSocial(post.id, viewerId);
  const toggleR = useToggleRespect(post.id, viewerId);
  const deleteMut = useDeleteCompletion(post.id, post.user_id);
  const gave = social?.gaveRespect ?? false;
  const isOwn = isSameUser(viewerId, post.user_id);
  const counts = social?.counts ?? { respects: post.respectCount ?? 0, comments: post.commentCount ?? 0 };

  const title = post.group_quests?.title
    ? post.group_quests.title
    : post.quests
      ? questTitle(post.quests as Parameters<typeof questTitle>[0], lang)
      : 'SideQuest';
  const uname = post.profiles?.username ?? 'rupta';

  const thumbScale = useSharedValue(1);

  useEffect(() => {
    if (gave) {
      thumbScale.value = withSequence(withSpring(1.3, { damping: 8 }), withSpring(1));
    }
  }, [gave, thumbScale]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbScale.value }],
  }));

  const openShare = () => {
    const msg = buildCompletionShareMessage(title, uname);
    Alert.alert(t('feed.shareTitle'), undefined, [
      { text: t('feed.whatsapp'), onPress: () => void shareToWhatsApp(msg) },
      {
        text: t('feed.instagramStory'),
        onPress: () => router.push(`/(main)/share-card/${post.id}`),
      },
      { text: t('feed.shareMore'), onPress: () => void shareCompletionGeneric(null, msg) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View className="border-t border-border">
      <View className="flex-row items-center justify-between px-4 pt-3 pb-3">
        <Text className="text-muted text-xs">{formatCompletionTime(post.completed_at, lang)}</Text>
        <View className="flex-row items-center gap-5">
          <PressableScale
            onPress={() => viewerId && toggleR.mutate({ has: gave })}
            disabled={!viewerId || toggleR.isPending}
            hitSlop={10}
            scaleValue={0.9}
            className="flex-row items-center gap-1.5"
          >
            <Animated.View style={thumbStyle}>
              <ThumbsUp
                color={gave ? colors.respect : colors.slate}
                fill={gave ? colors.respect : 'none'}
                size={22}
                strokeWidth={2}
              />
            </Animated.View>
            {counts.respects > 0 ? (
              <Text className={`text-xs font-semibold ${gave ? 'text-respect' : 'text-muted'}`}>
                {counts.respects}
              </Text>
            ) : null}
          </PressableScale>
          <PressableScale
            onPress={() => router.push(`/(main)/completion/${post.id}`)}
            hitSlop={10}
            scaleValue={0.9}
            haptic={false}
            className="flex-row items-center gap-1.5"
          >
            <MessageCircle color={colors.slate} size={22} strokeWidth={2} />
            {counts.comments > 0 ? (
              <Text className="text-xs font-semibold text-muted">{counts.comments}</Text>
            ) : null}
          </PressableScale>
          <PressableScale onPress={openShare} hitSlop={10} scaleValue={0.9}>
            <Share2 color={colors.slate} size={22} strokeWidth={2} />
          </PressableScale>
          {isOwn ? (
            <PressableScale
              onPress={() =>
                Alert.alert(t('completion.deleteTitle'), t('completion.deleteMessage'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('completion.deleteConfirm'),
                    style: 'destructive',
                    onPress: () =>
                      deleteMut.mutate(undefined, {
                        onSuccess: async () => {
                          await refreshProfile();
                        },
                        onError: (e) =>
                          Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e)),
                      }),
                  },
                ])
              }
              disabled={deleteMut.isPending}
              hitSlop={10}
              scaleValue={0.9}
            >
              <Trash2 color={colors.dangerLight} size={22} strokeWidth={2} />
            </PressableScale>
          ) : null}
        </View>
      </View>
    </View>
  );
}
