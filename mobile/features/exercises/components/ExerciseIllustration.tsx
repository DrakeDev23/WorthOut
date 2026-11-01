import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { radius } from '@/constants/theme';
import type { Exercise } from '@/types/models';
import { MUSCLE_ICONS } from '../meta';

interface ExerciseIllustrationProps {
  exercise: Exercise;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function ExerciseIllustration({ exercise, size = 72, style }: ExerciseIllustrationProps) {
  const tint = exercise.accentColor;
  const iconName = MUSCLE_ICONS[exercise.muscleGroup];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.container,
        { width: size, height: size, backgroundColor: `${tint}1F`, borderColor: `${tint}3D` },
        style,
      ]}
    >
      <View
        style={[
          styles.ring,
          {
            width: size * 0.62,
            height: size * 0.62,
            borderRadius: (size * 0.62) / 2,
            borderColor: `${tint}55`,
          },
        ]}
      />
      <Icon name={iconName} size={size * 0.4} color={tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
});
