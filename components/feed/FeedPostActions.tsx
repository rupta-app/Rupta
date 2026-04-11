import { useRouter } from 'expo-router';
import { MessageCircle, Share2, ThumbsUp, Trash2 } from 'lucide-react-native';
import { Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/theme';
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
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
        <Text className="text-muted text-xs">{formatCompletionTime(post.completed_at, lang)}</Text>
        <View className="flex-row items-center gap-6">
          <Pressable
            onPress={() => viewerId && toggleR.mutate({ has: gave })}
            disabled={!viewerId || toggleR.isPending}
            hitSlop={10}
          >
            <ThumbsUp color={gave ? colors.respect : colors.slate} size={22} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={() => router.push(`/(main)/completion/${post.id}`)} hitSlop={10}>
            <MessageCircle color={colors.slate} size={22} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={openShare} hitSlop={10}>
            <Share2 color={colors.slate} size={22} strokeWidth={2} />
          </Pressable>
          {isOwn ? (
            <Pressable
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
            >
              <Trash2 color={colors.dangerLight} size={22} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View className="flex-row gap-4 px-4 pb-3">
        <Text className="text-muted text-xs">
          {counts.respects} {t('common.respect')}
        </Text>
        <Text className="text-muted text-xs">
          {counts.comments} {t('social.comments')}
        </Text>
      </View>
    </View>
  );
}
