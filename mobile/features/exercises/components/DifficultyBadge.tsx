import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/constants/theme';
import type { Difficulty } from '@/types/models';
import { DIFFICULTY_COLORS } from '../meta';

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const color = DIFFICULTY_COLORS[difficulty];

  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="caption" style={{ color, fontWeight: '600' }}>
        {difficulty}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
