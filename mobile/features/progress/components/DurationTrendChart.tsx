import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, spacing } from '@/constants/theme';
import { formatMinutes } from '@/lib/format';
import type { WorkoutSession } from '@/types/models';
import { safePercentChange, weeklyDurationTrend } from '../analytics';

interface DurationTrendChartProps {
  history: WorkoutSession[];
  reference?: Date;
  weeks?: number;
}

const CHART_HEIGHT = 120;

export function DurationTrendChart({ history, reference, weeks = 6 }: DurationTrendChartProps) {
  const trend = useMemo(
    () => weeklyDurationTrend(history, reference ?? new Date(), weeks),
    [history, reference, weeks]
  );

  const maxMinutes = Math.max(1, ...trend.map((p) => p.minutes));
  const anyActivity = trend.some((p) => p.hasActivity);

  const current = trend[trend.length - 1];
  const previous = trend[trend.length - 2];
  const change =
    current && previous ? safePercentChange(previous.minutes, current.minutes) : null;

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <AppText variant="label">Duration trend</AppText>
          <AppText variant="caption" tone="muted">
            Active minutes per week
          </AppText>
        </View>
        {anyActivity && change !== null ? (
          <View style={styles.changeChip}>
            <Icon
              name={change >= 0 ? 'trending-up' : 'trending-down'}
              size={14}
              color={change >= 0 ? colors.success : colors.danger}
            />
            <AppText variant="caption" tone={change >= 0 ? 'default' : 'danger'}>
              {change >= 0 ? '+' : ''}
              {change}% vs last week
            </AppText>
          </View>
        ) : null}
      </View>

      {!anyActivity ? (
        <View style={styles.empty}>
          <AppText variant="caption" tone="subtle" style={styles.emptyText}>
            Complete workouts to see your weekly duration trend.
          </AppText>
        </View>
      ) : (
        <>
          <View style={[styles.plot, { height: CHART_HEIGHT }]}>
            {trend.map((point, index) => {
              const ratio = point.minutes / maxMinutes;
              const barHeight = Math.max(
                point.minutes > 0 ? 8 : 4,
                Math.round(ratio * CHART_HEIGHT)
              );
              const isCurrent = index === trend.length - 1;
              return (
                <View key={point.weekStart.toISOString()} style={styles.column}>
                  {point.minutes > 0 ? (
                    <AppText
                      variant="caption"
                      tone={isCurrent ? 'primary' : 'subtle'}
                      style={styles.cap}
                    >
                      {point.minutes}
                    </AppText>
                  ) : null}
                  <View
                    accessibilityLabel={`Week of ${point.label}: ${point.minutes} minutes`}
                    style={[
                      styles.bar,
                      { height: barHeight },
                      point.minutes > 0 ? styles.barActive : styles.barIdle,
                      isCurrent && point.minutes > 0 && styles.barCurrent,
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.labels}>
            {trend.map((point) => (
              <View key={point.weekStart.toISOString()} style={styles.labelCell}>
                <AppText variant="caption" tone="subtle">
                  {point.label}
                </AppText>
              </View>
            ))}
          </View>
          <AppText variant="caption" tone="subtle">
            This week: {formatMinutes(current?.minutes ?? 0)}
          </AppText>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
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
  cap: {
    marginBottom: spacing.xs,
  },
  bar: {
    width: '60%',
    borderRadius: radius.sm,
  },
  barActive: {
    backgroundColor: colors.primarySoft,
  },
  barCurrent: {
    backgroundColor: colors.primary,
  },
  barIdle: {
    backgroundColor: colors.border,
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
    maxWidth: 260,
  },
});
