import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function GroupIdLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="people" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="create-quest" />
      <Stack.Screen name="create-challenge" />
      <Stack.Screen name="challenge/[challengeId]" />
    </Stack>
  );
}
