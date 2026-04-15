import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AlertTriangle } from 'lucide-react-native';

import { colors } from '@/constants/theme';

import { Button } from './Button';

export function ErrorState({
  title,
  subtitle,
  onRetry,
  retryLabel,
}: {
  title: string;
  subtitle?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <Animated.View entering={FadeIn.duration(300)} className="flex-1 items-center justify-center py-24 px-8">
      <View className="w-16 h-16 rounded-2xl bg-surfaceElevated items-center justify-center mb-4">
        <AlertTriangle size={28} color={colors.danger} strokeWidth={1.5} />
      </View>
      <Text className="text-foreground text-xl font-bold text-center">{title}</Text>
      {subtitle ? (
        <Text className="text-muted text-sm text-center mt-2 leading-6 px-6">{subtitle}</Text>
      ) : null}
      {onRetry ? (
        <View className="mt-6">
          <Button variant="secondary" onPress={onRetry}>
            {retryLabel ?? 'Retry'}
          </Button>
        </View>
      ) : null}
    </Animated.View>
  );
}
