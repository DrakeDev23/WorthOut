import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, spacing } from '@/constants/theme';
import { getRoutineById } from '@/data';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routine = getRoutineById(id ?? '');

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Icon name="barbell" size={30} color={colors.primary} />
          </View>
          <AppText variant="title" style={styles.title} accessibilityRole="header">
            {routine ? routine.name : 'Workout'}
          </AppText>
          <AppText tone="muted" style={styles.subtitle}>
            The full Active Workout experience — set tracking, rest timer and the completion summary
            — lands in a later stage. This is the dedicated full-screen route it will use.
          </AppText>

          <View style={styles.actions}>
            <PrimaryButton title="Back to Dashboard" onPress={() => router.replace('/(tabs)')} />
            <SecondaryButton title="Cancel" onPress={() => router.back()} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
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
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 340,
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
});
