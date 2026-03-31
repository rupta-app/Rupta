import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 220,
        contentStyle: { backgroundColor: '#0A0A0F' },
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
