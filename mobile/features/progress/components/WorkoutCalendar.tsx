import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { WorkoutRow } from '@/components/ui/WorkoutRow';
import { colors, radius, spacing } from '@/constants/theme';
import type { WorkoutSession } from '@/types/models';
import { hasWorkoutOn, sessionsOnDay } from '../analytics';
import {
  WEEKDAY_LABELS,
  addMonths,
  dayKeyFromDate,
  monthLabel,
  sameDay,
  startOfMonth,
  weekdayIndex,
} from '../date-utils';

interface WorkoutCalendarProps {
  history: WorkoutSession[];
  month: Date;
  selectedDate: Date;
  today: Date;
  onChangeMonth: (next: Date) => void;
  onSelectDate: (date: Date) => void;
}

interface Cell {
  date: Date | null;
  key: string;
}

function buildGrid(month: Date): Cell[] {
  const first = startOfMonth(month);
  const lead = weekdayIndex(first);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Cell[] = [];
  for (let i = 0; i < lead; i += 1) cells.push({ date: null, key: `lead-${i}` });
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), d);
    cells.push({ date, key: dayKeyFromDate(date) });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, key: `trail-${cells.length}` });
  return cells;
}

export function WorkoutCalendar({
  history,
  month,
  selectedDate,
  today,
  onChangeMonth,
  onSelectDate,
}: WorkoutCalendarProps) {
  const router = useRouter();
  const cells = useMemo(() => buildGrid(month), [month]);
  const selectedSessions = useMemo(
    () => sessionsOnDay(history, selectedDate),
    [history, selectedDate]
  );

  return (
    <View style={styles.wrapper}>
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

        <View style={styles.weekRow}>
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} style={styles.weekCell}>
              <AppText variant="caption" tone="subtle">
                {label[0]}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((cell) => {
            if (!cell.date) return <View key={cell.key} style={styles.cell} />;
            const date = cell.date;
            const isToday = sameDay(date, today);
            const isSelected = sameDay(date, selectedDate);
            const worked = hasWorkoutOn(history, date);
            return (
              <PressableScale
                key={cell.key}
                accessibilityRole="button"
                accessibilityLabel={`${date.getDate()} ${monthLabel(month)}${worked ? ', workout logged' : ''}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelectDate(date)}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.dayInner,
                    isToday && styles.dayToday,
                    isSelected && styles.daySelected,
                  ]}
                >
                  <AppText
                    variant="caption"
                    tone={isSelected ? 'onPrimary' : 'default'}
                  >
                    {date.getDate()}
                  </AppText>
                </View>
                {worked ? (
                  <View style={[styles.dot, isSelected && styles.dotSelected]} />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </PressableScale>
            );
          })}
        </View>
      </Card>

      <View style={styles.selected}>
        <AppText variant="label" tone="muted">
          {sameDay(selectedDate, today)
            ? 'Today'
            : selectedDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
        </AppText>

        {selectedSessions.length === 0 ? (
          <View style={styles.emptyDay}>
            <AppText variant="caption" tone="subtle" style={styles.emptyText}>
              No workout on this day.
            </AppText>
          </View>
        ) : (
          <View style={styles.sessionList}>
            {selectedSessions.map((session) => (
              <WorkoutRow
                key={session.id}
                session={session}
                onPress={() => router.push(`/history/${session.id}`)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: 3,
  },
  dayInner: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
  dotSelected: {
    backgroundColor: colors.text,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
  },
  selected: {
    gap: spacing.md,
  },
  sessionList: {
    gap: spacing.md,
  },
  emptyDay: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
