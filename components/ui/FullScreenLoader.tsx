import { ActivityIndicator, Image, Text, View } from 'react-native';

import { logoMark } from '@/constants/branding';

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <View className="flex-1 bg-background items-center justify-center px-8">
      <View className="rounded-2xl border border-primary/30 bg-surfaceElevated px-10 py-10 items-center max-w-sm w-full">
        <Image
          source={logoMark}
          accessibilityLabel="Rupta"
          resizeMode="contain"
          style={{ width: 140, height: 40, marginBottom: 24 }}
        />
        <ActivityIndicator color="#8B5CF6" size="large" />
        {label ? <Text className="text-muted text-sm mt-5 text-center">{label}</Text> : null}
      </View>
    </View>
  );
}
