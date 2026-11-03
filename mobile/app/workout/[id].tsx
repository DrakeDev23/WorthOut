import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radius, spacing } from '@/constants/theme';
import { getExerciseById } from '@/data';
import { ExerciseIllustration } from '@/features/exercises/components/ExerciseIllustration';
import { ExerciseOverviewSheet } from '@/features/workout/components/ExerciseOverviewSheet';
import { PausedOverlay } from '@/features/workout/components/PausedOverlay';
import { RestTimer } from '@/features/workout/components/RestTimer';
import { SetTracker } from '@/features/workout/components/SetTracker';
import { WorkoutHeader } from '@/features/workout/components/WorkoutHeader';
import { activeElapsedMs, hasIncompleteWork } from '@/features/workout/session';
import { useRoutines } from '@/store/routines';
import { useWorkout } from '@/store/workout';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRoutine } = useRoutines();
  const {
    workout,
    isHydrating,
    startWorkout,
    completeSet,
    skipRest,
    pauseWorkout,
    resumeWorkout,
    goToExercise,
    nextExercise,
    previousExercise,
    skipExercise,
    finishWorkout,
    discardWorkout,
  } = useWorkout();

  const [overviewOpen, setOverviewOpen] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'skip' | 'finish' | 'close' | null>(null);

  useEffect(() => {
    if (isHydrating) return;
    if (workout) return;
    const routine = getRoutine(id ?? '');
    const result = startWorkout(routine);
    if (!result.ok) {
      setStartError(
        result.reason === 'empty'
          ? 'This routine has no exercises. Add exercises before starting.'
          : 'This routine could not be found.'
      );
    }
  }, [id, workout, isHydrating, getRoutine, startWorkout]);

  const exitToDashboard = () => {
    discardWorkout();
    router.replace('/(tabs)');
  };

  if (isHydrating && !workout) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
          <ActivityIndicator color={colors.primary} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
          <View style={styles.iconCircle}>
            <Icon name="alert-circle-outline" size={30} color={colors.primary} />
          </View>
          <AppText variant="title" style={styles.centerTitle} accessibilityRole="header">
            Can't start workout
          </AppText>
          <AppText tone="muted" style={styles.centerSubtitle}>
            {startError ?? 'No active workout.'}
          </AppText>
          <View style={styles.centerActions}>
            <PrimaryButton title="Back to Dashboard" onPress={() => router.replace('/(tabs)')} />
            <SecondaryButton title="Go Back" onPress={() => router.back()} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (workout.status === 'completed') {
    return <CompletionRedirect />;
  }

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((set) => set.completed).length,
    0
  );

  const exercise = workout.exercises[workout.currentExerciseIndex];
  const exerciseModel = getExerciseById(exercise.exerciseId);
  const isResting = workout.status === 'resting' && workout.rest != null;
  const isFirst = workout.currentExerciseIndex === 0;
  const isLast = workout.currentExerciseIndex === workout.exercises.length - 1;

  const skipHasIncomplete = exercise.sets.some((set) => !set.completed);

  const requestSkip = () => {
    if (!skipHasIncomplete) {
      skipExercise(workout.currentExerciseIndex);
      return;
    }
    setDialog('skip');
  };

  const finishIncomplete = hasIncompleteWork(workout);

  const performFinish = () => {
    setDialog(null);
    finishWorkout();
    router.replace('/workout/complete');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <WorkoutHeader
            workout={workout}
            completedSets={completedSets}
            totalSets={totalSets}
            onPause={pauseWorkout}
            onClose={() => setDialog('close')}
          />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.exerciseMeta}>
            <AppText variant="caption" tone="primary">
              Exercise {workout.currentExerciseIndex + 1} of {workout.exercises.length}
            </AppText>
          </View>

          {exerciseModel ? (
            <View style={styles.illustration}>
              <ExerciseIllustration exercise={exerciseModel} size={140} />
            </View>
          ) : null}

          <AppText variant="title" style={styles.exerciseName} accessibilityRole="header">
            {exercise.name}
          </AppText>

          <View style={styles.tagRow}>
            <Chip label={exercise.muscleGroup} icon="locate-outline" />
            <Chip label={exercise.equipment} icon="barbell-outline" />
          </View>

          {isResting && workout.rest ? (
            <View style={styles.block}>
              <RestTimer
                rest={workout.rest}
                paused={false}
                onSkip={skipRest}
                onPauseToggle={pauseWorkout}
              />
              <AppText variant="caption" tone="subtle" style={styles.restHint}>
                Up next: Set {workout.currentSetIndex + 1} of {exercise.sets.length}
              </AppText>
            </View>
          ) : (
            <View style={styles.block}>
              <SetTracker
                exercise={exercise}
                currentSetIndex={workout.currentSetIndex}
                onCompleteSet={completeSet}
              />
            </View>
          )}

          <View style={styles.navRow}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Previous exercise"
              accessibilityState={{ disabled: isFirst }}
              disabled={isFirst}
              onPress={previousExercise}
              style={[styles.navButton, isFirst && styles.navDisabled]}
            >
              <Icon
                name="chevron-back"
                size={18}
                color={isFirst ? colors.textSubtle : colors.text}
              />
              <AppText variant="label" tone={isFirst ? 'subtle' : 'default'}>
                Prev
              </AppText>
            </PressableScale>

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Skip this exercise"
              onPress={requestSkip}
              style={styles.navButton}
            >
              <Icon name="play-skip-forward-outline" size={18} color={colors.text} />
              <AppText variant="label">Skip</AppText>
            </PressableScale>

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Next exercise"
              accessibilityState={{ disabled: isLast }}
              disabled={isLast}
              onPress={nextExercise}
              style={[styles.navButton, isLast && styles.navDisabled]}
            >
              <AppText variant="label" tone={isLast ? 'subtle' : 'default'}>
                Next
              </AppText>
              <Icon
                name="chevron-forward"
                size={18}
                color={isLast ? colors.textSubtle : colors.text}
              />
            </PressableScale>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="View all exercises"
            onPress={() => setOverviewOpen(true)}
            style={styles.overviewButton}
          >
            <Icon name="list-outline" size={18} color={colors.textMuted} />
            <AppText variant="label" tone="muted">
              View all exercises
            </AppText>
          </PressableScale>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton title="Finish Workout" onPress={() => setDialog('finish')} />
        </View>
      </SafeAreaView>

      {workout.status === 'paused' ? (
        <PausedOverlay
          elapsedSeconds={Math.floor(activeElapsedMs(workout) / 1000)}
          onResume={resumeWorkout}
          onFinish={() => setDialog('finish')}
        />
      ) : null}

      <ExerciseOverviewSheet
        visible={overviewOpen}
        workout={workout}
        onClose={() => setOverviewOpen(false)}
        onSelect={(index) => {
          setOverviewOpen(false);
          goToExercise(index);
        }}
      />

      <ConfirmDialog
        visible={dialog === 'skip'}
        title="Skip exercise?"
        message={`${exercise.name} still has incomplete sets. Skipping will not mark them as completed.`}
        confirmLabel="Skip"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          setDialog(null);
          skipExercise(workout.currentExerciseIndex);
        }}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        visible={dialog === 'finish'}
        title="Finish workout?"
        message={
          finishIncomplete
            ? 'You still have incomplete exercises or sets. Finish anyway?'
            : 'Great work! Ready to finish and see your summary?'
        }
        confirmLabel="Finish"
        cancelLabel="Keep Going"
        destructive={finishIncomplete}
        onConfirm={performFinish}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        visible={dialog === 'close'}
        title="Leave workout?"
        message="Your current workout progress will be discarded."
        confirmLabel="Discard"
        cancelLabel="Stay"
        destructive
        onConfirm={() => {
          setDialog(null);
          exitToDashboard();
        }}
        onCancel={() => setDialog(null)}
      />
    </View>
  );
}

function CompletionRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/workout/complete');
  }, [router]);
  return <View style={styles.root} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },
  exerciseMeta: {
    alignItems: 'center',
  },
  illustration: {
    alignItems: 'center',
  },
  exerciseName: {
    textAlign: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  block: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  restHint: {
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navDisabled: {
    opacity: 0.45,
  },
  overviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centerTitle: {
    textAlign: 'center',
  },
  centerSubtitle: {
    textAlign: 'center',
    maxWidth: 320,
  },
  centerActions: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
});
