import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAddComment, useComments } from '@/hooks/useCompletion';

export function CompletionComments({
  completionId,
  userId,
}: {
  completionId: string;
  userId: string | undefined;
}) {
  const { t } = useTranslation();
  const { data: comments = [] } = useComments(completionId);
  const addC = useAddComment(completionId, userId);
  const [comment, setComment] = useState('');

  return (
    <View className="px-4 border-t border-border pt-4 mt-2">
      <Text className="text-foreground font-bold mb-2">{t('social.comments')}</Text>
      {comments.map(
        (c: {
          id: string;
          content: string;
          profiles?: { username: string; display_name: string };
        }) => (
          <Card key={c.id} className="mb-2 py-2">
            <Text className="text-foreground font-semibold">@{c.profiles?.username}</Text>
            <Text className="text-muted mt-1">{c.content}</Text>
          </Card>
        ),
      )}
      {userId ? (
        <View className="mt-2">
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={t('social.addComment')}
            placeholderTextColor={colors.mutedForeground}
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-2"
          />
          <Button
            variant="secondary"
            onPress={() => {
              if (!comment.trim()) return;
              addC.mutate(comment.trim(), { onSuccess: () => setComment('') });
            }}
          >
            {t('common.save')}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
