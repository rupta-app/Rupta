import { useEffect, useRef } from 'react';
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
  const tabWidths = useRef<number[]>(new Array(tabs.length).fill(0));
  const indicatorLeft = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const activeIndex = tabs.findIndex((t) => t.key === active);

  useEffect(() => {
    const w = tabWidths.current[activeIndex];
    if (w > 0) {
      const left = tabWidths.current.slice(0, activeIndex).reduce((a, b) => a + b, 0);
      indicatorLeft.value = withTiming(left, { duration: 250 });
      indicatorWidth.value = withTiming(w, { duration: 250 });
    }
  }, [activeIndex, indicatorLeft, indicatorWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorLeft.value,
    width: indicatorWidth.value,
  }));

  const handleLayout = (index: number) => (e: LayoutChangeEvent) => {
    tabWidths.current[index] = e.nativeEvent.layout.width;
    if (index === activeIndex) {
      const left = tabWidths.current.slice(0, index).reduce((a, b) => a + b, 0);
      indicatorLeft.value = left;
      indicatorWidth.value = e.nativeEvent.layout.width;
    }
  };

  return (
    <View>
      <View className="flex-row relative">
        {tabs.map(({ key, label }, index) => {
          const isActive = active === key;
          return (
            <PressableScale
              key={key}
              onPress={() => onChange(key)}
              scaleValue={0.96}
              className="flex-1 items-center py-2.5"
              onLayout={handleLayout(index)}
            >
              <Text
                className={`text-sm font-semibold ${isActive ? 'text-foreground' : 'text-muted'}`}
                numberOfLines={1}
              >
                {label}
              </Text>
            </PressableScale>
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
