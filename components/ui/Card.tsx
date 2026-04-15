import type { ReactNode } from 'react';
import { View } from 'react-native';

type Variant = 'default' | 'elevated' | 'glow';

const variantClasses: Record<Variant, string> = {
  default: 'bg-surface rounded-2xl p-4',
  elevated: 'bg-surfaceElevated rounded-2xl p-4',
  glow: 'bg-surfaceElevated rounded-2xl border border-primary/20 p-4',
};

export function Card({
  children,
  className = '',
  variant = 'default',
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
}) {
  return (
    <View className={`${variantClasses[variant]} ${className}`}>{children}</View>
  );
}
