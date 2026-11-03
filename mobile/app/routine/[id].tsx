import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { BackgroundGlow } from '@/components/ui/BackgroundGlow';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { StackScreenHeader } from '@/components/ui/StackScreenHeader';
import { TabScreen } from '@/components/ui/TabScreen';
import { Toast } from '@/components/ui/Toast';
import { colors, radius, spacing } from '@/constants/theme';
import { getExerciseById } from '@/data';
import { formatMinutes } from '@/lib/format';
import { EditExerciseSheet } from '@/features/planner/components/EditExerciseSheet';
import { ExercisePickerSheet } from '@/features/planner/components/ExercisePickerSheet';
import {
  RoutineFormSheet,
  type RoutineFormValues,
} from '@/features/planner/components/RoutineFormSheet';
import { RoutineExerciseRow } from '@/features/planner/components/RoutineExerciseRow';
import { CATEGORY_ICONS } from '@/features/planner/meta';
import { routineMuscleGroups, useRoutines } from '@/store/routines';
import type { RoutineExercise } from '@/types/models';

export default function RoutineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getRoutine,
    updateRoutine,
    deleteRoutine,
    addExerciseToRoutine,
    removeExerciseFromRoutine,
    updateRoutineExercise,
    moveExercise,
  } = useRoutines();

  const routine = getRoutine(id ?? '');

  const [editOpen, setEditOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RoutineExercise | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removeEntry, setRemoveEntry] = useState<RoutineExercise | null>(null);

  if (!routine) {
    return (
      <TabScreen tabBarClearance={false}>
        <StackScreenHeader title="Routine" />
        <EmptyState
          icon="alert-circle-outline"
          title="Routine not found"
          message="This routine may have been deleted."
          actionLabel="Back to Planner"
          onActionPress={() => router.replace('/planner')}
        />
      </TabScreen>
    );
  }

  const exerciseCount = routine.exercises.length;
  const muscleGroups = routineMuscleGroups(routine);
  const categoryIcon = routine.category ? CATEGORY_ICONS[routine.category] : 'barbell-outline';

  const handleEditRoutine = (values: RoutineFormValues) => {
    updateRoutine(routine.id, values);
    setEditOpen(false);
    setToast('Routine updated.');
  };

  const confirmDelete = () => setDeleteOpen(true);

  const performDelete = () => {
    setDeleteOpen(false);
    deleteRoutine(routine.id);
    router.replace('/planner');
  };

  const handleAddExercise = (exerciseId: string) => {
    const ok = addExerciseToRoutine(routine.id, exerciseId);
    setPickerOpen(false);
    setToast(ok ? 'Exercise added.' : 'That exercise is already in this routine.');
  };

  const handleRemove = (entry: RoutineExercise) => {
    setRemoveEntry(entry);
  };

  const performRemove = () => {
    if (removeEntry) {
      removeExerciseFromRoutine(routine.id, removeEntry.entryId);
      setToast('Exercise removed.');
    }
    setRemoveEntry(null);
  };

  const handleStartWorkout = () => {
    if (exerciseCount === 0) {
      setToast('Add at least one exercise before starting.');
      return;
    }
    router.push(`/workout/${routine.id}`);
  };

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <Toast message={toast} onHide={() => setToast(null)} />

      <TabScreen glow={false} tabBarClearance={false} contentStyle={styles.content}>
        <StackScreenHeader title={routine.name} subtitle={routine.category ?? 'Custom routine'} />

        {routine.description ? <AppText tone="muted">{routine.description}</AppText> : null}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Icon name={categoryIcon} size={18} color={colors.primary} />
            <AppText variant="label">{routine.category ?? 'Custom'}</AppText>
          </View>
          <View style={styles.stat}>
            <Icon name="barbell-outline" size={18} color={colors.primary} />
            <AppText variant="label">
              {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
            </AppText>
          </View>
          <View style={styles.stat}>
            <Icon name="time-outline" size={18} color={colors.primary} />
            <AppText variant="label">
              {exerciseCount > 0 ? formatMinutes(routine.estimatedMinutes) : '—'}
            </AppText>
          </View>
        </View>

        {muscleGroups.length > 0 ? (
          <View style={styles.tagRow}>
            {muscleGroups.map((group) => (
              <View key={group} style={styles.tag}>
                <AppText variant="caption" tone="muted">
                  {group}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.routineActions}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Edit routine details"
            onPress={() => setEditOpen(true)}
            style={styles.smallAction}
          >
            <Icon name="create-outline" size={16} color={colors.text} />
            <AppText variant="label">Edit</AppText>
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Delete routine"
            onPress={confirmDelete}
            style={[styles.smallAction, styles.deleteAction]}
          >
            <Icon name="trash-outline" size={16} color={colors.danger} />
            <AppText variant="label" tone="danger">
              Delete
            </AppText>
          </PressableScale>
        </View>

        <View style={styles.listHeader}>
          <AppText variant="subheading">Exercises</AppText>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Add exercise to routine"
            onPress={() => setPickerOpen(true)}
            style={styles.addButton}
          >
            <Icon name="add" size={16} color={colors.onPrimary} />
            <AppText variant="label" tone="onPrimary">
              Add
            </AppText>
          </PressableScale>
        </View>

        {exerciseCount === 0 ? (
          <EmptyState
            icon="barbell-outline"
            title="No exercises yet"
            message="Add exercises from the library to build out this routine."
            actionLabel="Add Exercise"
            onActionPress={() => setPickerOpen(true)}
          />
        ) : (
          <View style={styles.list}>
            {routine.exercises.map((entry, index) => (
              <RoutineExerciseRow
                key={entry.entryId}
                entry={entry}
                index={index}
                isFirst={index === 0}
                isLast={index === routine.exercises.length - 1}
                onPress={() => router.push(`/exercise/${entry.exerciseId}`)}
                onEdit={() => setEditingEntry(entry)}
                onRemove={() => handleRemove(entry)}
                onMoveUp={() => moveExercise(routine.id, entry.entryId, 'up')}
                onMoveDown={() => moveExercise(routine.id, entry.entryId, 'down')}
              />
            ))}
          </View>
        )}

        <View style={styles.footerSpacer} />
      </TabScreen>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {exerciseCount === 0 ? (
          <SecondaryButton
            title="Start Workout"
            accessibilityHint="Add exercises before starting"
            onPress={handleStartWorkout}
          />
        ) : (
          <PrimaryButton
            title="Start Workout"
            accessibilityHint="Begins the active workout for this routine"
            onPress={handleStartWorkout}
          />
        )}
      </SafeAreaView>

      <RoutineFormSheet
        visible={editOpen}
        mode="edit"
        initialValues={{
          name: routine.name,
          description: routine.description,
          category: routine.category,
        }}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditRoutine}
      />

      <ExercisePickerSheet
        visible={pickerOpen}
        existingExerciseIds={routine.exercises.map((entry) => entry.exerciseId)}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAddExercise}
      />

      <EditExerciseSheet
        visible={editingEntry !== null}
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={(patch) => {
          if (editingEntry) {
            updateRoutineExercise(routine.id, editingEntry.entryId, patch);
            setToast('Exercise updated.');
          }
          setEditingEntry(null);
        }}
      />

      <ConfirmDialog
        visible={deleteOpen}
        title="Delete routine"
        message={`Delete "${routine.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={performDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        visible={removeEntry !== null}
        title="Remove exercise?"
        message={`Remove "${
          getExerciseById(removeEntry?.exerciseId ?? '')?.name ?? 'this exercise'
        }" from this routine?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onConfirm={performRemove}
        onCancel={() => setRemoveEntry(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  content: {
    gap: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routineActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallAction: {
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
  deleteAction: {
    borderColor: colors.dangerSoft,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  list: {
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerSpacer: {
    height: spacing.xl,
  },
});
