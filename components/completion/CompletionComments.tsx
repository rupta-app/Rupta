import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { ArrowUp, Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/theme';
import {
  useAddComment,
  useCommentSocial,
  useComments,
  useDeleteComment,
  useReportComment,
  useToggleCommentLike,
} from '@/hooks/useCompletion';
import { useAuth } from '@/providers/AuthProvider';
import { formatCompletionTime } from '@/utils/formatTime';
import { appLang } from '@/utils/lang';

type CommentData = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  like_count: number;
  profiles?: { id?: string; username: string; display_name: string; avatar_url?: string | null };
};

export function CompletionComments({
  completionId,
  userId,
}: {
  completionId: string;
  userId: string | undefined;
}) {
  const { t, i18n } = useTranslation();
  const lang = appLang(i18n);
  const { profile } = useAuth();
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useComments(completionId);
  const addC = useAddComment(completionId, userId);
  const deleteC = useDeleteComment(completionId);
  const reportC = useReportComment();
  const [comment, setComment] = useState('');

  const comments = useMemo(
    () => (data?.pages.flatMap((p) => p.comments) ?? []) as CommentData[],
    [data],
  );
  const commentIds = useMemo(() => comments.map((c) => c.id), [comments]);
  const { data: social } = useCommentSocial(completionId, userId, commentIds);
  const toggleLike = useToggleCommentLike(completionId, userId);

  const handleLongPress = (c: CommentData) => {
    const isOwn = userId === c.user_id;
    if (isOwn) {
      Alert.alert('', undefined, [
        {
          text: t('social.deleteComment'),
          style: 'destructive',
          onPress: () => deleteC.mutate(c.id),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    } else if (userId) {
      Alert.alert('', undefined, [
        {
          text: t('social.reportComment'),
          onPress: () =>
            reportC.mutate(
              { commentId: c.id, reporterId: userId, reportedUserId: c.user_id, reason: 'harassment' },
              { onSuccess: () => Alert.alert(t('social.commentReported')) },
            ),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  };

  return (
    <View>
      {comments.map((c) => {
        const likeCount = c.like_count;
        const liked = social?.liked.has(c.id) ?? false;

        return (
          <Pressable key={c.id} onLongPress={() => handleLongPress(c)} delayLongPress={400}>
            <View className="flex-row mb-4">
              <Avatar url={c.profiles?.avatar_url} name={c.profiles?.display_name ?? '?'} size={28} />
              <View className="flex-1 ml-3">
                <Text className="text-sm leading-5">
                  <Text className="text-foreground font-bold">{c.profiles?.username}</Text>
                  {'  '}
                  <Text className="text-foreground">{c.content}</Text>
                </Text>
                <Text className="text-mutedForeground text-xs mt-1">
                  {formatCompletionTime(c.created_at, lang)}
                </Text>
              </View>
              <Pressable
                onPress={() => userId && toggleLike.mutate({ commentId: c.id, hasLiked: liked })}
                hitSlop={10}
                className="items-center ml-3 pt-1"
              >
                <Heart
                  color={liked ? colors.respect : colors.mutedForeground}
                  fill={liked ? colors.respect : 'none'}
                  size={14}
                  strokeWidth={2}
                />
                {likeCount > 0 ? (
                  <Text className={`text-xs mt-0.5 ${liked ? 'text-respect' : 'text-mutedForeground'}`}>
                    {likeCount}
                  </Text>
                ) : null}
              </Pressable>
            </View>
          </Pressable>
        );
      })}

      {hasNextPage ? (
        <Pressable onPress={() => fetchNextPage()} disabled={isFetchingNextPage} className="mb-3">
          <Text className="text-mutedForeground text-xs font-semibold">
            {isFetchingNextPage ? t('common.loading') : t('social.viewMoreComments')}
          </Text>
        </Pressable>
      ) : null}

      {userId ? (
        <View className="flex-row items-center gap-3 mt-1">
          <Avatar url={profile?.avatar_url} name={profile?.display_name ?? '?'} size={28} />
          <View className="flex-1 flex-row items-center bg-surface rounded-full px-4 py-2.5">
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder={t('social.addComment')}
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 text-foreground text-sm"
              maxLength={500}
            />
            {comment.trim() ? (
              <Pressable
                onPress={() => {
                  addC.mutate(comment.trim(), { onSuccess: () => setComment('') });
                }}
                disabled={addC.isPending}
                hitSlop={8}
                className="ml-2 w-6 h-6 rounded-full bg-primary items-center justify-center"
              >
                <ArrowUp color={colors.white} size={14} strokeWidth={3} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
