'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Wrench,
  ClipboardList,
  Building2,
  MapPin,
  ArrowUpDown,
  Database,
  Users,
  Shield,
  LogOut,
  Ticket,
  Boxes,
  Truck,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { getTenantBranding, type TenantBranding } from '@/lib/api/branding';
import { TenantLogo } from '@/components/shared/tenant-logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { extractTenantCode, tenantHref } from '@/lib/tenant';

// Each nav item may declare the permission(s) that reveal it. Items without a
// `permission` are always shown (e.g. the dashboard home). A user sees a link
// if they hold ANY of the listed codes — matching the adaptive, permission-
// driven navigation model.
const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Target, permission: ['customer.view', 'customer.manage'] },
  {
    href: '/installation-projects',
    label: 'Installations',
    icon: Wrench,
    permission: ['installation.view', 'installation.create', 'installation.update']
  },
  { href: '/amc-contracts', label: 'AMC', icon: ClipboardList, permission: ['amc.view', 'amc.create'] },
  { href: '/service-tickets', label: 'Service Tickets', icon: Ticket, permission: ['amc.view', 'amc.visit.log'] },
  { href: '/inventory', label: 'Inventory', icon: Boxes, permission: ['masterdata.view', 'masterdata.manage'] },
  { href: '/vendors', label: 'Vendors', icon: Truck, permission: ['masterdata.view', 'customer.view'] },
  { href: '/invoices', label: 'Invoices', icon: Receipt, permission: ['amc.view', 'customer.view'] },
  { href: '/escalations', label: 'Escalations', icon: AlertTriangle, permission: ['amc.view', 'amc.update'] },
  { href: '/customers', label: 'Customers', icon: Building2, permission: ['customer.view', 'customer.manage'] },
  { href: '/sites', label: 'Sites', icon: MapPin, permission: ['customer.view', 'customer.manage'] },
  { href: '/lifts', label: 'Lifts', icon: ArrowUpDown, permission: ['lift.view', 'lift.manage'] },
  { href: '/master-data', label: 'Master Data', icon: Database, permission: ['masterdata.view', 'masterdata.manage'] },
  { href: '/users', label: 'Users', icon: Users, permission: ['users.manage'] },
  { href: '/roles', label: 'Roles & Permissions', icon: Shield, permission: ['users.manage'] }
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const { canAny } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  // Show a nav item if it declares no permission, or the user holds at least
  // one of its codes. Keeps the sidebar adaptive to each role.
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !('permission' in item) || canAny([...item.permission])
  );

  // Every dashboard URL is tenant-scoped (/acme/leads). Recover the company
  // code from the address bar so nav links and redirects keep the tenant.
  const tenantCode = extractTenantCode(pathname);
  const loginHref = tenantCode ? tenantHref(tenantCode, '/login') : '/login';
  const href = (path: string) => (tenantCode ? tenantHref(tenantCode, path) : path);

  // Tenant branding (name + logo) for the sidebar header. Falls back to the
  // product name when the tenant has no logo/branding set.
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  useEffect(() => {
    if (!tenantCode) return;
    getTenantBranding(tenantCode)
      .then((b) => setBranding(b))
      .catch(() => setBranding(null));
  }, [tenantCode]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(loginHref);
    }
  }, [isLoading, user, router, loginHref]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-5 py-5">
          {branding?.logoUrl ? (
            <TenantLogo name={branding.name} logoUrl={branding.logoUrl} className="h-8 w-8" />
          ) : (
            <div className="h-6 w-1.5 rounded-sm bg-sidebar-active" aria-hidden />
          )}
          <span className="font-display text-sm font-semibold tracking-tight text-white">
            {branding?.name ?? 'Lift SaaS'}
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {visibleNavItems.map((item) => {
            const itemHref = href(item.href);
            const isActive = pathname === itemHref;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={itemHref}
                className={cn(
                  'flex items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-active text-sidebar-active-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4">
          <p className="truncate text-xs font-mono text-sidebar-foreground/70">{user.email}</p>
          <p className="mb-3 truncate text-xs text-sidebar-foreground/50">{user.roleName}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 px-0 text-sidebar-foreground hover:bg-transparent hover:text-white"
            onClick={() => logout().then(() => router.replace(loginHref))}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
