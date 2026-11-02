import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { colors, spacing } from '@/constants/theme';
import { formatMinutes } from '@/lib/format';
import type { WorkoutSession } from '@/types/models';
import { monthlyActivity } from '../analytics';
import { addMonths, monthLabel } from '../date-utils';

interface MonthlyActivityProps {
  history: WorkoutSession[];
  month: Date;
  onChangeMonth: (next: Date) => void;
}

interface RowProps {
  icon: IconName;
  label: string;
  value: string;
  tint: string;
}

function Row({ icon, label, value, tint }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconChip, { backgroundColor: `${tint}22` }]}>
        <Icon name={icon} size={16} color={tint} />
      </View>
      <AppText variant="body" style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

export function MonthlyActivity({ history, month, onChangeMonth }: MonthlyActivityProps) {
  const activity = useMemo(() => monthlyActivity(history, month), [history, month]);

  return (
    <Card>
      <View style={styles.header}>
        <IconButton
          name="chevron-back"
          accessibilityLabel="Previous month"
          onPress={() => onChangeMonth(addMonths(month, -1))}
          size={18}
        />
        <AppText variant="subheading">{monthLabel(month)}</AppText>
        <IconButton
          name="chevron-forward"
          accessibilityLabel="Next month"
          onPress={() => onChangeMonth(addMonths(month, 1))}
          size={18}
        />
      </View>

      {activity.totalWorkouts === 0 ? (
        <AppText variant="caption" tone="subtle" style={styles.empty}>
          No workouts recorded this month.
        </AppText>
      ) : (
        <View style={styles.list}>
          <Row
            icon="trophy-outline"
            label="Workouts"
            value={`${activity.totalWorkouts}`}
            tint={colors.primary}
          />
          <Row
            icon="layers-outline"
            label="Sets completed"
            value={`${activity.totalSets}`}
            tint={colors.info}
          />
          <Row
            icon="repeat-outline"
            label="Reps completed"
            value={`${activity.totalReps}`}
            tint={colors.accent}
          />
          <Row
            icon="time-outline"
            label="Active time"
            value={formatMinutes(activity.totalMinutes)}
            tint={colors.success}
          />
        </View>
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
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
