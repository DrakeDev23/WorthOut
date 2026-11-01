import React from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/constants/theme';
import { TAB_BAR_CLEARANCE } from '@/features/navigation/metrics';
import { BackgroundGlow } from './BackgroundGlow';

interface TabScreenProps {
  children: React.ReactNode;
  glow?: boolean;
  scroll?: boolean;
  tabBarClearance?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function TabScreen({
  children,
  glow = true,
  scroll = true,
  tabBarClearance = true,
  contentStyle,
}: TabScreenProps) {
  const insets = useSafeAreaInsets();

  const bottomPadding = tabBarClearance
    ? TAB_BAR_CLEARANCE + Math.max(insets.bottom, spacing.md) + spacing.md
    : Math.max(insets.bottom, spacing.xl);

  const inner = <View style={[styles.content, contentStyle]}>{children}</View>;

  return (
    <View style={styles.root}>
      {glow ? <BackgroundGlow /> : null}
      <SafeAreaView style={styles.flex} edges={['top']}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
          >
            {inner}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.scrollContent, { paddingBottom: bottomPadding }]}>
            {inner}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: spacing.lg,
    gap: spacing.xxl,
  },
});
