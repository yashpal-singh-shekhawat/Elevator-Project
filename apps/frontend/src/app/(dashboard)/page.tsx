'use client';

import Link from 'next/link';
import { Wrench, ClipboardList, Ticket, Users, Building2, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Can } from '@/components/shared/can';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Each shortcut is gated by the permission(s) that make it useful. The grid
// adapts to whatever the signed-in user's role can actually do, so a custom
// role only ever sees the sections relevant to it.
const SHORTCUTS = [
  {
    href: '/installation-projects',
    title: 'Installation Projects',
    description: 'Track lift installations from survey to sign-off',
    icon: Wrench,
    permission: ['installation.view', 'installation.create', 'installation.update']
  },
  {
    href: '/amc-contracts',
    title: 'AMC Contracts',
    description: 'Manage service contracts, schedules, and visits',
    icon: ClipboardList,
    permission: ['amc.view', 'amc.create']
  },
  {
    href: '/service-tickets',
    title: 'Service Tickets',
    description: 'Triage, assign and resolve service requests',
    icon: Ticket,
    permission: ['amc.view', 'amc.visit.log']
  },
  {
    href: '/customers',
    title: 'Customers',
    description: 'Customer and site directory',
    icon: Building2,
    permission: ['customer.view', 'customer.manage']
  },
  {
    href: '/lifts',
    title: 'Lifts',
    description: 'Installed lift records and status',
    icon: ArrowUpDown,
    permission: ['lift.view', 'lift.manage']
  },
  {
    href: '/users',
    title: 'Users & Roles',
    description: 'Manage team logins and role permissions',
    icon: Users,
    permission: ['users.manage']
  }
] as const;

export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back, {user?.firstName}</h1>
        <p className="text-sm text-muted-foreground">{user?.roleName}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SHORTCUTS.map((s) => {
          const Icon = s.icon;
          return (
            <Can key={s.href} permission={[...s.permission]}>
              <Link href={s.href}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <div className="rounded-[var(--radius)] bg-accent p-2 text-accent-foreground">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <CardTitle>{s.title}</CardTitle>
                      <CardDescription>{s.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </Can>
          );
        })}
      </div>
    </div>
  );
}
