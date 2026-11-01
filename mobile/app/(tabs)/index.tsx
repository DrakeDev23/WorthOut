import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { FadeInView } from '@/components/ui/FadeInView';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TabScreen } from '@/components/ui/TabScreen';
import { WorkoutRow } from '@/components/ui/WorkoutRow';
import { spacing } from '@/constants/theme';
import { TODAYS_ROUTINE_ID, WEEKLY_ACTIVITY, WORKOUT_HISTORY, getRoutineById } from '@/data';
import { PROGRESS_SUMMARY } from '@/data';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
import { StreakCard } from '@/features/dashboard/components/StreakCard';
import { TodaysWorkoutCard } from '@/features/dashboard/components/TodaysWorkoutCard';
import { WeeklyActivityCard } from '@/features/dashboard/components/WeeklyActivityCard';
import { useSession } from '@/store/session';

const RECENT_LIMIT = 3;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useSession();

  const todaysRoutine = getRoutineById(TODAYS_ROUTINE_ID);
  const recentWorkouts = WORKOUT_HISTORY.slice(0, RECENT_LIMIT);
  const displayName = user?.name ?? 'Athlete';

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
          <WeeklyActivityCard data={WEEKLY_ACTIVITY} />
        </View>
      </FadeInView>

      <FadeInView delay={240}>
        <StreakCard streak={PROGRESS_SUMMARY.currentStreak} />
      </FadeInView>

      <FadeInView delay={280}>
        <View style={styles.section}>
          <SectionHeader
            title="Recent Workouts"
            actionLabel="View all"
            onActionPress={() => router.push('/history')}
          />
          <View style={styles.list}>
            {recentWorkouts.map((session) => (
              <WorkoutRow
                key={session.id}
                session={session}
                onPress={() => router.push(`/history/${session.id}`)}
              />
            ))}
          </View>
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
});
