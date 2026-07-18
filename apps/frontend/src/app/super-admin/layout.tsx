'use client';

import { usePathname } from 'next/navigation';
import { PlatformSessionProvider } from './platform-session';
import { PlatformSidebar } from './platform-sidebar';

// Wraps the whole /super-admin/* subtree. The login route renders bare (no
// session guard, no sidebar); every other route gets the guarded console shell.
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/super-admin/login';

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <PlatformSessionProvider>
      <div className="flex min-h-screen bg-background">
        <PlatformSidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">{children}</div>
        </main>
      </div>
    </PlatformSessionProvider>
  );
}
