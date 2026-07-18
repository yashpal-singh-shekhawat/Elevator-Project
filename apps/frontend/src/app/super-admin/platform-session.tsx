'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlatformUserDto } from '@lift-saas/shared-types';
import { platformClient, platformRefresh, setPlatformAccessToken } from '@/lib/platform-client';

interface PlatformSession {
  user: PlatformUserDto;
  signOut: () => Promise<void>;
}

const PlatformSessionContext = createContext<PlatformSession | null>(null);

export function usePlatformSession(): PlatformSession {
  const ctx = useContext(PlatformSessionContext);
  if (!ctx) throw new Error('usePlatformSession must be used within PlatformSessionProvider');
  return ctx;
}

/**
 * Guards every super-admin page: silently refreshes the platform session on
 * mount, redirects to /super-admin/login when there is none, and exposes the
 * signed-in platform user + signOut to the whole subtree. Mirrors the tenant
 * AuthProvider but on the isolated platform client.
 */
export function PlatformSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<PlatformUserDto | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const session = await platformRefresh();
      if (cancelled) return;
      if (!session) {
        router.replace('/super-admin/login');
        return;
      }
      setUser(session.user);
      setStatus('ready');
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function signOut() {
    await platformClient.post('/auth/logout').catch(() => undefined);
    setPlatformAccessToken(null);
    setUser(null);
    router.replace('/super-admin/login');
  }

  if (status === 'loading' || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading platform console…
      </div>
    );
  }

  return (
    <PlatformSessionContext.Provider value={{ user, signOut }}>{children}</PlatformSessionContext.Provider>
  );
}
