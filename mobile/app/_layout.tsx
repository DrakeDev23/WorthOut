import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { DatabaseProvider } from '@/store/database';
import { HistoryProvider } from '@/store/history';
import { RoutinesProvider } from '@/store/routines';
import { SessionProvider } from '@/store/session';
import { WorkoutProvider } from '@/store/workout';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <SessionProvider>
          <RoutinesProvider>
            <HistoryProvider>
              <WorkoutProvider>
                <StatusBar style="light" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="index" options={{ animation: 'fade' }} />
                  <Stack.Screen name="login" />
                  <Stack.Screen name="register" />
                  <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                  <Stack.Screen name="workout/[id]" options={{ animation: 'slide_from_bottom' }} />
                  <Stack.Screen
                    name="workout/complete"
                    options={{ animation: 'fade', gestureEnabled: false }}
                  />
                  <Stack.Screen name="routine/[id]" />
                  <Stack.Screen name="exercise/[id]" />
                  <Stack.Screen name="history/index" />
                  <Stack.Screen name="history/[id]" />
                  <Stack.Screen name="notifications" />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </WorkoutProvider>
            </HistoryProvider>
          </RoutinesProvider>
        </SessionProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
