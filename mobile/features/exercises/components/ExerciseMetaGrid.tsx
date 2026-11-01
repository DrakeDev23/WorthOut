import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors, radius, spacing } from '@/constants/theme';

interface MetaItem {
  icon: IconName;
  label: string;
  value: string;
  tint?: string;
}

export function ExerciseMetaGrid({ items }: { items: MetaItem[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.label} style={styles.tile}>
          <View style={[styles.iconChip, { backgroundColor: `${item.tint ?? colors.primary}22` }]}>
            <Icon name={item.icon} size={16} color={item.tint ?? colors.primary} />
          </View>
          <View style={styles.text}>
            <AppText variant="caption" tone="subtle">
              {item.label}
            </AppText>
            <AppText variant="label" numberOfLines={1}>
              {item.value}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 1,
  },
});
