import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface StatCardProps {
  icon: IconName;
  value: string;
  label: string;
  tint?: string;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({ icon, value, label, tint = colors.primary, style }: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconChip, { backgroundColor: `${tint}22` }]}>
        <Icon name={icon} size={18} color={tint} />
      </View>
      <AppText variant="title" style={styles.value}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 24,
    lineHeight: 28,
  },
});
