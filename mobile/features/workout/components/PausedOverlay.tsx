import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, spacing } from '@/constants/theme';
import { formatClock } from '@/lib/format';

interface PausedOverlayProps {
  elapsedSeconds: number;
  onResume: () => void;
  onFinish: () => void;
}

export function PausedOverlay({ elapsedSeconds, onResume, onFinish }: PausedOverlayProps) {
  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Icon name="pause" size={34} color={colors.primary} />
          </View>
          <AppText variant="title" style={styles.title} accessibilityRole="header">
            Workout paused
          </AppText>
          <AppText tone="muted" style={styles.subtitle}>
            Your progress is saved. Timers are paused.
          </AppText>
          <AppText variant="heading" style={styles.clock}>
            {formatClock(elapsedSeconds)}
          </AppText>
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="Resume Workout" onPress={onResume} />
          <SecondaryButton title="Finish Workout" onPress={onFinish} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 12, 16, 0.96)',
    zIndex: 50,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 300,
  },
  clock: {
    marginTop: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
});
