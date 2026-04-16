import { type ComponentProps } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<ComponentProps<typeof Pressable>, 'style'> & {
  scaleValue?: number;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SPRING_CFG = { damping: 15, stiffness: 150 };

/**
 * Press feedback with scale animation. Layout/touch must live on the same node as the
 * Pressable — previously styles were on an outer Animated.View so only the label-sized
 * inner Pressable received touches.
 */
export function PressableScale({
  scaleValue = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  children,
  style,
  className,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        scale.value = withSpring(scaleValue, SPRING_CFG);
        if (haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING_CFG);
        onPressOut?.(e);
      }}
      style={[animatedStyle, style]}
      className={className}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
