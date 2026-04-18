import { ActivityIndicator } from 'react-native';

import { colors } from '@/constants/theme';

export function InlineLoader({ className }: { className?: string }) {
  return <ActivityIndicator color={colors.primary} size="large" className={className ?? 'mt-6'} />;
}
