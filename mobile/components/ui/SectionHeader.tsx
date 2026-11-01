import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/theme';
import { AppText } from './AppText';
import { TextLink } from './TextLink';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {actionLabel && onActionPress ? (
        <TextLink label={actionLabel} onPress={onActionPress} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
