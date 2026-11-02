import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { spacing } from '@/constants/theme';
import type { RoutineCategory } from '@/types/models';
import { CATEGORY_ICONS, ROUTINE_CATEGORIES } from '../meta';

interface CategorySelectorProps {
  selected: RoutineCategory | null;
  onSelect: (category: RoutineCategory | null) => void;
}

export function CategorySelector({ selected, onSelect }: CategorySelectorProps) {
  return (
    <View style={styles.container}>
      <AppText variant="label" tone="muted">
        Category (optional)
      </AppText>
      <View style={styles.chipWrap}>
        {ROUTINE_CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={category}
            icon={CATEGORY_ICONS[category]}
            selected={selected === category}
            onPress={() => onSelect(selected === category ? null : category)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
