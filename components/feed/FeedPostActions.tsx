import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Send } from 'lucide-react-native';
import { memo } from 'react';
import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';

import { colors } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';
import { useToggleRespect } from '@/hooks/useCompletion';
import { useHeartAnimation } from '@/hooks/useHeartAnimation';
import { buildCompletionShareMessage, shareCompletionGeneric, shareToWhatsApp } from '@/lib/shareLinks';
import { questTitle } from '@/utils/questCopy';

import type { FeedPost } from './FeedPostCard';

export const FeedPostActions = memo(function FeedPostActions({
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
  const toggleR = useToggleRespect(post.id, viewerId);
  const gave = post.gaveRespect ?? false;
  const counts = { respects: post.respectCount ?? 0, comments: post.commentCount ?? 0 };

  const title = post.group_quests?.title
    ? post.group_quests.title
    : post.quests
      ? questTitle(post.quests as Parameters<typeof questTitle>[0], lang)
      : t('common.sideQuest');
  const uname = post.profiles?.username ?? 'rupta';

  const { heartStyle } = useHeartAnimation(gave);

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
    <View className="flex-row items-center mt-3">
      {/* Left: like + comment */}
      <PressableScale
        onPress={() => viewerId && toggleR.mutate({ has: gave })}
        disabled={!viewerId || toggleR.isPending}
        hitSlop={10}
        scaleValue={0.9}
      >
        <View className="flex-row items-center gap-1.5">
          <Animated.View style={heartStyle}>
            <Heart
              color={gave ? colors.respect : colors.muted}
              fill={gave ? colors.respect : 'none'}
              size={22}
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
      <PressableScale
        onPress={() => router.push(`/(main)/completion/${post.id}`)}
        hitSlop={10}
        scaleValue={0.9}
        haptic={false}
        className="ml-4"
      >
        <View className="flex-row items-center gap-1.5">
          <MessageCircle color={colors.muted} size={22} strokeWidth={2} />
          {counts.comments > 0 ? (
            <Text className="text-sm font-semibold text-muted">
              {counts.comments}
            </Text>
          ) : null}
        </View>
      </PressableScale>
      {/* Right: share */}
      <View className="flex-1" />
      <PressableScale onPress={openShare} hitSlop={10} scaleValue={0.9}>
        <Send color={colors.muted} size={20} strokeWidth={2} />
      </PressableScale>
    </View>
  );
});
