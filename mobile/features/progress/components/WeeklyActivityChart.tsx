import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { colors, radius, spacing } from '@/constants/theme';
import type { WorkoutSession } from '@/types/models';
import { weeklyActivity } from '../analytics';
import { addDays, startOfWeek } from '../date-utils';

interface WeeklyActivityChartProps {
  history: WorkoutSession[];
  reference: Date;
  onChangeWeek: (next: Date) => void;
}

const CHART_HEIGHT = 120;

function weekRangeLabel(reference: Date): string {
  const start = startOfWeek(reference);
  const end = addDays(start, 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export function WeeklyActivityChart({ history, reference, onChangeWeek }: WeeklyActivityChartProps) {
  const week = useMemo(() => weeklyActivity(history, reference), [history, reference]);
  const maxWorkouts = Math.max(1, ...week.map((d) => d.workouts));
  const totalWorkouts = week.reduce((sum, d) => sum + d.workouts, 0);

  return (
    <Card>
      <View style={styles.header}>
        <IconButton
          name="chevron-back"
          accessibilityLabel="Previous week"
          onPress={() => onChangeWeek(addDays(startOfWeek(reference), -7))}
          size={18}
        />
        <View style={styles.headerText}>
          <AppText variant="label">This week</AppText>
          <AppText variant="caption" tone="muted">
            {weekRangeLabel(reference)}
          </AppText>
        </View>
        <IconButton
          name="chevron-forward"
          accessibilityLabel="Next week"
          onPress={() => onChangeWeek(addDays(startOfWeek(reference), 7))}
          size={18}
        />
      </View>

      {totalWorkouts === 0 ? (
        <View style={styles.empty}>
          <AppText variant="caption" tone="subtle" style={styles.emptyText}>
            No workouts logged this week.
          </AppText>
        </View>
      ) : (
        <View style={[styles.plot, { height: CHART_HEIGHT }]}>
          {week.map((day) => {
            const ratio = day.workouts / maxWorkouts;
            const barHeight = Math.max(day.workouts > 0 ? 8 : 4, Math.round(ratio * CHART_HEIGHT));
            return (
              <View key={day.index} style={styles.column}>
                {day.workouts > 0 ? (
                  <AppText variant="caption" tone="primary" style={styles.count}>
                    {day.workouts}
                  </AppText>
                ) : null}
                <View
                  accessibilityLabel={`${day.label}: ${day.workouts} workouts`}
                  style={[
                    styles.bar,
                    { height: barHeight },
                    day.workouts > 0 ? styles.barActive : styles.barIdle,
                    day.isToday && styles.barToday,
                  ]}
                />
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.labels}>
        {week.map((day) => (
          <View key={day.index} style={styles.labelCell}>
            <AppText variant="caption" tone={day.isToday ? 'primary' : 'subtle'}>
              {day.label}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  count: {
    marginBottom: spacing.xs,
  },
  bar: {
    width: '62%',
    borderRadius: radius.sm,
  },
  barActive: {
    backgroundColor: colors.primary,
  },
  barIdle: {
    backgroundColor: colors.border,
  },
  barToday: {
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  labels: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  labelCell: {
    flex: 1,
    alignItems: 'center',
  },
  empty: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
