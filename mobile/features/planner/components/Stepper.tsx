import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radius, spacing } from '@/constants/theme';

interface StepperProps {
  label: string;
  value: number;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function Stepper({
  label,
  value,
  unit,
  step = 1,
  min = 0,
  max = 999,
  onChange,
}: StepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const decrement = () => onChange(clamp(value - step));
  const increment = () => onChange(clamp(value + step));
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View style={styles.container}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <View style={styles.controls}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          disabled={atMin}
          onPress={decrement}
          style={[styles.button, atMin && styles.buttonDisabled]}
        >
          <Icon name="remove" size={20} color={atMin ? colors.textSubtle : colors.text} />
        </PressableScale>

        <View style={styles.valueBox}>
          <AppText variant="subheading">{value}</AppText>
          {unit ? (
            <AppText variant="caption" tone="muted">
              {unit}
            </AppText>
          ) : null}
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          disabled={atMax}
          onPress={increment}
          style={[styles.button, atMax && styles.buttonDisabled]}
        >
          <Icon name="add" size={20} color={atMax ? colors.textSubtle : colors.text} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  valueBox: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
