import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';

type Props = {
  user: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    total_aura?: number;
  };
  onPress?: () => void;
  right?: React.ReactNode;
};

export function UserListItem({ user, onPress, right }: Props) {
  const content = (
    <Card className="mb-2 flex-row items-center gap-3 py-3">
      <Avatar url={user.avatar_url} name={user.display_name} size={44} />
      <View className="flex-1 min-w-0">
        <Text className="text-foreground font-semibold">{user.display_name}</Text>
        <Text className="text-muted text-xs">@{user.username}</Text>
      </View>
      {right}
    </Card>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}
