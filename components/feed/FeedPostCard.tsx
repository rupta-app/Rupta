import { useRouter } from 'expo-router';
import { MessageCircle, Share2, ThumbsUp, Trash2 } from 'lucide-react-native';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useCompletionSocial, useDeleteCompletion, useToggleRespect } from '@/hooks/useCompletion';
import { shareCompletionGeneric, shareToWhatsApp, buildCompletionShareMessage } from '@/lib/shareLinks';
import { useAuth } from '@/providers/AuthProvider';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { formatCompletionTime } from '@/utils/formatTime';
import { questTitle } from '@/utils/questCopy';
import { isSpontaneousAuraPending } from '@/utils/spontaneousAura';

export type FeedPost = {
  id: string;
  user_id: string;
  aura_earned: number;
  caption: string | null;
  completed_at: string;
  quest_source_type?: string;
  profiles?: { username: string; display_name: string; avatar_url: string | null };
  quests?: { title_en: string; title_es: string; category: string } | null;
  group_quests?: { title: string } | null;
  groups?: { id: string; name: string } | null;
  quest_media?: { media_url: string }[];
  respectCount?: number;
  commentCount?: number;
};

function FeedPostActions({
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
  const isOwn =
    Boolean(viewerId && post.user_id) &&
    String(viewerId).toLowerCase() === String(post.user_id).toLowerCase();
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
            <ThumbsUp color={gave ? '#F59E0B' : '#CBD5E1'} size={22} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={() => router.push(`/(main)/completion/${post.id}`)} hitSlop={10}>
            <MessageCircle color="#CBD5E1" size={22} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={openShare} hitSlop={10}>
            <Share2 color="#CBD5E1" size={22} strokeWidth={2} />
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
              <Trash2 color="#F87171" size={22} strokeWidth={2} />
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

export function FeedPostCard({
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
  const media = post.quest_media?.[0]?.media_url;
  const title = post.group_quests?.title
    ? post.group_quests.title
    : post.quests
      ? questTitle(post.quests as Parameters<typeof questTitle>[0], lang)
      : 'SideQuest';

  return (
    <Card className="mb-4 p-0 overflow-hidden">
      <Pressable onPress={() => router.push(`/(main)/completion/${post.id}`)}>
        <View className="flex-row items-center gap-3 p-4 pb-2">
          <Avatar url={post.profiles?.avatar_url} name={post.profiles?.display_name ?? '?'} size={40} />
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{post.profiles?.display_name}</Text>
            <Text className="text-muted text-xs">@{post.profiles?.username}</Text>
          </View>
          <View className="items-end gap-1">
            {post.quest_source_type === 'group' ? (
              <Badge tone="secondary">{post.groups?.name ?? t('feed.groupQuest')}</Badge>
            ) : post.quest_source_type === 'spontaneous' ? (
              <Badge tone="secondary">{t('feed.spontaneousQuest')}</Badge>
            ) : null}
            {isSpontaneousAuraPending(post.quest_source_type, post.aura_earned) ? (
              <Badge tone="secondary">{t('feed.auraPendingReview')}</Badge>
            ) : (
              <Badge tone="primary">+{post.aura_earned} AURA</Badge>
            )}
          </View>
        </View>
        {media ? (
          <View className="mx-4 overflow-hidden rounded-2xl bg-surfaceElevated">
            <Image source={{ uri: media }} className="w-full h-56" resizeMode="cover" />
          </View>
        ) : null}
        <View className="p-4 pt-2">
          <Text className="text-foreground text-lg font-bold">{title}</Text>
          {post.quests?.category ? (
            <Text className="text-muted text-xs uppercase mt-1 tracking-wide">
              {formatCategoryLabel(post.quests.category, lang)}
            </Text>
          ) : post.group_quests ? (
            <Text className="text-muted text-xs uppercase mt-1 tracking-wide">{t('feed.groupQuest')}</Text>
          ) : null}
          {post.caption ? <Text className="text-muted mt-2">{post.caption}</Text> : null}
        </View>
      </Pressable>
      <FeedPostActions post={post} lang={lang} viewerId={viewerId} />
    </Card>
  );
}
