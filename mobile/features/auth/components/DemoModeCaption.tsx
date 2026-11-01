import React from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/constants/theme';
import { authService } from '@/services/auth';

export function DemoModeCaption({ action }: { action: string }) {
  if (!authService.isMock) return null;
  return (
    <AppText variant="caption" tone="subtle" style={styles.caption}>
      Preview build: {action} is simulated and nothing is saved.
    </AppText>
  );
}

const styles = StyleSheet.create({
  caption: {
    textAlign: 'center',
    marginTop: -spacing.xs,
  },
});
