import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
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
    <View className="bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-1">
        <View className="flex-row items-center gap-3 flex-1">
          <PressableScale
            onPress={onBack ?? (() => router.back())}
            className="w-10 h-10 rounded-full bg-surface items-center justify-center"
            hitSlop={12}
            scaleValue={0.9}
          >
            <ArrowLeft color={colors.foreground} size={20} />
          </PressableScale>
          {title ? (
            <Text className="text-foreground font-bold text-lg flex-1" numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}
