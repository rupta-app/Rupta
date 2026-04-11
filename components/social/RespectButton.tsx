import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThumbsUp } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';

export function RespectButton({
  active,
  onPress,
  loading,
  count = 0,
}: {
  active: boolean;
  onPress: () => void;
  loading?: boolean;
  count?: number;
}) {
  const { t } = useTranslation();
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      iconScale.value = withSequence(withSpring(1.4, { damping: 8 }), withSpring(1));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [active, iconScale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <PressableScale
      onPress={onPress}
      disabled={loading}
      scaleValue={0.92}
      haptic={false}
      className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${active ? 'bg-respect/20 border-respect' : 'border-border bg-surfaceElevated'}`}
    >
      <Animated.View style={iconStyle}>
        <ThumbsUp
          size={18}
          color={active ? colors.respect : colors.muted}
          fill={active ? colors.respect : 'none'}
          strokeWidth={2}
        />
      </Animated.View>
      <Text className={`font-bold ${active ? 'text-respect' : 'text-muted'}`}>
        {count > 0 ? `${count} ` : ''}{active ? t('social.removeRespect') : t('social.giveRespect')}
      </Text>
    </PressableScale>
  );
}
