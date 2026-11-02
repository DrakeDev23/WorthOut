import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors, radius, spacing } from '@/constants/theme';
import { EXERCISES } from '@/data';
import { ExerciseIllustration } from '@/features/exercises/components/ExerciseIllustration';

interface ExercisePickerSheetProps {
  visible: boolean;
  existingExerciseIds: string[];
  onClose: () => void;
  onAdd: (exerciseId: string) => void;
}

export function ExercisePickerSheet({
  visible,
  existingExerciseIds,
  onClose,
  onAdd,
}: ExercisePickerSheetProps) {
  const [query, setQuery] = useState('');

  const existing = useMemo(() => new Set(existingExerciseIds), [existingExerciseIds]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return EXERCISES.filter((exercise) => {
      if (!term) return true;
      const haystack =
        `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [query]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add exercise">
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search exercises" />

      {results.length === 0 ? (
        <AppText tone="muted" style={styles.empty}>
          No exercises match your search.
        </AppText>
      ) : (
        results.map((exercise) => {
          const added = existing.has(exercise.id);
          return (
            <PressableScale
              key={exercise.id}
              accessibilityRole="button"
              accessibilityLabel={
                added ? `${exercise.name} already in routine` : `Add ${exercise.name}`
              }
              accessibilityState={{ disabled: added }}
              disabled={added}
              onPress={() => onAdd(exercise.id)}
              style={[styles.row, added && styles.rowAdded]}
            >
              <ExerciseIllustration exercise={exercise} size={48} />
              <View style={styles.rowText}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {exercise.name}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {exercise.muscleGroup} · {exercise.equipment}
                </AppText>
              </View>
              <Icon
                name={added ? 'checkmark-circle' : 'add-circle-outline'}
                size={24}
                color={added ? colors.success : colors.primary}
              />
            </PressableScale>
          );
        })
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
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
