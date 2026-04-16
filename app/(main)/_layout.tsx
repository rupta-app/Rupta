import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'simple_push',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />

      {/* Quest detail — standard push so it goes full screen */}
      <Stack.Screen name="quest/[id]" />

      {/* Modal presentations — slide up from bottom */}
      <Stack.Screen name="share-card/[completionId]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="upgrade" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="spontaneous-sidequest" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="suggest-quest" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />

      {/* Completion flow — fade for form feel */}
      <Stack.Screen name="complete-quest/[questId]" options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="complete-group-quest/[questId]" options={{ animation: 'fade_from_bottom' }} />

      {/* Detail screens — default simple_push via screenOptions */}
      <Stack.Screen name="completion/[id]" />
      <Stack.Screen name="user/[id]" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="friend-requests" />
      <Stack.Screen name="group/[id]" />
      <Stack.Screen name="group-quest/[id]" />
      <Stack.Screen name="generator" />
      <Stack.Screen name="create-group" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="life-list" />
      <Stack.Screen name="unified-search" />
      <Stack.Screen name="find-people" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="quick-complete" />
    </Stack>
  );
}
