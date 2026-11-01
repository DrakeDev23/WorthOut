import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { layout, spacing } from '@/constants/theme';
import { Chip } from './Chip';

interface FilterChipRowProps<T extends string> {
  options: readonly T[];
  selected: T | null;
  onSelect: (value: T | null) => void;
  allLabel?: string;
}

export function FilterChipRow<T extends string>({
  options,
  selected,
  onSelect,
  allLabel = 'All',
}: FilterChipRowProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Chip label={allLabel} selected={selected === null} onPress={() => onSelect(null)} />
      {options.map((option) => (
        <Chip
          key={option}
          label={option}
          selected={selected === option}
          onPress={() => onSelect(selected === option ? null : option)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingRight: layout.screenPaddingX,
  },
});
