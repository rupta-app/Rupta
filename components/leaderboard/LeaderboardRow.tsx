import { Text, View } from 'react-native';
import { Medal, Trophy } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';

const RANK_COLORS = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
} as const;

type Props = {
  rank: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  aura: number;
  onPress?: () => void;
};

function RankIndicator({ rank }: { rank: number }) {
  const color = RANK_COLORS[rank as keyof typeof RANK_COLORS];
  if (rank === 1) {
    return <Trophy size={22} color={color} strokeWidth={2} />;
  }
  if (rank === 2 || rank === 3) {
    return <Medal size={22} color={color} strokeWidth={2} />;
  }
  return <Text className="text-muted w-6 text-lg font-bold">#{rank}</Text>;
}

export function LeaderboardRow({ rank, displayName, username, avatarUrl, aura, onPress }: Props) {
  const isTop3 = rank <= 3;
  const borderColor = RANK_COLORS[rank as keyof typeof RANK_COLORS];
  const borderClass = isTop3 ? '' : '';

  const content = (
    <Card
      className={`mb-2 flex-row items-center gap-3 ${borderClass}`}
      {...(isTop3 ? { style: { borderColor: borderColor + '33' } } : {})}
    >
      <View className="w-7 items-center">
        <RankIndicator rank={rank} />
      </View>
      <Avatar url={avatarUrl} name={displayName} size={40} />
      <View className="flex-1">
        <Text className="text-foreground font-semibold">{displayName}</Text>
        <Text className="text-muted text-xs">@{username}</Text>
      </View>
      <View className="items-end">
        <Text className={`text-primary font-black ${isTop3 ? 'text-lg' : 'text-base'}`}>{aura}</Text>
        <Text className="text-muted text-xs">AURA</Text>
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleValue={0.98} haptic={false}>
        {content}
      </PressableScale>
    );
  }
  return content;
}
