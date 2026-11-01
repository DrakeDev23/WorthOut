import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { StackScreenHeader } from '@/components/ui/StackScreenHeader';
import { TabScreen } from '@/components/ui/TabScreen';
import { WorkoutRow } from '@/components/ui/WorkoutRow';
import { spacing } from '@/constants/theme';
import { WORKOUT_HISTORY } from '@/data';

export default function WorkoutHistoryScreen() {
  const router = useRouter();

  return (
    <TabScreen tabBarClearance={false}>
      <StackScreenHeader title="Workout History" subtitle="Your completed sessions" />
      {WORKOUT_HISTORY.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No workouts yet"
          message="Finish your first workout and it will show up here."
        />
      ) : (
        <View style={styles.list}>
          {WORKOUT_HISTORY.map((session) => (
            <WorkoutRow
              key={session.id}
              session={session}
              onPress={() => router.push(`/history/${session.id}`)}
            />
          ))}
        </View>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
