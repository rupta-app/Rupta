import { useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { CATEGORY_CONFIG } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { questTitle } from '@/utils/questCopy';
import { isSpontaneousAuraPending } from '@/utils/spontaneousAura';

import { FeedPostActions } from './FeedPostActions';
import { FeedPostMedia } from './FeedPostMedia';

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
  quest_media?: { media_url: string; media_type?: 'photo' | 'video' }[];
  media_count?: number;
  respectCount?: number;
  commentCount?: number;
  gaveRespect?: boolean;
};

export const FeedPostCard = memo(function FeedPostCard({
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
  const mediaItems = post.quest_media ?? [];
  const hasMedia = mediaItems.length > 0;
  const title = post.group_quests?.title
    ? post.group_quests.title
    : post.quests
      ? questTitle(post.quests as Parameters<typeof questTitle>[0], lang)
      : t('common.sideQuest');

  const displayName = post.profiles?.display_name ?? '?';
  const avatarUrl = post.profiles?.avatar_url;
  const categoryKey = post.quests?.category;
  const categoryLabel = categoryKey
    ? formatCategoryLabel(categoryKey, lang)
    : post.group_quests
      ? t('feed.groupQuest')
      : null;
  const cat = CATEGORY_CONFIG[categoryKey ?? ''] ?? CATEGORY_CONFIG.random;
  const auraPending = isSpontaneousAuraPending(post.quest_source_type, post.aura_earned);

  const goDetail = useCallback(
    () => router.push(`/(main)/completion/${post.id}`),
    [router, post.id],
  );

  return (
    <View className="bg-surface rounded-2xl overflow-hidden mb-3">
      {/* Hero media with overlays — media manages its own taps/swipes */}
      {hasMedia ? (
        <View className="relative">
          <FeedPostMedia items={mediaItems} postId={post.id} onSlideTap={goDetail} />
          <View
            pointerEvents="none"
            className="absolute top-3 left-3 flex-row items-center bg-black/50 rounded-full pl-1 pr-3 py-1"
          >
            <Avatar url={avatarUrl} name={displayName} size={32} />
            <View className="ml-2">
              <Text className="text-white text-sm font-bold">{displayName}</Text>
              <Text className="text-white/60 text-xs">@{post.profiles?.username}</Text>
            </View>
          </View>
        </View>
      ) : (
        <Pressable onPress={goDetail} className="flex-row items-center px-4 pt-4">
          <Avatar url={avatarUrl} name={displayName} size={32} />
          <View className="ml-2.5">
            <Text className="text-foreground text-sm font-bold">{displayName}</Text>
            <Text className="text-muted text-xs">@{post.profiles?.username}</Text>
          </View>
        </Pressable>
      )}

      {/* Text content — tap navigates; inner buttons below win over this */}
      <Pressable onPress={goDetail} className="px-4 pt-3">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="text-foreground text-base font-bold leading-5 flex-1" numberOfLines={2}>
            {title}
          </Text>
          {!auraPending ? (
            <View
              className="rounded-full px-2.5 py-0.5"
              style={{ backgroundColor: colors.primaryGlow }}
            >
              <Text className="text-primary text-xs font-bold">+{post.aura_earned} AURA</Text>
            </View>
          ) : null}
        </View>
        {categoryLabel ? (
          <Text className="text-xs font-semibold uppercase tracking-wide mt-1" style={{ color: cat.accent }}>
            {categoryLabel}
          </Text>
        ) : null}
        {post.caption ? (
          <Text className="text-muted text-sm mt-1 leading-5" numberOfLines={2}>
            {post.caption}
          </Text>
        ) : null}
      </Pressable>

      {/* Actions — each button is its own Pressable */}
      <View className="px-4 pb-4 pt-3">
        <FeedPostActions post={post} lang={lang} viewerId={viewerId} />
      </View>
    </View>
  );
});
