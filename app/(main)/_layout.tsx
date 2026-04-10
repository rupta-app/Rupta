import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0F' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="quest/[id]" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="completion/[id]" />
      <Stack.Screen name="complete-quest/[questId]" />
      <Stack.Screen name="share-card/[completionId]" />
      <Stack.Screen name="user/[id]" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="friend-requests" />
      <Stack.Screen name="group/[id]" />
      <Stack.Screen name="group-quest/[id]" />
      <Stack.Screen name="complete-group-quest/[questId]" />
      <Stack.Screen name="generator" />
      <Stack.Screen name="create-group" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="life-list" />
      <Stack.Screen name="search-users" />
      <Stack.Screen name="unified-search" />
      <Stack.Screen name="upgrade" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="quick-complete" />
      <Stack.Screen name="spontaneous-sidequest" />
      <Stack.Screen name="suggest-quest" />
    </Stack>
  );
}
