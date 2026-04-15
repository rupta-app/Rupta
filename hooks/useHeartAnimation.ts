import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

/**
 * Animated heart scale that pulses when `gave` flips to true after the
 * initial social data load (avoids animating on first render).
 */
export function useHeartAnimation(social: unknown, gave: boolean) {
  const heartScale = useSharedValue(1);
  const hasLoadedSocial = useSharedValue(false);

  useEffect(() => {
    if (social) {
      if (hasLoadedSocial.value && gave) {
        heartScale.value = withSequence(
          withSpring(1.25, { damping: 12, stiffness: 400 }),
          withSpring(1, { damping: 14, stiffness: 300 }),
        );
      }
      hasLoadedSocial.value = true;
    }
  }, [gave, social, heartScale, hasLoadedSocial]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  return { heartStyle };
}
