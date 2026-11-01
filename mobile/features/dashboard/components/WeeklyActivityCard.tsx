import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BarChart } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
import { colors, spacing } from '@/constants/theme';
import { formatMinutes } from '@/lib/format';
import type { WeeklyActivityPoint } from '@/types/models';

interface WeeklyActivityCardProps {
  data: WeeklyActivityPoint[];
}

export function WeeklyActivityCard({ data }: WeeklyActivityCardProps) {
  const completedCount = data.filter((d) => d.completed).length;
  const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0);
  const todayIndex = (new Date().getDay() + 6) % 7;

  const chartData = data.map((point, index) => ({
    label: point.day,
    value: point.minutes,
    highlighted: index === todayIndex,
  }));

  return (
    <Card>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <AppText variant="title" style={styles.statValue}>
            {completedCount}
          </AppText>
          <AppText variant="caption" tone="muted">
            Workouts done
          </AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <AppText variant="title" style={styles.statValue}>
            {formatMinutes(totalMinutes)}
          </AppText>
          <AppText variant="caption" tone="muted">
            Total time
          </AppText>
        </View>
      </View>

      <BarChart data={chartData} height={110} formatValue={(v) => `${v}m`} />
    </Card>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 26,
    lineHeight: 30,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.border,
  },
});
