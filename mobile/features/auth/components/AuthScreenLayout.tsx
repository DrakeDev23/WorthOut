import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { FadeInView } from '@/components/ui/FadeInView';
import { Logo } from '@/components/ui/Logo';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { spacing } from '@/constants/theme';

interface AuthScreenLayoutProps {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  centered?: boolean;
  children: React.ReactNode;
}

export function AuthScreenLayout({
  title,
  subtitle,
  footer,
  centered = false,
  children,
}: AuthScreenLayoutProps) {
  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <BackButton />
        {centered ? null : <Logo size="sm" />}
      </View>

      <FadeInView style={[styles.header, centered && styles.headerCentered]}>
        {centered ? <Logo size="lg" showWordmark={false} /> : null}
        <AppText
          variant="title"
          accessibilityRole="header"
          style={centered ? styles.centerText : undefined}
        >
          {title}
        </AppText>
        <AppText tone="muted" style={[styles.subtitle, centered && styles.centerText]}>
          {subtitle}
        </AppText>
      </FadeInView>

      <FadeInView delay={100} style={styles.body}>
        {children}
      </FadeInView>

      <FadeInView delay={200} style={styles.footer}>
        {footer}
      </FadeInView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  headerCentered: {
    alignItems: 'center',
    marginTop: 0,
  },
  centerText: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  body: {
    gap: spacing.lg,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.xs + 2,
  },
});
