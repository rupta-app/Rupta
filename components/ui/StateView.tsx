import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function LoadingState() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-background justify-center items-center">
      <ActivityIndicator color="#8B5CF6" className="mb-2" />
      <Text className="text-muted">{t('common.loading')}</Text>
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View className="flex-1 bg-background justify-center items-center px-6">
      <Text className="text-muted text-center">{message}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-background justify-center items-center px-6">
      <Text className="text-muted text-center mb-4">{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} className="px-6 py-3 rounded-xl bg-primary">
          <Text className="text-foreground font-semibold">{t('common.retry')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
