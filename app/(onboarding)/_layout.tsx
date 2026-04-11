import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 280,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="language" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="activity-style" />
      <Stack.Screen name="bio" />
    </Stack>
  );
}
