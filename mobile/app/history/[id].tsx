import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { StackScreenHeader } from '@/components/ui/StackScreenHeader';
import { StatCard } from '@/components/ui/StatCard';
import { TabScreen } from '@/components/ui/TabScreen';
import { colors, spacing } from '@/constants/theme';
import { WORKOUT_HISTORY } from '@/data';
import { formatMinutes, formatRelativeDate } from '@/lib/format';
import type { CompletedSet } from '@/types/models';

function setLabel(set: CompletedSet): string {
  if (set.durationSeconds) return `${set.durationSeconds}s hold`;
  const reps = `${set.reps} reps`;
  return set.weightKg ? `${reps} · ${set.weightKg} kg` : reps;
}

export default function WorkoutHistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = WORKOUT_HISTORY.find((item) => item.id === id);

  if (!session) {
    return (
      <TabScreen tabBarClearance={false}>
        <StackScreenHeader title="Workout" />
        <EmptyState
          icon="alert-circle-outline"
          title="Workout not found"
          message="We couldn't find this session in your history."
        />
      </TabScreen>
    );
  }

  return (
    <TabScreen tabBarClearance={false}>
      <StackScreenHeader title={session.routineName} subtitle={formatRelativeDate(session.date)} />

      <View style={styles.stats}>
        <StatCard
          icon="time-outline"
          value={formatMinutes(session.durationMinutes)}
          label="Duration"
        />
        <StatCard
          icon="layers-outline"
          value={`${session.totalSets}`}
          label="Total sets"
          tint={colors.info}
        />
        <StatCard
          icon="barbell-outline"
          value={`${session.exercises.length}`}
          label="Exercises"
          tint={colors.accent}
        />
      </View>

      <View style={styles.list}>
        {session.exercises.map((exercise) => (
          <Card key={exercise.exerciseId}>
            <AppText variant="subheading">{exercise.name}</AppText>
            <View style={styles.setList}>
              {exercise.sets.map((set, index) => (
                <View key={index} style={styles.setRow}>
                  <View style={styles.setBadge}>
                    <AppText variant="caption" tone="muted">
                      {index + 1}
                    </AppText>
                  </View>
                  <Icon name="checkmark" size={16} color={colors.primary} />
                  <AppText variant="body">{setLabel(set)}</AppText>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  list: {
    gap: spacing.lg,
  },
  setList: {
    gap: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  setBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
