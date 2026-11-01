import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import logoImage from '../../assets/worthoutlogo.png';
import { AppText } from './AppText';

type LogoSize = 'sm' | 'md' | 'lg';

// The artwork has transparent padding, so the image box is larger than the visible mark.
const sizes: Record<LogoSize, { mark: number; text: number }> = {
  sm: { mark: 44, text: 20 },
  md: { mark: 64, text: 28 },
  lg: { mark: 112, text: 34 },
};

interface LogoProps {
  size?: LogoSize;
  showWordmark?: boolean;
}

/** Worthout logo image with an optional wordmark. */
export function Logo({ size = 'md', showWordmark = true }: LogoProps) {
  const { mark, text } = sizes[size];

  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Worthout" style={styles.row}>
      <Image source={logoImage} style={{ width: mark, height: mark }} resizeMode="contain" />
      {showWordmark ? (
        <AppText
          style={{
            fontSize: text,
            lineHeight: text * 1.2,
            fontWeight: '800',
            letterSpacing: -0.8,
            marginLeft: -mark * 0.12,
          }}
        >
          Worthout
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
