import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BackgroundGlow } from '@/components/ui/BackgroundGlow';
import { PrimaryButton } from '@/components/ui/Button';
import { colors, spacing } from '@/constants/theme';
import { initializeDatabase } from '@/database';

type DatabaseStatus = 'initializing' | 'ready' | 'error';

interface DatabaseContextValue {
  status: DatabaseStatus;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<DatabaseStatus>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('initializing');
    setError(null);
    initializeDatabase()
      .then(() => {
        if (!cancelled) setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unknown database error');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo<DatabaseContextValue>(() => ({ status }), [status]);

  if (status === 'initializing') {
    return (
      <View style={styles.root}>
        <BackgroundGlow />
        <ActivityIndicator color={colors.primary} size="large" />
        <AppText tone="muted" style={styles.text}>
          Loading your workouts…
        </AppText>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.root}>
        <BackgroundGlow />
        <AppText variant="heading" style={styles.text}>
          Couldn’t open your data
        </AppText>
        <AppText tone="muted" style={styles.text}>
          {error ?? 'The local database failed to initialize.'}
        </AppText>
        <View style={styles.action}>
          <PrimaryButton title="Try again" onPress={retry} />
        </View>
      </View>
    );
  }

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabaseStatus(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseStatus must be used within a DatabaseProvider.');
  }
  return context;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  text: {
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
