import React, { useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { motion } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  pressedScale?: number;
}

export function PressableScale({
  style,
  children,
  pressedScale = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const pressed = useRef(new Animated.Value(0)).current;

  const animateTo = (toValue: number) =>
    Animated.timing(pressed, {
      toValue,
      duration: motion.fast,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

  const handlePressIn = (event: GestureResponderEvent) => {
    animateTo(1);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    animateTo(0);
    onPressOut?.(event);
  };

  const animatedStyle = {
    opacity: pressed.interpolate({
      inputRange: [0, 1],
      outputRange: disabled ? [0.5, 0.5] : [1, 0.88],
    }),
    transform: [
      { scale: pressed.interpolate({ inputRange: [0, 1], outputRange: [1, pressedScale] }) },
    ],
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
