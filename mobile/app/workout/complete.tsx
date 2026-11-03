import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { BackgroundGlow } from '@/components/ui/BackgroundGlow';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, radius, spacing } from '@/constants/theme';
import { formatClock } from '@/lib/format';
import { buildWorkoutSession, computeSummary } from '@/features/workout/session';
import { useHistory } from '@/store/history';
import { useWorkout } from '@/store/workout';

function encouragement(percent: number): string {
  if (percent >= 100) return 'Perfect session. Every set done — outstanding work!';
  if (percent >= 75) return 'Strong effort. You showed up and put in the work.';
  if (percent >= 40) return 'Solid progress. Every rep counts toward your goal.';
  return 'You started, and that matters. Come back stronger next time.';
}

interface StatTileProps {
  icon: IconName;
  label: string;
  value: string;
}

function StatTile({ icon, label, value }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileIcon}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <AppText variant="heading">{value}</AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

export default function WorkoutCompleteScreen() {
  const router = useRouter();
  const { workout, discardWorkout } = useWorkout();
  const { addSession } = useHistory();
  const recordedIdRef = useRef<string | null>(null);

  const summary = useMemo(
    () => (workout ? computeSummary(workout) : null),
    [workout]
  );

  useEffect(() => {
    if (!workout || workout.status !== 'completed') return;
    if (recordedIdRef.current === workout.id) return;
    recordedIdRef.current = workout.id;
    addSession(buildWorkoutSession(workout));
  }, [workout, addSession]);

  if (!summary) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
          <AppText variant="title" accessibilityRole="header">
            No workout to summarise
          </AppText>
          <AppText tone="muted" style={styles.centerText}>
            Start a workout from a routine to see your summary here.
          </AppText>
          <PrimaryButton title="Back to Dashboard" onPress={() => router.replace('/(tabs)')} />
        </SafeAreaView>
      </View>
    );
  }

  const durationSeconds = Math.floor(summary.durationMs / 1000);
  const completedDate = new Date(summary.finishedAt);

  const leave = (path: '/(tabs)' | '/planner') => {
    discardWorkout();
    router.replace(path);
  };

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.badge}>
              <Icon name="trophy" size={38} color={colors.primary} />
            </View>
            <AppText variant="title" style={styles.title} accessibilityRole="header">
              Workout Complete
            </AppText>
            <AppText variant="subheading" tone="muted" style={styles.routineName}>
              {summary.routineName}
            </AppText>
            <AppText tone="muted" style={styles.message}>
              {encouragement(summary.completionPercent)}
            </AppText>
          </View>

          <View style={styles.completionCard}>
            <View style={styles.completionRow}>
              <AppText variant="label" tone="muted">
                Completion
              </AppText>
              <AppText variant="heading" tone="primary">
                {summary.completionPercent}%
              </AppText>
            </View>
            <ProgressBar progress={summary.completionPercent / 100} height={10} />
          </View>

          <View style={styles.grid}>
            <StatTile icon="time-outline" label="Duration" value={formatClock(durationSeconds)} />
            <StatTile
              icon="barbell-outline"
              label="Exercises done"
              value={`${summary.completedExercises}/${summary.totalExercises}`}
            />
            <StatTile
              icon="checkmark-done-outline"
              label="Sets completed"
              value={`${summary.completedSets}/${summary.totalSets}`}
            />
            <StatTile icon="repeat-outline" label="Total reps" value={`${summary.totalReps}`} />
          </View>

          {summary.skippedExercises > 0 ? (
            <AppText variant="caption" tone="subtle" style={styles.skipped}>
              {summary.skippedExercises} exercise
              {summary.skippedExercises === 1 ? '' : 's'} skipped
            </AppText>
          ) : null}

          <AppText variant="caption" tone="subtle" style={styles.dateText}>
            {completedDate.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
            {' · '}
            {completedDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </AppText>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton title="Back to Dashboard" onPress={() => leave('/(tabs)')} />
          <SecondaryButton title="Back to Planner" onPress={() => leave('/planner')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  routineName: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 320,
    marginTop: spacing.xs,
  },
  completionCard: {
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  skipped: {
    textAlign: 'center',
  },
  dateText: {
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
