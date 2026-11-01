import type { BottomTabBarProps } from 'expo-router/tabs';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, motion, radius, shadows, spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { BAR_HEIGHT, BAR_SIDE_INSET } from './metrics';

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName; label: string }> = {
  index: { active: 'home', inactive: 'home-outline', label: 'Home' },
  exercises: { active: 'barbell', inactive: 'barbell-outline', label: 'Exercises' },
  planner: { active: 'create', inactive: 'create-outline', label: 'Planner' },
  progress: { active: 'stats-chart', inactive: 'stats-chart-outline', label: 'Progress' },
  profile: { active: 'person', inactive: 'person-outline', label: 'Profile' },
};

function TabButton({
  meta,
  focused,
  onPress,
}: {
  meta: { active: IconName; inactive: IconName; label: string };
  focused: boolean;
  onPress: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(focused ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: motion.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, progress, reducedMotion]);

  const pillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [32, 44] });
  const pillColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(191, 248, 0, 0)', colors.primary],
  });
  const liftY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={meta.label}
      onPress={onPress}
      pressedScale={0.9}
      style={styles.tab}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          { width: pillWidth, backgroundColor: pillColor, transform: [{ translateY: liftY }] },
        ]}
      >
        <Icon
          name={focused ? meta.active : meta.inactive}
          size={22}
          color={focused ? colors.onPrimary : colors.textMuted}
        />
      </Animated.View>
      <AppText variant="caption" tone={focused ? 'primary' : 'subtle'} style={styles.label}>
        {meta.label}
      </AppText>
    </PressableScale>
  );
}

export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const meta = TAB_ICONS[route.name];
          if (!meta) return null;
          const focused = state.index === index;

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return <TabButton key={route.key} meta={meta} focused={focused} onPress={onPress} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: BAR_SIDE_INSET,
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    height: BAR_HEIGHT,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    ...shadows.card,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrap: {
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
  },
});
