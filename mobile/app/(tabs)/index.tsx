import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { FadeInView } from '@/components/ui/FadeInView';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TabScreen } from '@/components/ui/TabScreen';
import { WorkoutRow } from '@/components/ui/WorkoutRow';
import { colors, radius, spacing } from '@/constants/theme';
import { TODAYS_ROUTINE_ID, getRoutineById } from '@/data';
import { currentStreak, weeklyActivity } from '@/features/progress/analytics';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
import { StreakCard } from '@/features/dashboard/components/StreakCard';
import { TodaysWorkoutCard } from '@/features/dashboard/components/TodaysWorkoutCard';
import { WeeklyActivityCard } from '@/features/dashboard/components/WeeklyActivityCard';
import { useHistory } from '@/store/history';
import { useSession } from '@/store/session';
import type { WeeklyActivityPoint } from '@/types/models';

const RECENT_LIMIT = 3;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { history } = useHistory();

  const todaysRoutine = getRoutineById(TODAYS_ROUTINE_ID);
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
    }
  };

  return (
    <TabScreen>
      <FadeInView distance={8}>
        <DashboardHeader
          name={displayName}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => router.push('/(tabs)/profile')}
        />
      </FadeInView>

      {todaysRoutine ? (
        <FadeInView delay={80}>
          <TodaysWorkoutCard routine={todaysRoutine} onStart={startTodaysWorkout} />
        </FadeInView>
      ) : null}

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
              onPress: () => router.push('/(tabs)/exercises'),
            },
            {
              key: 'create',
              icon: 'add-circle-outline',
              label: 'Create Routine',
              onPress: () => router.push('/(tabs)/planner'),
            },
          ]}
        />
      </FadeInView>

      <FadeInView delay={200}>
        <View style={styles.section}>
          <SectionHeader
            title="Weekly Activity"
            actionLabel="Progress"
            onActionPress={() => router.push('/(tabs)/progress')}
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
});
