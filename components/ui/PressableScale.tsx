import { type ComponentProps } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

type Props = Omit<ComponentProps<typeof Pressable>, 'style'> & {
  scaleValue?: number;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SPRING_CFG = { damping: 15, stiffness: 150 };

export function PressableScale({
  scaleValue = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  children,
  style,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPressIn={(e) => {
          scale.value = withSpring(scaleValue, SPRING_CFG);
          if (haptic) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, SPRING_CFG);
          onPressOut?.(e);
        }}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
