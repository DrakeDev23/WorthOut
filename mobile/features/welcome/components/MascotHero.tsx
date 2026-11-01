import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { GlowOrb } from '@/components/ui/BackgroundGlow';
import { colors } from '@/constants/theme';
import mascotImage from '../../../assets/worthout_mascot_login.gif';

export function MascotHero({ size }: { size: number }) {
  const glow = size * 1.2;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.container, { height: size, width: glow }]}
    >
      <GlowOrb
        color={colors.primary}
        size={glow}
        intensity={0.35}
        position={{ top: (size - glow) / 2, left: 0 }}
      />
      <Image source={mascotImage} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
