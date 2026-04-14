import type { ReactNode } from 'react';
import { ActivityIndicator, Text } from 'react-native';

import { colors } from '@/constants/theme';

import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface',
  ghost: 'bg-transparent',
  danger: 'bg-danger/20',
};

const textVariants: Record<Variant, string> = {
  primary: 'text-white font-semibold',
  secondary: 'text-foreground font-semibold',
  ghost: 'text-primary font-semibold',
  danger: 'text-foreground font-semibold',
};

const hapticVariants: Record<Variant, boolean> = {
  primary: true,
  secondary: false,
  ghost: false,
  danger: true,
};

export function Button({
  onPress,
  children,
  variant = 'primary',
  disabled,
  loading,
  className = '',
}: {
  onPress: () => void;
  children: ReactNode;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      scaleValue={0.96}
      haptic={hapticVariants[variant]}
      className={`rounded-xl px-5 py-3.5 items-center justify-center min-h-[48px] ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} />
      ) : (
        <Text className={`text-base ${textVariants[variant]}`}>{children}</Text>
      )}
    </PressableScale>
  );
}
