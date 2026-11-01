import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { MOCK_USER } from '@/data';
import { authService, type AuthResult } from '@/services/auth';
import type { User } from '@/types/models';

interface SessionContextValue {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.signIn({ email: email.trim(), password });
    if (result.status === 'success') {
      setUser({ ...MOCK_USER, email: email.trim().toLowerCase() || MOCK_USER.email });
    }
    return result;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const result = await authService.signUp({ name: name.trim(), email: email.trim(), password });
    if (result.status === 'success') {
      setUser({
        ...MOCK_USER,
        name: name.trim() || MOCK_USER.name,
        email: email.trim().toLowerCase() || MOCK_USER.email,
      });
    }
    return result;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ user, isAuthenticated: user !== null, signIn, signUp, signOut }),
    [user, signIn, signUp, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider.');
  }
  return context;
}
