import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radius, spacing } from '@/constants/theme';
import type { ActiveWorkout } from '@/types/workout';

interface ExerciseOverviewSheetProps {
  visible: boolean;
  workout: ActiveWorkout;
  onClose: () => void;
  onSelect: (index: number) => void;
}

function statusFor(
  workout: ActiveWorkout,
  index: number
): { label: string; icon: IconName; tint: string } {
  const exercise = workout.exercises[index];
  const done = exercise.sets.every((set) => set.completed);
  if (exercise.skipped) return { label: 'Skipped', icon: 'play-skip-forward', tint: colors.textSubtle };
  if (done) return { label: 'Completed', icon: 'checkmark-circle', tint: colors.success };
  if (index === workout.currentExerciseIndex)
    return { label: 'Current', icon: 'radio-button-on', tint: colors.primary };
  return { label: 'Upcoming', icon: 'ellipse-outline', tint: colors.textMuted };
}

export function ExerciseOverviewSheet({
  visible,
  workout,
  onClose,
  onSelect,
}: ExerciseOverviewSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Workout overview">
      {workout.exercises.map((exercise, index) => {
        const status = statusFor(workout, index);
        const completedSets = exercise.sets.filter((set) => set.completed).length;
        return (
          <PressableScale
            key={exercise.entryId}
            accessibilityRole="button"
            accessibilityLabel={`${exercise.name}, ${status.label}. Jump to this exercise`}
            onPress={() => onSelect(index)}
            style={[styles.row, index === workout.currentExerciseIndex && styles.rowCurrent]}
          >
            <Icon name={status.icon} size={22} color={status.tint} />
            <View style={styles.rowText}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {index + 1}. {exercise.name}
              </AppText>
              <AppText variant="caption" tone="muted">
                {completedSets}/{exercise.sets.length} sets · {status.label}
              </AppText>
            </View>
          </PressableScale>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowCurrent: {
    borderColor: colors.primary,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
