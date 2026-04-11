import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';

import { colors } from '@/constants/theme';

import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <Animated.View entering={FadeIn.duration(300)} className="flex-1 items-center justify-center py-16 px-8">
      <Icon size={48} color={colors.muted} strokeWidth={1.5} opacity={0.4} />
      <Text className="text-foreground text-lg font-semibold text-center mt-4">{title}</Text>
      {subtitle ? (
        <Text className="text-muted text-sm text-center mt-2 leading-6 px-6">{subtitle}</Text>
      ) : null}
      {action ? (
        <View className="mt-6">
          <Button variant="secondary" onPress={action.onPress}>
            {action.label}
          </Button>
        </View>
      ) : null}
    </Animated.View>
  );
}
