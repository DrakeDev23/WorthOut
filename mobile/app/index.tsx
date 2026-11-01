import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { FadeInView } from '@/components/ui/FadeInView';
import { Logo } from '@/components/ui/Logo';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { layout, spacing } from '@/constants/theme';
import { FeaturePills } from '@/features/welcome/components/FeaturePills';
import { MascotHero } from '@/features/welcome/components/MascotHero';

const MAX_MASCOT_SIZE = 280;
const COMPACT_HEIGHT = 700;

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const availableWidth = Math.min(width, layout.maxContentWidth) - layout.screenPaddingX * 2;
  const mascotSize = Math.round(
    Math.min(availableWidth, MAX_MASCOT_SIZE) * (height < COMPACT_HEIGHT ? 0.7 : 1)
  );

  return (
    <ScreenContainer>
      <FadeInView distance={8}>
        <Logo />
      </FadeInView>

      <FadeInView delay={120} style={styles.hero}>
        <MascotHero size={mascotSize} />
      </FadeInView>

      <FadeInView delay={240} style={styles.copy}>
        <AppText variant="display" accessibilityRole="header">
          Every rep{'\n'}is{' '}
          <AppText variant="display" tone="primary">
            worth it.
          </AppText>
        </AppText>
        <AppText tone="muted">
          Plan your home workouts, log every session, and follow guided routines, all in one place.
        </AppText>
        <FeaturePills />
      </FadeInView>

      <FadeInView delay={360} style={styles.actions}>
        <PrimaryButton
          title="Get Started"
          accessibilityHint="Opens the registration screen"
          onPress={() => router.push('/register')}
        />
        <SecondaryButton
          title="Log In"
          accessibilityHint="Opens the login screen"
          onPress={() => router.push('/login')}
        />
      </FadeInView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: spacing.md,
  },
  copy: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
});
