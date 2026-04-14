import { Image } from 'expo-image';
import { Text, View } from 'react-native';

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
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        className="rounded-full bg-surfaceElevated"
        style={{ width: size, height: size }}
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
