import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, layout, radius, spacing } from '@/constants/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface StackScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function StackScreenHeader({ title, subtitle }: StackScreenHeaderProps) {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <PressableScale
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={4}
        style={styles.backButton}
      >
        <Icon name="chevron-back" size={22} color={colors.text} />
      </PressableScale>
      <View style={styles.text}>
        <AppText variant="heading" accessibilityRole="header" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const SIZE = layout.minTouchTarget;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
});
