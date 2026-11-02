import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radius, spacing } from '@/constants/theme';
import { formatMinutes } from '@/lib/format';
import { useRoutines } from '@/store/routines';

interface AddToRoutineSheetProps {
  visible: boolean;
  exerciseId: string;
  exerciseName: string;
  onClose: () => void;
  onAdded: (message: string) => void;
}

export function AddToRoutineSheet({
  visible,
  exerciseId,
  exerciseName,
  onClose,
  onAdded,
}: AddToRoutineSheetProps) {
  const { routines, addExerciseToRoutine, routineHasExercise } = useRoutines();
  const [addedRoutineId, setAddedRoutineId] = useState<string | null>(null);

  const handleAdd = (routineId: string, routineName: string) => {
    const ok = addExerciseToRoutine(routineId, exerciseId);
    if (ok) {
      setAddedRoutineId(routineId);
      onAdded(`${exerciseName} added to ${routineName}.`);
      setTimeout(() => {
        setAddedRoutineId(null);
        onClose();
      }, 650);
    } else {
      onAdded(`${exerciseName} is already in ${routineName}.`);
      onClose();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add to routine">
      <AppText tone="muted" style={styles.intro}>
        Choose a routine to add <AppText tone="default">{exerciseName}</AppText> to.
      </AppText>

      {routines.map((routine) => {
        const alreadyIn = routineHasExercise(routine.id, exerciseId);
        const added = addedRoutineId === routine.id || alreadyIn;
        return (
          <PressableScale
            key={routine.id}
            accessibilityRole="button"
            accessibilityLabel={
              alreadyIn ? `Already in ${routine.name}` : `Add to ${routine.name}`
            }
            accessibilityState={{ disabled: added }}
            onPress={() => handleAdd(routine.id, routine.name)}
            disabled={addedRoutineId !== null || alreadyIn}
            style={[styles.row, added && styles.rowAdded]}
          >
            <View style={styles.rowText}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {routine.name}
              </AppText>
              <AppText variant="caption" tone="muted">
                {routine.exercises.length} exercises · {formatMinutes(routine.estimatedMinutes)}
              </AppText>
            </View>
            <Icon
              name={added ? 'checkmark-circle' : 'add-circle-outline'}
              size={24}
              color={added ? colors.success : colors.primary}
            />
          </PressableScale>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowAdded: {
    borderColor: colors.success,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
