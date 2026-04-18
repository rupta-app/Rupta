import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { imageUrl } from '@/lib/mediaUrls';

export function Avatar({
  url,
  name,
  size = 44,
}: {
  url?: string | null;
  name: string;
  size?: number;
}) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const radius = size / 2;
  if (url) {
    return (
      <Image
        source={{ uri: imageUrl(url, 'public') }}
        contentFit="cover"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.surfaceElevated,
        }}
      />
    );
  }
  return (
    <View
      className="rounded-full bg-primary items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Text className="text-white font-bold" style={{ fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}
