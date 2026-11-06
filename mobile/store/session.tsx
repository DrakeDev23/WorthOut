import { useAuth, useUser } from '@clerk/expo';
import React, { createContext, useCallback, useContext, useMemo } from 'react';

import type { User } from '@/types/models';

interface SessionContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function mapClerkUser(
  clerkUser: NonNullable<ReturnType<typeof useUser>['user']> | null | undefined
): User | null {
  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? '';
  const name =
    clerkUser.fullName?.trim() ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
    email.split('@')[0] ||
    'Athlete';

  return {
    id: clerkUser.id,
    name,
    email,
    preferredEquipment: [],
    fitnessGoal: '',
    weeklyGoal: 5,
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut: clerkSignOut } = useAuth();
  const { user: clerkUser } = useUser();

  const user = useMemo(() => mapClerkUser(clerkUser), [clerkUser]);

  const signOut = useCallback(async () => {
    await clerkSignOut();
  }, [clerkSignOut]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(isSignedIn),
      isLoaded,
      signOut,
    }),
    [user, isSignedIn, isLoaded, signOut]
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
