import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadows, spacing } from '@/constants/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface ToastProps {
  message: string | null;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, onHide, duration = 2200 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onHide();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, progress, onHide]);

  if (!message) return null;

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        { top: insets.top + spacing.sm, opacity: progress, transform: [{ translateY }] },
      ]}
    >
      <Icon name="checkmark-circle" size={18} color={colors.onPrimary} />
      <AppText variant="label" tone="onPrimary" style={styles.text}>
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    zIndex: 100,
    ...shadows.glow,
  },
  text: {
    flex: 1,
  },
});
