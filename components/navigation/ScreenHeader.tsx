import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, onBack, right }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-2 py-2 border-b border-border">
        <Pressable onPress={onBack ?? (() => router.back())} className="p-2 flex-row items-center gap-2">
          <ChevronLeft color={colors.foreground} size={28} />
          <Text className="text-foreground font-bold text-lg">{title}</Text>
        </Pressable>
        {right}
      </View>
    </View>
  );
}
