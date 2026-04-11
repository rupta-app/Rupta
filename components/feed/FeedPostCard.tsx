import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { questTitle } from '@/utils/questCopy';
import { isSpontaneousAuraPending } from '@/utils/spontaneousAura';

import { FeedPostActions } from './FeedPostActions';

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
            <Image source={{ uri: media }} style={{ width: '100%', height: 224 }} contentFit="cover" />
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
