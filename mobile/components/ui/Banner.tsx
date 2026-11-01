import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { AppText } from './AppText';
import { FadeInView } from './FadeInView';

export type BannerTone = 'error' | 'info' | 'success';

const toneStyles: Record<BannerTone, { background: string; accent: string; title: string }> = {
  error: { background: colors.dangerSoft, accent: colors.danger, title: 'Something went wrong' },
  info: { background: colors.infoSoft, accent: colors.info, title: 'Heads up' },
  success: { background: colors.successSoft, accent: colors.success, title: 'Looks good' },
};

interface BannerProps {
  tone: BannerTone;
  message: string;
  title?: string;
}

/** Inline status message for form-level feedback. */
export function Banner({ tone, message, title }: BannerProps) {
  const { background, accent, title: defaultTitle } = toneStyles[tone];
  const heading = title ?? defaultTitle;

  return (
    <FadeInView distance={8} duration={220}>
      <View
        accessibilityRole={tone === 'error' ? 'alert' : undefined}
        accessibilityLiveRegion="polite"
        style={[styles.container, { backgroundColor: background, borderColor: accent }]}
      >
        <View style={[styles.marker, { backgroundColor: accent }]} />
        <View style={styles.text}>
          <AppText variant="label">{heading}</AppText>
          <AppText variant="caption" tone="muted" style={styles.message}>
            {message}
          </AppText>
        </View>
      </View>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  marker: {
    width: 4,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  text: {
    flex: 1,
  },
  message: {
    marginTop: 2,
    lineHeight: 19,
  },
});
