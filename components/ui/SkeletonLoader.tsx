import { type DimensionValue, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

import { colors, radii } from '@/constants/theme';

export function Skeleton({
  width,
  height,
  rounded = 'md',
}: {
  width: DimensionValue;
  height: number;
  rounded?: keyof typeof radii;
}) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 1000 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    width,
    height,
    borderRadius: radii[rounded],
    backgroundColor: colors.surfaceElevated,
  }));

  return <Animated.View style={style} />;
}

export function FeedPostSkeleton() {
  return (
    <View className="bg-surface rounded-2xl border border-border p-4 mb-4">
      <View className="flex-row items-center gap-3 mb-3">
        <Skeleton width={40} height={40} rounded="full" />
        <View className="flex-1 gap-2">
          <Skeleton width="60%" height={14} rounded="sm" />
          <Skeleton width="40%" height={12} rounded="sm" />
        </View>
      </View>
      <Skeleton width="100%" height={224} rounded="lg" />
      <View className="mt-3 gap-2">
        <Skeleton width="70%" height={16} rounded="sm" />
        <Skeleton width="45%" height={12} rounded="sm" />
      </View>
      <View className="flex-row gap-6 mt-3">
        <Skeleton width={22} height={22} rounded="sm" />
        <Skeleton width={22} height={22} rounded="sm" />
        <Skeleton width={22} height={22} rounded="sm" />
      </View>
    </View>
  );
}
