import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, spacing } from '@/constants/theme';

interface StreakCardProps {
  streak: number;
}

function encouragement(streak: number): string {
  if (streak <= 0) return 'Start a workout today to begin a new streak.';
  if (streak < 3) return 'Nice start — keep the momentum going!';
  if (streak < 7) return "You're on a roll. Don't break the chain!";
  return 'Incredible consistency. You are unstoppable!';
}

export function StreakCard({ streak }: StreakCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconChip}>
        <Icon name="flame" size={26} color={colors.accent} />
      </View>
      <View style={styles.text}>
        <AppText variant="subheading">
          {streak} day{streak === 1 ? '' : 's'} streak
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.message}>
          {encouragement(streak)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: `${colors.accent}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  message: {
    marginTop: 2,
  },
});
