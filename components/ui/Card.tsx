import type { ReactNode } from 'react';
import { View } from 'react-native';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={`bg-surface rounded-2xl border border-border p-4 ${className}`}>{children}</View>
  );
}
