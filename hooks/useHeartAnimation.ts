import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

/**
 * Animated heart scale that pulses when `gave` flips to true
 * after the initial render (avoids animating on mount).
 */
export function useHeartAnimation(gave: boolean) {
  const heartScale = useSharedValue(1);
  const isFirstRender = useSharedValue(true);

  useEffect(() => {
    if (isFirstRender.value) {
      isFirstRender.value = false;
      return;
    }
    if (gave) {
      heartScale.value = withSequence(
        withSpring(1.25, { damping: 12, stiffness: 400 }),
        withSpring(1, { damping: 14, stiffness: 300 }),
      );
    }
  }, [gave, heartScale, isFirstRender]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  return { heartStyle };
}
