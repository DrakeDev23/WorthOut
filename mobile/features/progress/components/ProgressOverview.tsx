import React from 'react';
import { StyleSheet, View } from 'react-native';

import { StatCard } from '@/components/ui/StatCard';
import { colors, spacing } from '@/constants/theme';
import { formatMinutes } from '@/lib/format';
import type { ProgressTotals } from '../types';

interface ProgressOverviewProps {
  totals: ProgressTotals;
}

export function ProgressOverview({ totals }: ProgressOverviewProps) {
  return (
    <View style={styles.grid}>
      <StatCard
        icon="trophy-outline"
        value={`${totals.totalWorkouts}`}
        label="Workouts"
        style={styles.card}
      />
      <StatCard
        icon="layers-outline"
        value={`${totals.totalSets}`}
        label="Sets completed"
        tint={colors.info}
        style={styles.card}
      />
      <StatCard
        icon="repeat-outline"
        value={`${totals.totalReps}`}
        label="Reps completed"
        tint={colors.accent}
        style={styles.card}
      />
      <StatCard
        icon="time-outline"
        value={totals.totalMinutes > 0 ? formatMinutes(totals.totalMinutes) : '0m'}
        label="Active time"
        tint={colors.success}
        style={styles.card}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
