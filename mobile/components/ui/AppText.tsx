import React from 'react';
import { Text, type TextProps } from 'react-native';

import { colors, typography } from '@/constants/theme';

type Tone = 'default' | 'muted' | 'subtle' | 'primary' | 'onPrimary' | 'danger';

const toneColors: Record<Tone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  subtle: colors.textSubtle,
  primary: colors.primary,
  onPrimary: colors.onPrimary,
  danger: colors.danger,
};

export interface AppTextProps extends TextProps {
  variant?: keyof typeof typography;
  tone?: Tone;
}

export function AppText({ variant = 'body', tone = 'default', style, ...rest }: AppTextProps) {
  return <Text style={[typography[variant], { color: toneColors[tone] }, style]} {...rest} />;
}
