import type { ReactNode } from 'react';
import { View } from 'react-native';

type Variant = 'default' | 'elevated' | 'glow';

const variantClasses: Record<Variant, string> = {
  default: 'bg-surface rounded-2xl border border-border p-4 shadow-sm shadow-black/20',
  elevated: 'bg-surfaceElevated rounded-2xl border border-border/60 p-4 shadow-md shadow-black/30',
  glow: 'bg-surface rounded-2xl border border-primary/30 p-4 shadow-lg shadow-primary/10',
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
