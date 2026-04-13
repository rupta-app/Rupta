import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-primary active:opacity-90',
  secondary: 'bg-surfaceElevated border border-border active:opacity-80',
  ghost: 'bg-transparent active:bg-surfaceElevated',
  danger: 'bg-danger/30 border border-danger active:opacity-80',
};

const textVariants: Record<Variant, string> = {
  primary: 'text-white font-semibold',
  secondary: 'text-foreground font-semibold',
  ghost: 'text-primary font-semibold',
  danger: 'text-foreground font-semibold',
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
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-xl px-5 py-3.5 items-center justify-center min-h-[48px] ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} />
      ) : (
        <Text className={`text-base ${textVariants[variant]}`}>{children}</Text>
      )}
    </Pressable>
  );
}
