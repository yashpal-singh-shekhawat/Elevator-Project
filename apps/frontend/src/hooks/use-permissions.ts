'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Permission helpers backed by the snapshot embedded in the session (SafeUser
// carries `permissions: string[]` minted at login). Because it's a token
// snapshot, changes to a role's permissions take effect at the user's NEXT
// login — matching the backend's per-request check against the same snapshot.
export function usePermissions() {
  const { user } = useAuth();

  return useMemo(() => {
    const set = new Set(user?.permissions ?? []);
    return {
      permissions: set,
      // True if the user holds the given permission code.
      can: (code: string) => set.has(code),
      // True if the user holds at least one of the given codes.
      canAny: (codes: string[]) => codes.some((c) => set.has(c)),
      // True if the user holds every one of the given codes.
      canAll: (codes: string[]) => codes.every((c) => set.has(c))
    };
  }, [user]);
}
