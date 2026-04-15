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
    default: 'bg-surface',
    primary: 'bg-primary/15',
    respect: 'bg-respect/15',
    secondary: 'bg-secondary/15',
  };
  const textTones = {
    default: 'text-muted',
    primary: 'text-primary',
    respect: 'text-respect',
    secondary: 'text-secondary',
  };
  return (
    <View className={`px-2.5 py-1 rounded-lg ${tones[tone]}`}>
      <Text className={`text-xs font-semibold uppercase tracking-wide ${textTones[tone]}`}>
        {children}
      </Text>
    </View>
  );
}
