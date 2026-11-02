import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeInView } from '@/components/ui/FadeInView';
import { TabScreen } from '@/components/ui/TabScreen';
import { Toast } from '@/components/ui/Toast';
import { spacing } from '@/constants/theme';
import { RoutineCard } from '@/features/planner/components/RoutineCard';
import {
  RoutineFormSheet,
  type RoutineFormValues,
} from '@/features/planner/components/RoutineFormSheet';
import { useRoutines } from '@/store/routines';

export default function PlannerScreen() {
  const router = useRouter();
  const { routines, createRoutine } = useRoutines();
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleCreate = (values: RoutineFormValues) => {
    const id = createRoutine(values);
    setCreateOpen(false);
    setToast(`${values.name} created.`);
    router.push(`/routine/${id}`);
  };

  return (
    <TabScreen contentStyle={styles.content}>
      <Toast message={toast} onHide={() => setToast(null)} />

      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          Workout Planner
        </AppText>
        <AppText tone="muted">Build your own routines and train with intent.</AppText>
      </View>

      <PrimaryButton
        title="Create Routine"
        accessibilityHint="Opens a form to create a new routine"
        onPress={() => setCreateOpen(true)}
      />

      {routines.length === 0 ? (
        <EmptyState
          icon="create-outline"
          title="No routines yet"
          message="Create your first routine to start planning your workouts."
          actionLabel="Create Routine"
          onActionPress={() => setCreateOpen(true)}
        />
      ) : (
        <View style={styles.list}>
          <AppText variant="label" tone="muted">
            {routines.length} {routines.length === 1 ? 'routine' : 'routines'}
          </AppText>
          {routines.map((routine, index) => (
            <FadeInView key={routine.id} delay={Math.min(index, 8) * 40} distance={10}>
              <RoutineCard routine={routine} onPress={() => router.push(`/routine/${routine.id}`)} />
            </FadeInView>
          ))}
        </View>
      )}

      <RoutineFormSheet
        visible={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
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
  list: {
    gap: spacing.md,
  },
});
