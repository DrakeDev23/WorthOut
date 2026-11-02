import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PrimaryButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { spacing } from '@/constants/theme';
import { getExerciseById } from '@/data';
import type { RoutineExercise } from '@/types/models';
import type { RoutineExercisePatch } from '@/store/routines';
import { Stepper } from './Stepper';

interface EditExerciseSheetProps {
  visible: boolean;
  entry: RoutineExercise | null;
  onClose: () => void;
  onSave: (patch: RoutineExercisePatch) => void;
}

type EffortMode = 'reps' | 'hold';

export function EditExerciseSheet({ visible, entry, onClose, onSave }: EditExerciseSheetProps) {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [hold, setHold] = useState(45);
  const [rest, setRest] = useState(60);
  const [mode, setMode] = useState<EffortMode>('reps');

  useEffect(() => {
    if (!visible || !entry) return;
    const isHold = entry.durationSeconds != null;
    setMode(isHold ? 'hold' : 'reps');
    setSets(entry.sets);
    setReps(entry.reps > 1 ? entry.reps : 10);
    setHold(entry.durationSeconds ?? 45);
    setRest(entry.restSeconds);
  }, [visible, entry]);

  if (!entry) return null;

  const exercise = getExerciseById(entry.exerciseId);

  const handleSave = () => {
    if (mode === 'hold') {
      onSave({ sets, durationSeconds: hold, reps: 1, restSeconds: rest });
    } else {
      onSave({ sets, reps, durationSeconds: undefined, restSeconds: rest });
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={exercise?.name ?? 'Edit exercise'}>
      <View style={styles.modeRow}>
        <Chip label="Reps" selected={mode === 'reps'} onPress={() => setMode('reps')} />
        <Chip label="Hold" selected={mode === 'hold'} onPress={() => setMode('hold')} />
      </View>

      <Stepper label="Sets" value={sets} min={1} max={10} onChange={setSets} />

      {mode === 'reps' ? (
        <Stepper label="Reps" value={reps} min={1} max={100} onChange={setReps} />
      ) : (
        <Stepper
          label="Hold"
          value={hold}
          unit="sec"
          step={5}
          min={5}
          max={300}
          onChange={setHold}
        />
      )}

      <Stepper
        label="Rest"
        value={rest}
        unit="sec"
        step={5}
        min={0}
        max={300}
        onChange={setRest}
      />

      <AppText variant="caption" tone="subtle" style={styles.hint}>
        Weight tracking is logged during an Active Workout.
      </AppText>

      <PrimaryButton title="Save Changes" onPress={handleSave} style={styles.save} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hint: {
    marginTop: spacing.xs,
  },
  save: {
    marginTop: spacing.md,
  },
});
