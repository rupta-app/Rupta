import { useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';

type Tab<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
};

export function SegmentedTabBar<T extends string>({ tabs, active, onChange }: Props<T>) {
  const segmentLayout = useRef<{ x: number; width: number }[]>([]);
  const indicatorLeft = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const activeIndex = tabs.findIndex((t) => t.key === active);

  const applyIndicator = useCallback(() => {
    if (activeIndex < 0) return;
    const seg = segmentLayout.current[activeIndex];
    if (!seg || seg.width <= 0) return;
    indicatorLeft.value = withTiming(seg.x, { duration: 250 });
    indicatorWidth.value = withTiming(seg.width, { duration: 250 });
  }, [activeIndex, indicatorLeft, indicatorWidth]);

  useEffect(() => {
    applyIndicator();
  }, [applyIndicator]);

  const handleSegmentLayout = useCallback(
    (index: number) => (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      segmentLayout.current[index] = { x, width };
      applyIndicator();
    },
    [applyIndicator],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorLeft.value,
    width: indicatorWidth.value,
  }));

  return (
    <View>
      <View className="flex-row relative">
        {tabs.map(({ key, label }, index) => {
          const isActive = active === key;
          return (
            <View key={key} className="flex-1" onLayout={handleSegmentLayout(index)}>
              <PressableScale
                onPress={() => onChange(key)}
                scaleValue={0.96}
                className="items-center py-2.5"
              >
                <Text
                  className={`text-sm font-semibold ${isActive ? 'text-foreground' : 'text-muted'}`}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </PressableScale>
            </View>
          );
        })}
        <Animated.View
          className="absolute bottom-0 h-0.5 bg-primary rounded-full"
          style={indicatorStyle}
        />
      </View>
    </View>
  );
}
