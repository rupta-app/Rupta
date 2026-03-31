import { View } from 'react-native';

export function Skeleton({ className = '' }: { className?: string }) {
  return <View className={`bg-surfaceElevated rounded-lg animate-pulse ${className}`} />;
}
