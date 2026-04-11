import { Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/theme';

import { Button } from './Button';

export function ErrorRetry({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <AlertTriangle size={40} color={colors.danger} strokeWidth={1.5} opacity={0.6} />
      {message ? (
        <Text className="text-muted text-sm text-center mt-3">{message}</Text>
      ) : null}
      <View className="mt-4">
        <Button variant="secondary" onPress={onRetry}>
          {t('common.retry')}
        </Button>
      </View>
    </View>
  );
}
