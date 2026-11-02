import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radius, spacing } from '@/constants/theme';
import { getExerciseById } from '@/data';
import { ExerciseIllustration } from '@/features/exercises/components/ExerciseIllustration';
import type { RoutineExercise } from '@/types/models';
import { entrySummary } from '../format';

interface RoutineExerciseRowProps {
  entry: RoutineExercise;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function RoutineExerciseRow({
  entry,
  index,
  isFirst,
  isLast,
  onPress,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: RoutineExerciseRowProps) {
  const exercise = getExerciseById(entry.exerciseId);
  if (!exercise) return null;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.reorderColumn}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Move ${exercise.name} up`}
            accessibilityState={{ disabled: isFirst }}
            disabled={isFirst}
            onPress={onMoveUp}
            hitSlop={6}
            style={[styles.reorderButton, isFirst && styles.reorderDisabled]}
          >
            <Icon name="chevron-up" size={16} color={isFirst ? colors.textSubtle : colors.text} />
          </PressableScale>
          <AppText variant="caption" tone="subtle">
            {index + 1}
          </AppText>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Move ${exercise.name} down`}
            accessibilityState={{ disabled: isLast }}
            disabled={isLast}
            onPress={onMoveDown}
            hitSlop={6}
            style={[styles.reorderButton, isLast && styles.reorderDisabled]}
          >
            <Icon name="chevron-down" size={16} color={isLast ? colors.textSubtle : colors.text} />
          </PressableScale>
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`${exercise.name} details`}
          accessibilityHint="Opens exercise details"
          onPress={onPress}
          style={styles.info}
        >
          <ExerciseIllustration exercise={exercise} size={52} />
          <View style={styles.infoText}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {exercise.name}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {exercise.muscleGroup}
            </AppText>
            <AppText variant="caption" tone="primary" numberOfLines={1}>
              {entrySummary(entry)}
            </AppText>
          </View>
        </PressableScale>
      </View>

      <View style={styles.actions}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Edit ${exercise.name} sets and reps`}
          onPress={onEdit}
          style={styles.actionButton}
        >
          <Icon name="options-outline" size={16} color={colors.text} />
          <AppText variant="label">Edit</AppText>
        </PressableScale>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Remove ${exercise.name} from routine`}
          onPress={onRemove}
          style={[styles.actionButton, styles.removeButton]}
        >
          <Icon name="trash-outline" size={16} color={colors.danger} />
          <AppText variant="label" tone="danger">
            Remove
          </AppText>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reorderColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  reorderButton: {
    width: 32,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderDisabled: {
    opacity: 0.4,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeButton: {
    borderColor: colors.dangerSoft,
  },
});
