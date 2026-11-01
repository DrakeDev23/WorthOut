import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import type { IconName } from '@/components/ui/Icon';
import { TabScreen } from '@/components/ui/TabScreen';
import { spacing } from '@/constants/theme';

interface StagePlaceholderProps {
  title: string;
  icon: IconName;
  message: string;
}

export function StagePlaceholder({ title, icon, message }: StagePlaceholderProps) {
  return (
    <TabScreen>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      <EmptyState icon={icon} title="Coming soon" message={message} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
});
