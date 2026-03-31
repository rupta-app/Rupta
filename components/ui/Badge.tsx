import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'primary' | 'respect' | 'secondary';
}) {
  const tones = {
    default: 'bg-surfaceElevated border-border',
    primary: 'bg-primary/20 border-primary/40',
    respect: 'bg-respect/15 border-respect/40',
    secondary: 'bg-secondary/15 border-secondary/40',
  };
  const textTones = {
    default: 'text-muted',
    primary: 'text-primary',
    respect: 'text-respect',
    secondary: 'text-secondary',
  };
  return (
    <View className={`px-2.5 py-1 rounded-full border ${tones[tone]}`}>
      <Text className={`text-xs font-semibold uppercase tracking-wide ${textTones[tone]}`}>
        {children}
      </Text>
    </View>
  );
}
