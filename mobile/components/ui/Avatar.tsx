import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { initials } from '@/lib/format';
import { AppText } from './AppText';

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 44 }: AvatarProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${name} avatar`}
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <AppText
        tone="onPrimary"
        style={{ fontSize: size * 0.4, fontWeight: '800', letterSpacing: 0.3 }}
      >
        {initials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primarySoft,
    borderRadius: radius.pill,
  },
});
