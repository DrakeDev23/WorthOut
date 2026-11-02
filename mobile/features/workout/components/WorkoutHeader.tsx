import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, radius, spacing } from '@/constants/theme';
import { formatClock } from '@/lib/format';
import { useNow } from '@/hooks/useNow';
import { activeElapsedMs } from '@/features/workout/session';
import type { ActiveWorkout } from '@/types/workout';

interface WorkoutHeaderProps {
  workout: ActiveWorkout;
  completedSets: number;
  totalSets: number;
  onPause: () => void;
  onClose: () => void;
}

export function WorkoutHeader({
  workout,
  completedSets,
  totalSets,
  onPause,
  onClose,
}: WorkoutHeaderProps) {
  const ticking = workout.status === 'active' || workout.status === 'resting';
  const now = useNow(ticking, 500);
  const elapsedSeconds = Math.floor(activeElapsedMs(workout, now) / 1000);
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Close workout"
          onPress={onClose}
          hitSlop={6}
          style={styles.iconButton}
        >
          <Icon name="close" size={20} color={colors.text} />
        </PressableScale>

        <View style={styles.titleBlock}>
          <AppText variant="label" numberOfLines={1} style={styles.title}>
            {workout.routineName}
          </AppText>
          <View style={styles.clockRow}>
            <Icon name="time-outline" size={14} color={colors.textMuted} />
            <AppText variant="caption" tone="muted" style={styles.clock}>
              {formatClock(elapsedSeconds)}
            </AppText>
          </View>
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Pause workout"
          onPress={onPause}
          hitSlop={6}
          style={styles.iconButton}
        >
          <Icon name="pause" size={20} color={colors.text} />
        </PressableScale>
      </View>

      <ProgressBar progress={progress} />
      <AppText variant="caption" tone="subtle" style={styles.progressText}>
        {completedSets} / {totalSets} sets complete
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    textAlign: 'center',
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clock: {
    fontVariant: ['tabular-nums'],
  },
  progressText: {
    textAlign: 'center',
  },
});
