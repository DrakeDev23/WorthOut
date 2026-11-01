import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { AppText } from './AppText';

export interface BarChartDatum {
  label: string;
  value: number;
  highlighted?: boolean;
}

interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  formatValue?: (value: number) => string;
}

export function BarChart({ data, height = 120, formatValue }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {data.map((datum) => {
          const ratio = datum.value / max;
          const barHeight = Math.max(datum.value > 0 ? 6 : 3, Math.round(ratio * height));
          const active = datum.highlighted ?? datum.value > 0;
          return (
            <View key={datum.label} style={styles.column}>
              {datum.highlighted && datum.value > 0 && formatValue ? (
                <AppText variant="caption" tone="primary" style={styles.cap}>
                  {formatValue(datum.value)}
                </AppText>
              ) : null}
              <View
                accessibilityLabel={`${datum.label}: ${datum.value}`}
                style={[
                  styles.bar,
                  { height: barHeight },
                  active ? styles.barActive : styles.barIdle,
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((datum) => (
          <View key={datum.label} style={styles.labelCell}>
            <AppText variant="caption" tone="subtle">
              {datum.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cap: {
    marginBottom: spacing.xs,
  },
  bar: {
    width: '70%',
    borderRadius: radius.sm,
  },
  barActive: {
    backgroundColor: colors.primary,
  },
  barIdle: {
    backgroundColor: colors.border,
  },
  labels: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  labelCell: {
    flex: 1,
    alignItems: 'center',
  },
});
