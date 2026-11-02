import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { colors, spacing } from '@/constants/theme';
import { formatClock } from '@/lib/format';
import { useNow } from '@/hooks/useNow';
import type { ActiveExercise } from '@/types/workout';

interface SetTrackerProps {
  exercise: ActiveExercise;
  currentSetIndex: number;
  onCompleteSet: () => void;
}

export function SetTracker({ exercise, currentSetIndex, onCompleteSet }: SetTrackerProps) {
  const currentSet = exercise.sets[currentSetIndex];
  const totalSets = exercise.sets.length;
  const completedCount = exercise.sets.filter((set) => set.completed).length;

  const [holdEndsAt, setHoldEndsAt] = useState<number | null>(null);
  const now = useNow(holdEndsAt != null, 250);
  const holdRemaining =
    holdEndsAt != null ? Math.max(0, Math.ceil((holdEndsAt - now) / 1000)) : null;

  const setKey = `${exercise.entryId}-${currentSetIndex}`;
  const lastKey = useRef(setKey);
  useEffect(() => {
    if (lastKey.current !== setKey) {
      lastKey.current = setKey;
      setHoldEndsAt(null);
    }
  }, [setKey]);

  const handleComplete = () => {
    setHoldEndsAt(null);
    onCompleteSet();
  };

  const startHold = () => {
    const seconds = currentSet?.targetDurationSeconds ?? 30;
    setHoldEndsAt(Date.now() + seconds * 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {exercise.sets.map((set, index) => {
          const isCurrent = index === currentSetIndex;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                set.completed && styles.dotDone,
                isCurrent && !set.completed && styles.dotCurrent,
              ]}
            >
              {set.completed ? (
                <Icon name="checkmark" size={14} color={colors.onPrimary} />
              ) : (
                <AppText variant="caption" tone={isCurrent ? 'primary' : 'subtle'}>
                  {index + 1}
                </AppText>
              )}
            </View>
          );
        })}
      </View>

      <AppText variant="label" tone="muted" style={styles.progressLabel}>
        Set {Math.min(currentSetIndex + 1, totalSets)} of {totalSets} · {completedCount} done
      </AppText>

      {exercise.isHold ? (
        <>
          <View style={styles.targetBlock}>
            <AppText variant="caption" tone="subtle">
              Target hold
            </AppText>
            <AppText variant="title">
              {holdRemaining != null
                ? formatClock(holdRemaining)
                : `${currentSet?.targetDurationSeconds ?? 30}s`}
            </AppText>
          </View>

          {holdEndsAt == null ? (
            <SecondaryButton title="Start Hold Timer" onPress={startHold} style={styles.action} />
          ) : null}

          <PrimaryButton title="Complete Hold" onPress={handleComplete} style={styles.action} />
        </>
      ) : (
        <>
          <View style={styles.targetBlock}>
            <AppText variant="caption" tone="subtle">
              Target
            </AppText>
            <AppText variant="title">{currentSet?.targetReps ?? 0} reps</AppText>
            {exercise.weightKg != null ? (
              <AppText variant="label" tone="muted">
                {exercise.weightKg} kg
              </AppText>
            ) : null}
          </View>

          <PrimaryButton title="Complete Set" onPress={handleComplete} style={styles.action} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotCurrent: {
    borderColor: colors.primary,
  },
  progressLabel: {
    textAlign: 'center',
  },
  targetBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  action: {
    alignSelf: 'stretch',
  },
});
