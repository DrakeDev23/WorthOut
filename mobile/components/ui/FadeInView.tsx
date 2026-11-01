import React, { useEffect, useState } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

import { motion } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface FadeInViewProps {
  children: React.ReactNode;
  /** Milliseconds to wait before starting. Use small steps to stagger siblings. */
  delay?: number;
  /** Starting vertical offset in px. */
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/** Fades and slides its children up on mount. Skips motion when reduce-motion is on. */
export function FadeInView({
  children,
  delay = 0,
  distance = 16,
  duration = motion.slow,
  style,
}: FadeInViewProps) {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress, reducedMotion]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
