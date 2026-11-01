import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { SecondaryButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TabScreen } from '@/components/ui/TabScreen';
import { spacing } from '@/constants/theme';

export default function ProgressScreen() {
  const router = useRouter();

  return (
    <TabScreen>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          Progress
        </AppText>
      </View>
      <EmptyState
        icon="stats-chart-outline"
        title="Coming soon"
        message="Charts, personal records and trends arrive in a later stage. Your workout history is already available."
      />
      <SecondaryButton title="View Workout History" onPress={() => router.push('/history')} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
});
