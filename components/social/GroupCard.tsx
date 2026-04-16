import { memo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';

type Props = {
  group: { name: string; description?: string | null; avatar_url?: string | null };
  onPress?: () => void;
  right?: ReactNode;
};

export const GroupCard = memo(function GroupCard({ group, onPress, right }: Props) {
  const content = (
    <Card className="mb-3 flex-row items-center gap-3 py-4">
      <Avatar url={group.avatar_url ?? null} name={group.name} size={52} />
      <View className="flex-1 min-w-0">
        <Text className="text-foreground font-bold text-lg">{group.name}</Text>
        {group.description ? (
          <Text className="text-muted text-sm mt-1" numberOfLines={2}>
            {group.description}
          </Text>
        ) : null}
      </View>
      {right}
    </Card>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
});
