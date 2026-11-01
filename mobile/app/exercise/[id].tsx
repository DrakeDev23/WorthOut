import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { BackgroundGlow } from '@/components/ui/BackgroundGlow';
import { PrimaryButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { StackScreenHeader } from '@/components/ui/StackScreenHeader';
import { TabScreen } from '@/components/ui/TabScreen';
import { Toast } from '@/components/ui/Toast';
import { colors, radius, spacing } from '@/constants/theme';
import { getExerciseById } from '@/data';
import { AddToRoutineSheet } from '@/features/exercises/components/AddToRoutineSheet';
import { DifficultyBadge } from '@/features/exercises/components/DifficultyBadge';
import { ExerciseIllustration } from '@/features/exercises/components/ExerciseIllustration';
import { ExerciseMetaGrid } from '@/features/exercises/components/ExerciseMetaGrid';
import { DIFFICULTY_COLORS, EQUIPMENT_ICONS } from '@/features/exercises/meta';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = getExerciseById(id ?? '');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!exercise) {
    return (
      <TabScreen tabBarClearance={false}>
        <StackScreenHeader title="Exercise" />
        <EmptyState
          icon="alert-circle-outline"
          title="Exercise not found"
          message="We couldn't find this exercise in the library."
        />
      </TabScreen>
    );
  }

  const repLabel = exercise.defaultReps <= 1 ? '45s hold' : `${exercise.defaultReps} reps`;

  return (
    <View style={styles.root}>
      <BackgroundGlow />
      <Toast message={toast} onHide={() => setToast(null)} />

      <TabScreen glow={false} tabBarClearance={false} contentStyle={styles.content}>
        <StackScreenHeader title={exercise.name} subtitle={exercise.muscleGroup} />

        <View style={styles.hero}>
          <ExerciseIllustration exercise={exercise} size={120} />
          <DifficultyBadge difficulty={exercise.difficulty} />
        </View>

        <AppText tone="muted">{exercise.description}</AppText>

        <ExerciseMetaGrid
          items={[
            {
              icon: 'locate-outline',
              label: 'Target muscle',
              value: exercise.muscleGroup,
            },
            {
              icon: EQUIPMENT_ICONS[exercise.equipment],
              label: 'Equipment',
              value: exercise.equipment,
              tint: colors.info,
            },
            {
              icon: 'speedometer-outline',
              label: 'Difficulty',
              value: exercise.difficulty,
              tint: DIFFICULTY_COLORS[exercise.difficulty],
            },
            {
              icon: 'repeat-outline',
              label: 'Suggested',
              value: `${exercise.defaultSets} × ${repLabel}`,
              tint: colors.accent,
            },
          ]}
        />

        {exercise.secondaryMuscles.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="subheading">Also works</AppText>
            <View style={styles.chipWrap}>
              {exercise.secondaryMuscles.map((muscle) => (
                <Chip key={muscle} label={muscle} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <AppText variant="subheading">How to do it</AppText>
          <View style={styles.steps}>
            {exercise.instructions.map((step, index) => (
              <View key={index} style={styles.step}>
                <View style={styles.stepNumber}>
                  <AppText variant="label" tone="onPrimary">
                    {index + 1}
                  </AppText>
                </View>
                <AppText variant="body" style={styles.stepText}>
                  {step}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="subheading">Tips</AppText>
          <View style={styles.tips}>
            {exercise.tips.map((tip, index) => (
              <View key={index} style={styles.tip}>
                <Icon name="bulb-outline" size={18} color={colors.primary} />
                <AppText variant="body" style={styles.stepText}>
                  {tip}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footerSpacer} />
      </TabScreen>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <PrimaryButton
          title="Add to Routine"
          accessibilityHint="Choose a routine to add this exercise to"
          onPress={() => setSheetOpen(true)}
        />
      </SafeAreaView>

      <AddToRoutineSheet
        visible={sheetOpen}
        exerciseId={exercise.id}
        exerciseName={exercise.name}
        onClose={() => setSheetOpen(false)}
        onAdded={(message) => setToast(message)}
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
    gap: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  steps: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepText: {
    flex: 1,
  },
  tips: {
    gap: spacing.md,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerSpacer: {
    height: spacing.xxl,
  },
});
