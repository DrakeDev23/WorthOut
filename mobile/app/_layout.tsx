import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { DatabaseProvider } from '@/store/database';
import { HistoryProvider } from '@/store/history';
import { RoutinesProvider } from '@/store/routines';
import { SessionProvider } from '@/store/session';
import { WorkoutProvider } from '@/store/workout';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env');
}

function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>

        <Stack.Protected guard={!!isSignedIn}>
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
        </Stack.Protected>

        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <DatabaseProvider>
          <SessionProvider>
            <RoutinesProvider>
              <HistoryProvider>
                <WorkoutProvider>
                  <RootNavigator />
                </WorkoutProvider>
              </HistoryProvider>
            </RoutinesProvider>
          </SessionProvider>
        </DatabaseProvider>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
