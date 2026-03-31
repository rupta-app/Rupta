import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1">{t('messages.title')}</Text>
      </View>
      <View className="p-4">
        <Card>
          <Text className="text-foreground font-semibold">{t('messages.comingTitle')}</Text>
          <Text className="text-muted mt-2 leading-6">{t('messages.comingBody')}</Text>
        </Card>
      </View>
    </View>
  );
}
