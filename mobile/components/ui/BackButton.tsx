import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { colors, layout, radius } from '@/constants/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export function BackButton() {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <PressableScale
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={4}
      style={styles.button}
    >
      <Icon name="chevron-back" size={22} color={colors.text} />
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
});
