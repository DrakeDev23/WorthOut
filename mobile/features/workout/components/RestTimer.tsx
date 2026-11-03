import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, radius, spacing } from '@/constants/theme';
import { formatClock } from '@/lib/format';
import { useNow } from '@/hooks/useNow';
import { restRemainingSeconds } from '@/features/workout/session';
import type { RestState } from '@/types/workout';

interface RestTimerProps {
  rest: RestState;
  paused: boolean;
  onSkip: () => void;
  onPauseToggle: () => void;
}

export function RestTimer({ rest, paused, onSkip, onPauseToggle }: RestTimerProps) {
  const now = useNow(!paused, 250);
  const remaining = restRemainingSeconds(rest, now);
  const progress = rest.totalSeconds > 0 ? 1 - remaining / rest.totalSeconds : 1;

  useEffect(() => {
    if (remaining <= 0 && !paused) {
      onSkip();
    }
  }, [remaining, paused, onSkip]);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Icon name="hourglass-outline" size={16} color={colors.onPrimary} />
        <AppText variant="label" tone="onPrimary">
          Rest
        </AppText>
      </View>

      <AppText variant="display" style={styles.clock}>
        {formatClock(remaining)}
      </AppText>

      <ProgressBar progress={progress} height={10} style={styles.bar} />

      <View style={styles.controls}>
        <SecondaryButton
          title={paused ? 'Resume' : 'Pause'}
          onPress={onPauseToggle}
          style={styles.control}
        />
        <PrimaryButton
          title={remaining <= 0 ? 'Start Next Set' : 'Skip Rest'}
          onPress={onSkip}
          style={styles.control}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  clock: {
    fontVariant: ['tabular-nums'],
  },
  bar: {
    alignSelf: 'stretch',
  },
  controls: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.md,
  },
  control: {
    flex: 1,
  },
});
