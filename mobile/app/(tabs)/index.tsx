import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/Button';
import { FadeInView } from '@/components/ui/FadeInView';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TabScreen } from '@/components/ui/TabScreen';
import { WorkoutRow } from '@/components/ui/WorkoutRow';
import { colors, radius, spacing } from '@/constants/theme';
import { TODAYS_ROUTINE_ID } from '@/data';
import { currentStreak, weeklyActivity } from '@/features/progress/analytics';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
import { StreakCard } from '@/features/dashboard/components/StreakCard';
import { TodaysWorkoutCard } from '@/features/dashboard/components/TodaysWorkoutCard';
import { WeeklyActivityCard } from '@/features/dashboard/components/WeeklyActivityCard';
import { useHistory } from '@/store/history';
import { useRoutines } from '@/store/routines';
import { useSession } from '@/store/session';
import type { WeeklyActivityPoint } from '@/types/models';

const RECENT_LIMIT = 3;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { history } = useHistory();
  const { routines } = useRoutines();

  const todaysRoutine = routines.find((r) => r.id === TODAYS_ROUTINE_ID) ?? routines[0];
  const recentWorkouts = history.slice(0, RECENT_LIMIT);
  const displayName = user?.name ?? 'Athlete';

  const weeklyData = useMemo<WeeklyActivityPoint[]>(
    () =>
      weeklyActivity(history).map((day) => ({
        day: day.label,
        minutes: day.minutes,
        completed: day.workouts > 0,
      })),
    [history]
  );
  const streak = useMemo(() => currentStreak(history), [history]);

  const startTodaysWorkout = () => {
    if (todaysRoutine) {
      router.push(`/workout/${todaysRoutine.id}`);
    } else {
      router.push('/planner');
    }
  };

  return (
    <TabScreen>
      <FadeInView distance={8}>
        <DashboardHeader
          name={displayName}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => router.push('/profile')}
        />
      </FadeInView>

      {todaysRoutine ? (
        <FadeInView delay={80}>
          <TodaysWorkoutCard routine={todaysRoutine} onStart={startTodaysWorkout} />
        </FadeInView>
      ) : (
        <FadeInView delay={80}>
          <View style={styles.emptyRoutineCard}>
            <AppText variant="subheading">No routines yet</AppText>
            <AppText variant="caption" tone="muted">
              Create your first routine in the planner to start today&apos;s workout.
            </AppText>
            <PrimaryButton
              title="Create Routine"
              accessibilityHint="Opens the planner to build a routine"
              onPress={() => router.push('/planner')}
            />
          </View>
        </FadeInView>
      )}

      <FadeInView delay={140}>
        <QuickActions
          actions={[
            {
              key: 'start',
              icon: 'play',
              label: 'Start Workout',
              onPress: startTodaysWorkout,
            },
            {
              key: 'browse',
              icon: 'barbell-outline',
              label: 'Browse Exercises',
              onPress: () => router.push('/exercises'),
            },
            {
              key: 'create',
              icon: 'add-circle-outline',
              label: 'Create Routine',
              onPress: () => router.push('/planner'),
            },
          ]}
        />
      </FadeInView>

      <FadeInView delay={200}>
        <View style={styles.section}>
          <SectionHeader
            title="Weekly Activity"
            actionLabel="Progress"
            onActionPress={() => router.push('/progress')}
          />
          <WeeklyActivityCard data={weeklyData} />
        </View>
      </FadeInView>

      <FadeInView delay={240}>
        <StreakCard streak={streak} />
      </FadeInView>

      <FadeInView delay={280}>
        <View style={styles.section}>
          <SectionHeader
            title="Recent Workouts"
            actionLabel={recentWorkouts.length > 0 ? 'View all' : undefined}
            onActionPress={
              recentWorkouts.length > 0 ? () => router.push('/history') : undefined
            }
          />
          {recentWorkouts.length === 0 ? (
            <View style={styles.emptyRow}>
              <AppText variant="caption" tone="muted" style={styles.emptyText}>
                No workouts yet. Complete your first workout to see your activity here.
              </AppText>
            </View>
          ) : (
            <View style={styles.list}>
              {recentWorkouts.map((session) => (
                <WorkoutRow
                  key={session.id}
                  session={session}
                  onPress={() => router.push(`/history/${session.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </FadeInView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 0,
  },
  list: {
    gap: spacing.md,
  },
  emptyRow: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    textAlign: 'center',
  },
  emptyRoutineCard: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
});
