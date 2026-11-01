import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

const LAYERS = 9;

interface OrbProps {
  color: string;
  size: number;
  /** Peak opacity at the center of the orb. */
  intensity: number;
  position: { top?: number; bottom?: number; left?: number; right?: number };
}

/** Soft radial glow built from stacked translucent circles (no gradient dependency). */
export function GlowOrb({ color, size, intensity, position }: OrbProps) {
  return (
    <View style={[styles.orb, { width: size, height: size }, position]}>
      {Array.from({ length: LAYERS }, (_, index) => {
        const diameter = size * (1 - index / LAYERS);
        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              width: diameter,
              height: diameter,
              borderRadius: diameter / 2,
              backgroundColor: color,
              opacity: intensity / LAYERS,
            }}
          />
        );
      })}
    </View>
  );
}

/** Decorative ambient lighting behind screen content. Ignored by touch and screen readers. */
export function BackgroundGlow() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <GlowOrb
        color={colors.primary}
        size={420}
        intensity={0.5}
        position={{ top: -190, right: -170 }}
      />
      <GlowOrb
        color={colors.info}
        size={360}
        intensity={0.3}
        position={{ bottom: -190, left: -170 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
