'use client';

import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { Toaster } from '@/components/toaster';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}
