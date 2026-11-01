import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, layout, radius } from '@/constants/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

interface IconButtonProps {
  name: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  size?: number;
  color?: string;
  badge?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  size = 22,
  color = colors.text,
  badge = false,
  style,
}: IconButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      hitSlop={4}
      style={[styles.button, style]}
    >
      <Icon name={name} size={size} color={color} />
      {badge ? <View style={styles.badge} /> : null}
    </PressableScale>
  );
}

const SIZE = layout.minTouchTarget;

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
