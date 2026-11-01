import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radius, spacing } from '@/constants/theme';
import type { Exercise } from '@/types/models';
import { EQUIPMENT_ICONS } from '../meta';
import { DifficultyBadge } from './DifficultyBadge';
import { ExerciseIllustration } from './ExerciseIllustration';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
}

export function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${exercise.name}, ${exercise.muscleGroup}, ${exercise.difficulty}`}
      accessibilityHint="Opens exercise details"
      onPress={onPress}
      style={styles.card}
    >
      <ExerciseIllustration exercise={exercise} size={76} />

      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {exercise.name}
        </AppText>

        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Icon name="locate-outline" size={14} color={colors.textMuted} />
            <AppText variant="caption" tone="muted">
              {exercise.muscleGroup}
            </AppText>
          </View>
          <View style={styles.meta}>
            <Icon name={EQUIPMENT_ICONS[exercise.equipment]} size={14} color={colors.textMuted} />
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {exercise.equipment}
            </AppText>
          </View>
        </View>

        <DifficultyBadge difficulty={exercise.difficulty} />
      </View>

      <Icon name="chevron-forward" size={18} color={colors.textSubtle} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: {
    flex: 1,
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
});
