import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radius, spacing } from '@/constants/theme';
import { formatMinutes } from '@/lib/format';
import { routineMuscleGroups } from '@/store/routines';
import type { Routine } from '@/types/models';
import { CATEGORY_ICONS } from '../meta';

interface RoutineCardProps {
  routine: Routine;
  onPress: () => void;
}

export function RoutineCard({ routine, onPress }: RoutineCardProps) {
  const exerciseCount = routine.exercises.length;
  const muscleGroups = routineMuscleGroups(routine);
  const categoryIcon = routine.category ? CATEGORY_ICONS[routine.category] : 'barbell-outline';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${routine.name}, ${exerciseCount} exercises`}
      accessibilityHint="Opens routine details"
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconChip}>
          <Icon name={categoryIcon} size={20} color={colors.primary} />
        </View>
        <View style={styles.titleBlock}>
          <AppText variant="subheading" numberOfLines={1}>
            {routine.name}
          </AppText>
          {routine.category ? (
            <AppText variant="caption" tone="primary">
              {routine.category}
            </AppText>
          ) : (
            <AppText variant="caption" tone="muted">
              Custom routine
            </AppText>
          )}
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textSubtle} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <Icon name="barbell-outline" size={14} color={colors.textMuted} />
          <AppText variant="caption" tone="muted">
            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
          </AppText>
        </View>
        <View style={styles.meta}>
          <Icon name="time-outline" size={14} color={colors.textMuted} />
          <AppText variant="caption" tone="muted">
            {exerciseCount > 0 ? formatMinutes(routine.estimatedMinutes) : '—'}
          </AppText>
        </View>
      </View>

      {muscleGroups.length > 0 ? (
        <View style={styles.tagRow}>
          {muscleGroups.slice(0, 4).map((group) => (
            <View key={group} style={styles.tag}>
              <AppText variant="caption" tone="muted">
                {group}
              </AppText>
            </View>
          ))}
          {muscleGroups.length > 4 ? (
            <View style={styles.tag}>
              <AppText variant="caption" tone="muted">
                +{muscleGroups.length - 4}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
