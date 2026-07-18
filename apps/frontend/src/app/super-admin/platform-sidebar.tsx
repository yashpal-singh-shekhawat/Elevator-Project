'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, CreditCard, Settings, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePlatformSession } from './platform-session';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
}

// Dashboard first, per the spec. Subscriptions/Platform Settings are future
// (MVP) — shown disabled so the IA matches the ForceLift reference without
// pretending the pages exist.
const NAV: NavItem[] = [
  { href: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super-admin/tenants', label: 'Tenant Management', icon: Building2 },
  { href: '/super-admin/subscriptions', label: 'Subscriptions', icon: CreditCard, disabled: true },
  { href: '/super-admin/settings', label: 'Platform Settings', icon: Settings, disabled: true }
];

export function PlatformSidebar() {
  const pathname = usePathname();
  const { user, signOut } = usePlatformSession();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="h-7 w-1.5 rounded-sm bg-primary" aria-hidden />
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold tracking-tight text-white">ForceLift</p>
          <p className="text-[11px] text-sidebar-foreground/70">Platform Console</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <span
                key={item.href}
                className="flex cursor-not-allowed items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm text-sidebar-foreground/40"
                title="Coming soon"
              >
                <Icon className="h-4 w-4" />
                {item.label}
                <span className="ml-auto rounded-sm bg-sidebar-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  Soon
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-sidebar-active font-medium text-sidebar-active-foreground'
                  : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="mb-2 flex items-center gap-3 rounded-[var(--radius)] px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-active/20 text-sidebar-active-foreground">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/70">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}
