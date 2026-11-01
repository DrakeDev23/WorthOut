import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { colors } from '@/constants/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 22, color = colors.text, style }: IconProps) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
