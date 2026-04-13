import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Card } from '@/components/ui/Card';

export default function MessagesScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('messages.title')} />
      <View className="p-4">
        <Card>
          <Text className="text-foreground font-semibold">{t('messages.comingTitle')}</Text>
          <Text className="text-muted mt-2 leading-6">{t('messages.comingBody')}</Text>
        </Card>
      </View>
    </View>
  );
}
