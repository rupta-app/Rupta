import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { PressableScale } from '@/components/ui/PressableScale';
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
      : t('common.sideQuest');

  const displayName = post.profiles?.display_name ?? '?';
  const avatarUrl = post.profiles?.avatar_url;
  const category = post.quests?.category
    ? formatCategoryLabel(post.quests.category, lang)
    : post.group_quests
      ? t('feed.groupQuest')
      : null;
  const auraPending = isSpontaneousAuraPending(post.quest_source_type, post.aura_earned);

  return (
    <View className="mb-6">
      <PressableScale
        onPress={() => router.push(`/(main)/completion/${post.id}`)}
        scaleValue={0.98}
        haptic={false}
      >
        {media ? (
          <View className="relative">
            <View className="overflow-hidden rounded-3xl bg-surfaceElevated">
              <Image
                source={{ uri: media }}
                style={{ width: '100%', aspectRatio: 3 / 4 }}
                contentFit="cover"
                transition={{ effect: 'cross-dissolve', duration: 200 }}
              />
            </View>
            <View className="absolute bottom-3 left-3 flex-row items-center bg-black/50 rounded-full pl-1 pr-3 py-1">
              <Avatar url={avatarUrl} name={displayName} size={24} />
              <Text className="text-white text-xs font-semibold ml-1.5">{displayName}</Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center gap-2.5 mb-2">
            <Avatar url={avatarUrl} name={displayName} size={32} />
            <Text className="text-foreground font-semibold text-sm">{displayName}</Text>
          </View>
        )}

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-foreground text-base font-bold flex-1 mr-2">{title}</Text>
          {!auraPending ? (
            <Text className="text-primary text-sm font-bold">+{post.aura_earned} AURA</Text>
          ) : null}
        </View>
        {category ? (
          <Text className="text-mutedForeground text-xs mt-0.5">{category}</Text>
        ) : null}
        {post.caption ? (
          <Text className="text-muted text-sm mt-1">{post.caption}</Text>
        ) : null}
      </PressableScale>
      <FeedPostActions post={post} lang={lang} viewerId={viewerId} />
    </View>
  );
}
