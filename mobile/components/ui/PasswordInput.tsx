import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { layout, radius, spacing } from '@/constants/theme';
import { AppText } from './AppText';
import { CustomInput, type CustomInputProps } from './CustomInput';

type PasswordInputProps = Omit<CustomInputProps, 'secureTextEntry' | 'rightAccessory'>;

/** Password field with a show/hide toggle. */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const toggle = (
    <Pressable
      onPress={() => setVisible((prev) => !prev)}
      accessibilityRole="button"
      accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
      style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
    >
      <AppText variant="label" tone="primary">
        {visible ? 'Hide' : 'Show'}
      </AppText>
    </Pressable>
  );

  return (
    <CustomInput
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      {...props}
      secureTextEntry={!visible}
      rightAccessory={toggle}
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    minHeight: layout.minTouchTarget - 8,
    minWidth: 44,
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  togglePressed: {
    opacity: 0.6,
  },
});
