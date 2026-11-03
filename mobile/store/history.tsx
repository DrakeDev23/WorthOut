import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { historyRepository } from '@/repositories/history.repository';
import type { WorkoutSession } from '@/types/models';

interface HistoryContextValue {
  history: WorkoutSession[];
  isLoading: boolean;
  getSession: (id: string) => WorkoutSession | undefined;
  addSession: (session: WorkoutSession) => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    historyRepository
      .getAll()
      .then((loaded) => {
        if (!cancelled) {
          setHistory(loaded);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('[history] failed to load history:', error);
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addSession = useCallback((session: WorkoutSession) => {
    let shouldPersist = false;
    setHistory((prev) => {
      if (prev.some((item) => item.id === session.id)) return prev;
      shouldPersist = true;
      return [session, ...prev];
    });
    if (shouldPersist) {
      historyRepository.saveCompletedWorkout(session).catch((error) => {
        console.error('[history] failed to persist session:', error);
      });
    }
  }, []);

  const getSession = useCallback((id: string) => history.find((item) => item.id === id), [history]);

  const value = useMemo<HistoryContextValue>(
    () => ({ history, isLoading, getSession, addSession }),
    [history, isLoading, getSession, addSession]
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider.');
  }
  return context;
}
