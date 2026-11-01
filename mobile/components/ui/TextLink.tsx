import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { layout } from '@/constants/theme';
import { AppText } from './AppText';

interface TextLinkProps {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Inline text action with a full-size touch target. */
export function TextLink({ label, onPress, accessibilityHint, style }: TextLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={({ pressed }) => [styles.link, pressed && styles.pressed, style]}
    >
      <AppText variant="label" tone="primary">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    minHeight: layout.minTouchTarget - 8,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
