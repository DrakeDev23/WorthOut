import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeInView } from '@/components/ui/FadeInView';
import { FilterChipRow } from '@/components/ui/FilterChipRow';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { SearchBar } from '@/components/ui/SearchBar';
import { TabScreen } from '@/components/ui/TabScreen';
import { colors, layout, radius, spacing } from '@/constants/theme';
import { DIFFICULTIES, EQUIPMENT_TYPES, MUSCLE_GROUPS } from '@/data';
import { ExerciseCard } from '@/features/exercises/components/ExerciseCard';
import { useExerciseFilters } from '@/features/exercises/useExerciseFilters';

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const {
    state,
    results,
    activeFilterCount,
    setQuery,
    setMuscleGroup,
    setEquipment,
    setDifficulty,
    reset,
  } = useExerciseFilters();

  const hasActiveFilters = activeFilterCount > 0 || state.query.trim().length > 0;

  return (
    <TabScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          Exercises
        </AppText>
        <AppText tone="muted">Find a move and learn how to do it right.</AppText>
      </View>

      <View style={styles.controls}>
        <SearchBar value={state.query} onChangeText={setQuery} placeholder="Search exercises" />
      </View>

      <View style={styles.filters}>
        <AppText variant="label" tone="muted" style={styles.filterLabel}>
          Muscle group
        </AppText>
        <View style={styles.chipRow}>
          <FilterChipRow
            options={MUSCLE_GROUPS}
            selected={state.muscleGroup}
            onSelect={setMuscleGroup}
          />
        </View>

        <AppText variant="label" tone="muted" style={styles.filterLabel}>
          Equipment
        </AppText>
        <View style={styles.chipRow}>
          <FilterChipRow
            options={EQUIPMENT_TYPES}
            selected={state.equipment}
            onSelect={setEquipment}
          />
        </View>

        <AppText variant="label" tone="muted" style={styles.filterLabel}>
          Difficulty
        </AppText>
        <View style={styles.chipRow}>
          <FilterChipRow
            options={DIFFICULTIES}
            selected={state.difficulty}
            onSelect={setDifficulty}
          />
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <AppText variant="label" tone="muted">
          {results.length} {results.length === 1 ? 'exercise' : 'exercises'}
        </AppText>
        {hasActiveFilters ? (
          <PressableScale
            onPress={reset}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            style={styles.clearButton}
          >
            <Icon name="refresh-outline" size={14} color={colors.primary} />
            <AppText variant="label" tone="primary">
              Clear
            </AppText>
          </PressableScale>
        ) : null}
      </View>

      {results.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No exercises found"
          message="Try a different search term or clear your filters to see more."
          actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
          onActionPress={hasActiveFilters ? reset : undefined}
        />
      ) : (
        <View style={styles.list}>
          {results.map((exercise, index) => (
            <FadeInView key={exercise.id} delay={Math.min(index, 8) * 40} distance={10}>
              <ExerciseCard
                exercise={exercise}
                onPress={() => router.push(`/exercise/${exercise.id}`)}
              />
            </FadeInView>
          ))}
        </View>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  controls: {
    gap: spacing.md,
  },
  filters: {
    gap: spacing.sm,
  },
  chipRow: {
    marginHorizontal: -layout.screenPaddingX,
    paddingLeft: layout.screenPaddingX,
  },
  filterLabel: {
    marginTop: spacing.sm,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  list: {
    gap: spacing.md,
  },
});
