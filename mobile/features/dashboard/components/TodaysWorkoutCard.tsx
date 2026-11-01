import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, shadows, spacing } from '@/constants/theme';
import { formatMinutes } from '@/lib/format';
import type { Routine } from '@/types/models';

interface TodaysWorkoutCardProps {
  routine: Routine;
  onStart: () => void;
}

export function TodaysWorkoutCard({ routine, onStart }: TodaysWorkoutCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <AppText variant="label" tone="onPrimary">
            Today&apos;s Workout
          </AppText>
        </View>
      </View>

      <AppText variant="title" style={styles.name}>
        {routine.name}
      </AppText>

      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <Icon name="list-outline" size={16} color={colors.textMuted} />
          <AppText variant="label" tone="muted">
            {routine.exercises.length} exercises
          </AppText>
        </View>
        <View style={styles.meta}>
          <Icon name="time-outline" size={16} color={colors.textMuted} />
          <AppText variant="label" tone="muted">
            {formatMinutes(routine.estimatedMinutes)}
          </AppText>
        </View>
        <View style={styles.meta}>
          <Icon name="flame-outline" size={16} color={colors.textMuted} />
          <AppText variant="label" tone="muted">
            {routine.focus}
          </AppText>
        </View>
      </View>

      <PrimaryButton
        title="Start Workout"
        accessibilityHint="Begins today's workout"
        onPress={onStart}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.card,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.onPrimary,
  },
  name: {
    fontSize: 26,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  cta: {
    marginTop: spacing.sm,
  },
});
