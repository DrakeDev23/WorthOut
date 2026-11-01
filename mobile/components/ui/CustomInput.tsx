import React, { useState, type ReactNode, type Ref } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputBlurEvent,
  type TextInputFocusEvent,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, layout, radius, spacing } from '@/constants/theme';
import { AppText } from './AppText';

export interface CustomInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  rightAccessory?: ReactNode;
  inputRef?: Ref<TextInputInstance>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function CustomInput({
  label,
  error,
  hint,
  rightAccessory,
  inputRef,
  containerStyle,
  onFocus,
  onBlur,
  ...inputProps
}: CustomInputProps) {
  const [focused, setFocused] = useState(false);

  const handleFocus = (event: TextInputFocusEvent) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: TextInputBlurEvent) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={containerStyle}>
      <AppText variant="label" tone="muted" style={styles.label}>
        {label}
      </AppText>
      <View
        style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...inputProps}
        />
        {rightAccessory}
      </View>
      {error ? (
        <AppText
          variant="caption"
          tone="danger"
          style={styles.message}
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="subtle" style={styles.message}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.controlHeight,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceRaised,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  message: {
    marginTop: spacing.xs + 2,
    marginLeft: spacing.xs,
  },
});
