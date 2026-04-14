import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';

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
      <View className="flex-row items-center justify-between px-2 py-2">
        <PressableScale
          onPress={onBack ?? (() => router.back())}
          className="p-2 flex-row items-center gap-2"
          hitSlop={12}
          scaleValue={0.92}
        >
          <ChevronLeft color={colors.foreground} size={24} />
          <Text className="text-foreground font-bold text-lg">{title}</Text>
        </PressableScale>
        {right}
      </View>
    </View>
  );
}
