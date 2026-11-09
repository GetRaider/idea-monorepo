import '../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/lib/query-client';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="habits/new" options={{ title: 'New habit' }} />
          <Stack.Screen name="habits/[habitId]" options={{ title: 'Habit' }} />
          <Stack.Screen
            name="habits/[habitId]/edit"
            options={{ title: 'Edit habit' }}
          />
        </Stack>
        <PortalHost />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
