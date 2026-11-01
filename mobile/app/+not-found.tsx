import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/Button';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { spacing } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.message}>
        <AppText variant="title" accessibilityRole="header">
          Page not found
        </AppText>
        <AppText tone="muted">
          That screen doesn&apos;t exist. Let&apos;s get you back on track.
        </AppText>
      </View>
      <PrimaryButton title="Back to start" onPress={() => router.replace('/')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    gap: spacing.xl,
  },
  message: {
    gap: spacing.sm,
  },
});
