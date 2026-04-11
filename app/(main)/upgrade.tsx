import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';

import { logoMark } from '@/constants/branding';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Card } from '@/components/ui/Card';

export default function UpgradeScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title=""
        right={
          <View className="flex-row items-center gap-0.5" accessibilityRole="header" accessibilityLabel="Rupta Pro">
            <Image
              source={logoMark}
              contentFit="contain"
              style={{ width: 88, height: 26, marginLeft: -4 }}
            />
            <Text className="text-primary font-bold text-lg">Pro</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Text className="text-foreground text-2xl font-black">{t('upgrade.title')}</Text>
        <Text className="text-muted mt-3 leading-6">{t('upgrade.body')}</Text>
        <Card className="mt-8">
          <Text className="text-foreground font-semibold">{t('upgrade.includedTitle')}</Text>
          <Text className="text-muted mt-2 leading-6">{t('upgrade.includedBody')}</Text>
        </Card>
      </ScrollView>
    </View>
  );
}
