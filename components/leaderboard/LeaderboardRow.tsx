import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';

type Props = {
  rank: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  aura: number;
  onPress?: () => void;
};

export function LeaderboardRow({ rank, displayName, username, avatarUrl, aura, onPress }: Props) {
  const content = (
    <Card className="mb-2 flex-row items-center gap-3">
      <Text className="text-muted w-6 text-lg font-bold">#{rank}</Text>
      <Avatar url={avatarUrl} name={displayName} size={40} />
      <View className="flex-1">
        <Text className="text-foreground font-semibold">{displayName}</Text>
        <Text className="text-muted text-xs">@{username}</Text>
      </View>
      <Text className="text-primary font-black">{aura}</Text>
    </Card>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}
