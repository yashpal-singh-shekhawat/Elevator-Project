'use client';

import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  Users,
  UserCheck,
  PauseCircle,
  Plus,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/queries/use-platform';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/shared/stat-card';
import { TenantLogo } from '@/components/shared/tenant-logo';
import { HorizontalBarChart, DonutChart } from '@/components/shared/mini-charts';

export default function SuperAdminDashboardPage() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Platform Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of tenants, users and platform activity across ForceLift.
          </p>
        </div>
        <Button asChild>
          <Link href="/super-admin/tenants?create=1">
            <Plus className="h-4 w-4" /> Create Tenant
          </Link>
        </Button>
      </div>

      {/* KPI cards */}
      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Tenants" value={data.totals.totalTenants} icon={Building2} accent="primary" />
          <StatCard
            label="Active Tenants"
            value={data.totals.activeTenants}
            icon={CheckCircle2}
            accent="success"
            hint={`${data.totals.inactiveTenants} inactive`}
          />
          <StatCard label="Total Users" value={data.totals.totalUsers} icon={Users} accent="muted" />
          <StatCard
            label="Active Users"
            value={data.totals.activeUsers}
            icon={UserCheck}
            accent="success"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users by Tenant</CardTitle>
            <CardDescription>Top companies by provisioned users</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <HorizontalBarChart
                data={data.usersByTenant.map((u) => ({ label: u.tenantName, value: u.count }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Status</CardTitle>
            <CardDescription>Active vs inactive workspaces</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-4">
            {isLoading || !data ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <DonutChart
                centerValue={data.totals.totalTenants}
                centerLabel="Tenants"
                segments={[
                  { label: 'Active', value: data.totals.activeTenants, className: 'stroke-success' },
                  { label: 'Inactive', value: data.totals.inactiveTenants, className: 'stroke-destructive' }
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent tenants + recent users */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Tenants</CardTitle>
              <CardDescription>Newest companies on the platform</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/super-admin/tenants">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : data.recentTenants.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No tenants yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {data.recentTenants.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <TenantLogo name={t.companyName} logoUrl={t.logoUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.companyName}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">/{t.companyUniqueCode}</p>
                    </div>
                    <Badge variant={t.status === 'ACTIVE' ? 'success' : 'destructive'}>{t.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest user accounts across all tenants</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : data.recentUsers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {data.recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {u.fullName
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join('') || '—'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      {u.roleName && <Badge variant="secondary">{u.roleName}</Badge>}
                      {u.tenantName && (
                        <span className="text-[11px] text-muted-foreground">{u.tenantName}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common platform administration tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Button asChild variant="outline" className="h-auto justify-start gap-3 py-3">
            <Link href="/super-admin/tenants?create=1">
              <Plus className="h-4 w-4 text-primary" />
              <span className="flex flex-col items-start">
                <span className="text-sm font-medium">New Tenant</span>
                <span className="text-xs text-muted-foreground">Provision a company</span>
              </span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start gap-3 py-3">
            <Link href="/super-admin/tenants">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="flex flex-col items-start">
                <span className="text-sm font-medium">Manage Tenants</span>
                <span className="text-xs text-muted-foreground">Search, edit, suspend</span>
              </span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start gap-3 py-3">
            <Link href="/super-admin/tenants?status=INACTIVE">
              <PauseCircle className="h-4 w-4 text-primary" />
              <span className="flex flex-col items-start">
                <span className="text-sm font-medium">Inactive Tenants</span>
                <span className="text-xs text-muted-foreground">Review suspended</span>
              </span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ExternalLink className="h-3 w-3" />
        Subscriptions &amp; billing analytics arrive in a later phase.
      </p>
    </div>
  );
}
