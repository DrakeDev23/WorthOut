import React from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, layout, radius, shadows, spacing } from '@/constants/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

interface BaseButtonProps extends ButtonProps {
  variant: Variant;
}

function BaseButton({
  variant,
  title,
  onPress,
  loading = false,
  disabled = false,
  accessibilityHint,
  style,
}: BaseButtonProps) {
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={disabled}
      onPress={loading ? undefined : onPress}
      style={[styles.base, isPrimary ? styles.primary : styles.secondary, style]}
    >
      <View style={[styles.content, loading && styles.hidden]}>
        <AppText variant="button" tone={isPrimary ? 'onPrimary' : 'default'}>
          {title}
        </AppText>
      </View>
      {loading ? (
        <ActivityIndicator
          style={StyleSheet.absoluteFill}
          color={isPrimary ? colors.onPrimary : colors.primary}
        />
      ) : null}
    </PressableScale>
  );
}

export function PrimaryButton(props: ButtonProps) {
  return <BaseButton variant="primary" {...props} />;
}

export function SecondaryButton(props: ButtonProps) {
  return <BaseButton variant="secondary" {...props} />;
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.controlHeight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: {
    opacity: 0,
  },
});
