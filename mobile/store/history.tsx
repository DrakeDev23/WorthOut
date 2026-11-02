import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { WORKOUT_HISTORY } from '@/data';
import type { WorkoutSession } from '@/types/models';

interface HistoryContextValue {
  history: WorkoutSession[];
  getSession: (id: string) => WorkoutSession | undefined;
  addSession: (session: WorkoutSession) => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<WorkoutSession[]>(WORKOUT_HISTORY);

  const addSession = useCallback((session: WorkoutSession) => {
    setHistory((prev) => {
      if (prev.some((item) => item.id === session.id)) return prev;
      return [session, ...prev];
    });
  }, []);

  const getSession = useCallback(
    (id: string) => history.find((item) => item.id === id),
    [history]
  );

  const value = useMemo<HistoryContextValue>(
    () => ({ history, getSession, addSession }),
    [history, getSession, addSession]
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
