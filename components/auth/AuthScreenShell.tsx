import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logoMark } from '@/constants/branding';

export function AuthScreenShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: Math.max(insets.top, 20) + 20,
        paddingBottom: Math.max(insets.bottom, 20) + 12,
        paddingHorizontal: 28,
        justifyContent: 'space-between',
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View>
        <View className="items-center">
          <View className="rounded-3xl bg-primary/10 p-5 border border-primary/25">
            <Image
              source={logoMark}
              accessibilityLabel="Rupta"
              contentFit="contain"
              style={{ width: 160, height: 52 }}
            />
          </View>
        </View>
        <Text className="text-center text-foreground text-[32px] font-bold mt-12 tracking-tight">
          {title}
        </Text>
        <Text className="text-center text-muted text-base mt-3 leading-6 px-1">{subtitle}</Text>
        <View className="mt-11">{children}</View>
      </View>
      <View className="items-center pt-8 pb-2">{footer}</View>
    </ScrollView>
  );
}
