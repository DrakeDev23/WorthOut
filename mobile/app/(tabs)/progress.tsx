import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeInView } from '@/components/ui/FadeInView';
import { SecondaryButton } from '@/components/ui/Button';
import { TabScreen } from '@/components/ui/TabScreen';
import { spacing } from '@/constants/theme';
import { computeTotals } from '@/features/progress/analytics';
import { startOfDay, startOfMonth, startOfWeek } from '@/features/progress/date-utils';
import { DurationTrendChart } from '@/features/progress/components/DurationTrendChart';
import { MonthlyActivity } from '@/features/progress/components/MonthlyActivity';
import { MuscleDistribution } from '@/features/progress/components/MuscleDistribution';
import { ProgressOverview } from '@/features/progress/components/ProgressOverview';
import { WeeklyActivityChart } from '@/features/progress/components/WeeklyActivityChart';
import { WorkoutCalendar } from '@/features/progress/components/WorkoutCalendar';
import { useHistory } from '@/store/history';

export default function ProgressScreen() {
  const router = useRouter();
  const { history } = useHistory();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [weekRef, setWeekRef] = useState(() => startOfWeek(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [monthlyRef, setMonthlyRef] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  const totals = useMemo(() => computeTotals(history), [history]);
  const hasHistory = history.length > 0;

  return (
    <TabScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          Progress
        </AppText>
        <AppText tone="muted">Every rep is worth it — here is how it adds up.</AppText>
      </View>

      <FadeInView distance={8}>
        <ProgressOverview totals={totals} />
      </FadeInView>

      {!hasHistory ? (
        <EmptyState
          icon="stats-chart-outline"
          title="No progress yet"
          message="Complete your first workout and your stats, calendar, charts and muscle focus will populate here."
          actionLabel="View Workout History"
          onActionPress={() => router.push('/history')}
        />
      ) : (
        <>
          <FadeInView delay={60}>
            <View style={styles.section}>
              <AppText variant="subheading">Weekly activity</AppText>
              <WeeklyActivityChart
                history={history}
                reference={weekRef}
                onChangeWeek={setWeekRef}
              />
            </View>
          </FadeInView>

          <FadeInView delay={100}>
            <View style={styles.section}>
              <AppText variant="subheading">Calendar</AppText>
              <WorkoutCalendar
                history={history}
                month={calendarMonth}
                selectedDate={selectedDate}
                today={today}
                onChangeMonth={setCalendarMonth}
                onSelectDate={setSelectedDate}
              />
            </View>
          </FadeInView>

          <FadeInView delay={140}>
            <View style={styles.section}>
              <AppText variant="subheading">Monthly activity</AppText>
              <MonthlyActivity
                history={history}
                month={monthlyRef}
                onChangeMonth={setMonthlyRef}
              />
            </View>
          </FadeInView>

          <FadeInView delay={180}>
            <DurationTrendChart history={history} />
          </FadeInView>

          <FadeInView delay={220}>
            <MuscleDistribution history={history} />
          </FadeInView>
        </>
      )}

      <SecondaryButton title="View Workout History" onPress={() => router.push('/history')} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
});
