import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, motion, radius, spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AppText } from './AppText';
import { PrimaryButton, SecondaryButton } from './Button';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;

  confirmLabel?: string;

  cancelLabel?: string;

  destructive?: boolean;

  infoOnly?: boolean;
  onConfirm?: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  infoOnly = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motion.fast,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, progress, reducedMotion]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const resolvedConfirmLabel = confirmLabel ?? (infoOnly ? 'Got it' : 'Confirm');

  const handleConfirm = () => {
    if (infoOnly) {
      onCancel();
      return;
    }
    onConfirm?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={styles.backdrop}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        onPress={onCancel}
      />
      <View
        style={[styles.anchor, { paddingBottom: insets.bottom, paddingTop: insets.top }]}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <AppText variant="heading" style={styles.title} accessibilityRole="header">
            {title}
          </AppText>
          {message ? (
            <AppText tone="muted" style={styles.message}>
              {message}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            {destructive && !infoOnly ? (
              <PrimaryButton
                title={resolvedConfirmLabel}
                onPress={handleConfirm}
                style={styles.destructive}
              />
            ) : (
              <PrimaryButton title={resolvedConfirmLabel} onPress={handleConfirm} />
            )}
            {infoOnly ? null : <SecondaryButton title={cancelLabel} onPress={onCancel} />}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  anchor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  destructive: {
    backgroundColor: colors.danger,
  },
});
