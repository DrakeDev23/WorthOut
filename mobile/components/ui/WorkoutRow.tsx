import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { formatMinutes, formatRelativeDate } from '@/lib/format';
import type { WorkoutSession } from '@/types/models';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface WorkoutRowProps {
  session: WorkoutSession;
  onPress?: () => void;
}

export function WorkoutRow({ session, onPress }: WorkoutRowProps) {
  return (
    <PressableScale
      onPress={onPress ?? (() => {})}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${session.routineName}, ${formatRelativeDate(session.date)}`}
      style={styles.row}
    >
      <View style={styles.iconChip}>
        <Icon name="checkmark-done" size={20} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {session.routineName}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatRelativeDate(session.date)} · {formatMinutes(session.durationMinutes)} ·{' '}
          {session.totalSets} sets
        </AppText>
      </View>
      {onPress ? <Icon name="chevron-forward" size={18} color={colors.textSubtle} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
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
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
});
