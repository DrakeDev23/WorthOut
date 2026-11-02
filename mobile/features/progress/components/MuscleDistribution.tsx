import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radius, spacing } from '@/constants/theme';
import type { WorkoutSession } from '@/types/models';
import { MUSCLE_ICONS } from '@/features/exercises/meta';
import { muscleDistribution } from '../analytics';
import { resolveMuscleGroup } from '../useAnalytics';

interface MuscleDistributionProps {
  history: WorkoutSession[];
}

export function MuscleDistribution({ history }: MuscleDistributionProps) {
  const slices = useMemo(
    () => muscleDistribution(history, resolveMuscleGroup),
    [history]
  );

  const maxSets = Math.max(1, ...slices.map((s) => s.sets));

  if (slices.length === 0) {
    return (
      <Card>
        <AppText variant="subheading">Muscle focus</AppText>
        <AppText variant="caption" tone="subtle">
          Complete more workouts to see which muscle groups you train most.
        </AppText>
      </Card>
    );
  }

  return (
    <Card>
      <AppText variant="subheading">Muscle focus</AppText>
      <AppText variant="caption" tone="muted">
        Completed sets by muscle group
      </AppText>

      <View style={styles.list}>
        {slices.map((slice) => {
          const icon: IconName =
            slice.muscleGroup === 'Unknown'
              ? 'help-circle-outline'
              : MUSCLE_ICONS[slice.muscleGroup];
          const widthPercent = `${Math.max(6, Math.round((slice.sets / maxSets) * 100))}%` as const;
          return (
            <View key={slice.muscleGroup} style={styles.row}>
              <View style={styles.labelRow}>
                <View style={styles.labelLeft}>
                  <Icon name={icon} size={14} color={colors.textMuted} />
                  <AppText variant="label">{slice.muscleGroup}</AppText>
                </View>
                <AppText variant="caption" tone="muted">
                  {slice.sets} {slice.sets === 1 ? 'set' : 'sets'} · {Math.round(slice.fraction * 100)}%
                </AppText>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: widthPercent }]} />
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
